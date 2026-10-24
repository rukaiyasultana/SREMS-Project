<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Installment;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    private function isManager(Request $request): bool
    {
        return in_array(
            strtolower((string) $request->user()->role),
            ['admin', 'authority'],
            true
        );
    }

    public function index(Request $request)
    {
        $query = Payment::with([
            'booking.property',
            'installment',
            'customer:id,name,email',
            'reviewer:id,name',
        ])->latest();

        if (!$this->isManager($request)) {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json([
            'payments' => $query->paginate(20),
        ]);
    }

    public function store(Request $request)
    {
        if (strtolower((string) $request->user()->role) !== 'user') {
            return response()->json([
                'message' => 'Only customer accounts can submit payments.',
            ], 403);
        }

        $data = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'installment_id' => ['required', 'integer', 'exists:installments,id'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999999.99'],
            'payment_method' => [
                'required',
                Rule::in(['bank_transfer', 'mobile_banking', 'cash', 'card', 'online', 'other']),
            ],
            'bank_name' => [
                'required_if:payment_method,bank_transfer',
                'nullable',
                'string',
                'max:120',
            ],
            'bank_slip_number' => [
                'required_if:payment_method,bank_transfer',
                'nullable',
                'string',
                'max:120',
                Rule::unique('payments', 'bank_slip_number')
                    ->where(fn ($query) => $query->where('bank_name', $request->input('bank_name'))),
            ],
            'receipt' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf',
                'max:5120',
            ],
            'transaction_reference' => ['required_if:payment_method,mobile_banking', 'nullable', 'string', 'max:120', 'unique:payments,transaction_reference'],
            'customer_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $payment = DB::transaction(function () use ($request, $data) {
            $booking = Booking::whereKey($data['booking_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ((int) $booking->user_id !== (int) $request->user()->id) {
                abort(403, 'You can submit payments only for your own booking.');
            }

            if ($booking->status !== 'approved') {
                throw ValidationException::withMessages([
                    'booking_id' => 'Payments are allowed only for approved bookings.',
                ]);
            }

            $installment = Installment::whereKey($data['installment_id'])
                ->where('booking_id', $booking->id)
                ->lockForUpdate()
                ->first();

            if (!$installment) {
                throw ValidationException::withMessages([
                    'installment_id' => 'The selected installment does not belong to this booking.',
                ]);
            }

            if ($installment->status === 'paid') {
                throw ValidationException::withMessages([
                    'installment_id' => 'This installment is already fully paid.',
                ]);
            }

            $amountCents = (int) round((float) $data['amount'] * 100);
            $dueCents = (int) round((float) $installment->amount_due * 100);
            $paidCents = (int) round((float) $installment->amount_paid * 100);

            $pendingCents = (int) round(
                (float) Payment::where('installment_id', $installment->id)
                    ->where('status', 'pending')
                    ->sum('amount') * 100
            );

            if ($amountCents <= 0 || $amountCents > ($dueCents - $paidCents - $pendingCents)) {
                throw ValidationException::withMessages([
                    'amount' => 'The payment exceeds the remaining installment balance after pending payments.',
                ]);
            }

            $receiptPath = $request->file('receipt')?->store('payment-receipts', 'local');

            return Payment::create([
                'booking_id' => $booking->id,
                'installment_id' => $installment->id,
                'user_id' => $request->user()->id,
                'amount' => number_format($amountCents / 100, 2, '.', ''),
                'payment_method' => $data['payment_method'],
                'bank_name' => $data['bank_name'] ?? null,
                'bank_slip_number' => $data['bank_slip_number'] ?? null,
                'transaction_reference' => $data['transaction_reference'] ?? null,
                'receipt_path' => $receiptPath,
                'customer_note' => $data['customer_note'] ?? null,
                'status' => 'pending',
            ]);
        });

        return response()->json([
            'message' => 'Payment submitted successfully. It is pending Admin/Authority verification.',
            'payment' => $payment->load(['installment', 'booking.property']),
        ], 201);
    }

    public function downloadReceipt(Request $request, Payment $payment)
    {
        if (
            !$this->isManager($request)
            && (int) $payment->user_id !== (int) $request->user()->id
        ) {
            abort(403, 'You are not authorized to access this receipt.');
        }

        if (
            !$payment->receipt_path
            || !Storage::disk('local')->exists($payment->receipt_path)
        ) {
            abort(404, 'Receipt not found.');
        }

        return Storage::disk('local')->download($payment->receipt_path);
    }
    public function installments(Request $request)
    {
        $query = Installment::with([
            'booking.property',
            'creator:id,name',
        ])->orderBy('booking_id')->orderBy('installment_number');

        if (!$this->isManager($request)) {
            $query->whereHas('booking', function ($bookingQuery) use ($request) {
                $bookingQuery
                    ->where('user_id', $request->user()->id)
                    ->where('status', 'approved');
            });
        }

        if ($request->filled('booking_id')) {
            $request->validate([
                'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            ]);

            $query->where('booking_id', $request->integer('booking_id'));
        }

        return response()->json([
            'installments' => $query->get(),
        ]);
    }
    public function createInstallmentPlan(Request $request, Booking $booking)
    {
        if (!$this->isManager($request)) {
            return response()->json(['message' => 'Only Admin/Authority can create installment plans.'], 403);
        }

        $data = $request->validate([
            'installments' => ['required', 'array', 'min:1', 'max:120'],
            'installments.*.amount_due' => ['required', 'numeric', 'gt:0', 'max:9999999999999.99'],
            'installments.*.due_date' => ['nullable', 'date'],
        ]);

        $created = DB::transaction(function () use ($request, $booking, $data) {
            $lockedBooking = Booking::whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedBooking->status !== 'approved') {
                throw ValidationException::withMessages([
                    'booking' => 'An installment plan can be created only for an approved booking.',
                ]);
            }

            if (Installment::where('booking_id', $lockedBooking->id)->exists()) {
                throw ValidationException::withMessages([
                    'installments' => 'An installment plan already exists for this booking.',
                ]);
            }

            $property = $lockedBooking->property()->firstOrFail();
            $totalCents = 0;
            $amounts = [];

            foreach ($data['installments'] as $item) {
                $cents = (int) round((float) $item['amount_due'] * 100);

                if ($cents <= 0) {
                    throw ValidationException::withMessages([
                        'installments' => 'Every installment amount must be at least 0.01.',
                    ]);
                }

                $amounts[] = $cents;
                $totalCents += $cents;
            }

            $propertyPriceCents = (int) round((float) $property->price * 100);

            if ($totalCents !== $propertyPriceCents) {
                throw ValidationException::withMessages([
                    'installments' => 'The installment amounts must add up exactly to the property price.',
                ]);
            }

            $createdInstallments = [];

            foreach ($data['installments'] as $index => $item) {
                $createdInstallments[] = Installment::create([
                    'booking_id' => $lockedBooking->id,
                    'installment_number' => $index + 1,
                    'amount_due' => number_format($amounts[$index] / 100, 2, '.', ''),
                    'amount_paid' => '0.00',
                    'due_date' => $item['due_date'] ?? null,
                    'status' => 'pending',
                    'created_by' => $request->user()->id,
                ]);
            }

            return $createdInstallments;
        });

        return response()->json([
            'message' => 'Installment plan created successfully.',
            'installments' => $created,
        ], 201);
    }

    public function review(Request $request, Payment $payment)
    {
        if (!$this->isManager($request)) {
            return response()->json(['message' => 'Only Admin/Authority can review payments.'], 403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $updatedPayment = DB::transaction(function () use ($request, $payment, $data) {
            $lockedPayment = Payment::whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => 'Only pending payments can be reviewed.',
                ]);
            }

            if ($data['status'] === 'approved') {
                if (!$lockedPayment->installment_id) {
                    throw ValidationException::withMessages([
                        'payment' => 'This payment has no installment. It cannot be approved.',
                    ]);
                }

                $installment = Installment::whereKey($lockedPayment->installment_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((int) $installment->booking_id !== (int) $lockedPayment->booking_id) {
                    throw ValidationException::withMessages([
                        'payment' => 'Payment and installment booking details do not match.',
                    ]);
                }

                $amountCents = (int) round((float) $lockedPayment->amount * 100);
                $dueCents = (int) round((float) $installment->amount_due * 100);
                $paidCents = (int) round((float) $installment->amount_paid * 100);

                $otherPendingCents = (int) round(
                    (float) Payment::where('installment_id', $installment->id)
                        ->where('status', 'pending')
                        ->where('id', '!=', $lockedPayment->id)
                        ->sum('amount') * 100
                );

                if (
                    $amountCents <= 0 ||
                    $amountCents > ($dueCents - $paidCents - $otherPendingCents)
                ) {
                    throw ValidationException::withMessages([
                        'payment' => 'Approval would exceed the installment balance. Review the payment manually.',
                    ]);
                }

                $newPaidCents = $paidCents + $amountCents;

                $installment->amount_paid = number_format($newPaidCents / 100, 2, '.', '');
                $installment->status = $newPaidCents >= $dueCents ? 'paid' : 'partially_paid';
                $installment->save();
            }

            $lockedPayment->status = $data['status'];
            $lockedPayment->reviewed_by = $request->user()->id;
            $lockedPayment->reviewed_at = now();
            $lockedPayment->admin_note = $data['admin_note'] ?? null;
            $lockedPayment->save();

            return $lockedPayment;
        });

        return response()->json([
            'message' => 'Payment ' . $data['status'] . ' successfully.',
            'payment' => $updatedPayment->load([
                'booking.property',
                'installment',
                'customer:id,name,email',
                'reviewer:id,name',
            ]),
        ]);
    }
}
