<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    private function isManager(Request $request): bool
    {
        return in_array(
            strtolower((string) $request->user()->role),
            ['admin', 'authority'],
            true
        );
    }

    /**
     * Managers see all bookings.
     * Customers see only their own bookings.
     */
    public function index(Request $request)
    {
        $query = Booking::with([
            'customer:id,name,email',
            'property:id,property_code,property_name,price,status',
            'reviewer:id,name',
        ])->latest();

        if (! $this->isManager($request)) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $request->validate([
                'status' => [
                    'string',
                    Rule::in([
                        'pending',
                        'approved',
                        'rejected',
                        'cancelled',
                    ]),
                ],
            ]);

            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Create a pending booking request.
     */
    public function store(Request $request)
    {
        if ($this->isManager($request)) {
            return response()->json([
                'message' => 'Admin and Authority accounts cannot submit customer booking requests.',
            ], 403);
        }

        if (strtolower((string) $request->user()->role) !== 'user') {
            return response()->json([
                'message' => 'Only customer accounts can submit booking requests.',
            ], 403);
        }

        $validated = $request->validate([
            'property_id' => [
                'required',
                'integer',
                'exists:properties,id',
            ],
            'requested_date' => [
                'nullable',
                'date',
                'after_or_equal:today',
            ],
            'message' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $booking = DB::transaction(function () use ($request, $validated) {
            $property = Property::whereKey($validated['property_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($property->status !== 'available') {
                abort(422, 'This property is not currently available.');
            }

            $existingRequest = Booking::where(
                'user_id',
                $request->user()->id
            )
                ->where('property_id', $property->id)
                ->whereIn('status', ['pending', 'approved'])
                ->exists();

            if ($existingRequest) {
                abort(422, 'You already have a pending or approved booking for this property.');
            }

            return Booking::create([
                'user_id' => $request->user()->id,
                'property_id' => $property->id,
                'requested_date' => $validated['requested_date'] ?? null,
                'message' => $validated['message'] ?? null,
                'status' => 'pending',
            ]);
        });

        return response()->json([
            'message' => 'Booking request submitted. It is pending Admin/Authority approval.',
            'booking' => $booking->load([
                'property:id,property_code,property_name,price,status',
            ]),
        ], 201);
    }

    /**
     * View one booking.
     */
    public function show(Request $request, Booking $booking)
    {
        if (
            ! $this->isManager($request) &&
            (int) $booking->user_id !== (int) $request->user()->id
        ) {
            return response()->json([
                'message' => 'You are not allowed to view this booking.',
            ], 403);
        }

        return response()->json([
            'booking' => $booking->load([
                'customer:id,name,email',
                'property:id,property_code,property_name,price,status,location',
                'reviewer:id,name',
            ]),
        ]);
    }

    /**
     * Approve or reject a pending booking.
     */
    public function review(Request $request, Booking $booking)
    {
        if (! $this->isManager($request)) {
            return response()->json([
                'message' => 'Only Admin or Authority can review bookings.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['approved', 'rejected']),
            ],
            'admin_note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $updatedBooking = DB::transaction(function () use (
            $request,
            $booking,
            $validated
        ) {
            $lockedBooking = Booking::whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedBooking->status !== 'pending') {
                abort(422, 'Only pending booking requests can be reviewed.');
            }

            $property = Property::whereKey($lockedBooking->property_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($validated['status'] === 'approved') {
                if ($property->status !== 'available') {
                    abort(422, 'This property is no longer available. The request cannot be approved.');
                }

                $property->status = 'reserved';
                $property->save();
            }

            $lockedBooking->status = $validated['status'];
            $lockedBooking->reviewed_by = $request->user()->id;
            $lockedBooking->reviewed_at = now();
            $lockedBooking->admin_note = $validated['admin_note'] ?? null;
            $lockedBooking->save();

            return $lockedBooking;
        });

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'Booking approved and property reserved.'
                : 'Booking request rejected.',
            'booking' => $updatedBooking->load([
                'customer:id,name,email',
                'property:id,property_code,property_name,price,status',
                'reviewer:id,name',
            ]),
        ]);
    }

    /**
     * A customer can cancel their own pending request.
     */
    public function cancel(Request $request, Booking $booking)
    {
        if ($this->isManager($request)) {
            return response()->json([
                'message' => 'Use the Admin booking workflow to manage bookings.',
            ], 403);
        }

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'You are not allowed to cancel this booking.',
            ], 403);
        }

        $cancelled = DB::transaction(function () use ($booking) {
            $lockedBooking = Booking::whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedBooking->status !== 'pending') {
                abort(422, 'Only pending booking requests can be cancelled.');
            }

            $lockedBooking->status = 'cancelled';
            $lockedBooking->save();

            return $lockedBooking;
        });

        return response()->json([
            'message' => 'Booking request cancelled.',
            'booking' => $cancelled,
        ]);
    }
}
