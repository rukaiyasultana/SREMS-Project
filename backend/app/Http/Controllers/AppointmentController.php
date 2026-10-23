<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
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
        $query = Appointment::with([
            'customer:id,name,email',
            'property',
            'reviewer:id,name',
        ]);

        if (!$this->isManager($request)) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $request->validate([
                'status' => [
                    Rule::in(['pending', 'approved', 'rejected', 'cancelled']),
                ],
            ]);

            $query->where('status', $request->status);
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        if ($this->isManager($request)) {
            return response()->json([
                'message' => 'Only customer accounts can request appointments.',
            ], 403);
        }

        if (strtolower((string) $request->user()->role) !== 'user') {
            return response()->json([
                'message' => 'Your account is not permitted to request appointments.',
            ], 403);
        }

        $validated = $request->validate([
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', 'date_format:H:i'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $property = Property::findOrFail($validated['property_id']);

        $duplicate = Appointment::where('user_id', $request->user()->id)
            ->where('property_id', $property->id)
            ->where('status', 'pending')
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'You already have a pending appointment request for this property.',
            ], 422);
        }

        $appointment = Appointment::create([
            'user_id' => $request->user()->id,
            'property_id' => $property->id,
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'message' => $validated['message'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Appointment request submitted successfully. It is pending Admin/Authority review.',
            'appointment' => $appointment->load([
                'customer:id,name,email',
                'property',
                'reviewer:id,name',
            ]),
        ], 201);
    }

    public function show(Request $request, Appointment $appointment)
    {
        if (!$this->isManager($request) &&
            (int) $appointment->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(
            $appointment->load([
                'customer:id,name,email',
                'property',
                'reviewer:id,name',
            ])
        );
    }

    public function review(Request $request, Appointment $appointment)
    {
        if (!$this->isManager($request)) {
            return response()->json([
                'message' => 'Only Admin/Authority can review appointments.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $updatedAppointment = DB::transaction(function () use (
            $request,
            $appointment,
            $validated
        ) {
            $lockedAppointment = Appointment::whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedAppointment->status !== 'pending') {
                abort(422, 'Only pending appointments can be reviewed.');
            }

            $lockedAppointment->status = $validated['status'];
            $lockedAppointment->admin_note = $validated['admin_note'] ?? null;
            $lockedAppointment->reviewed_by = $request->user()->id;
            $lockedAppointment->reviewed_at = now();
            $lockedAppointment->save();

            return $lockedAppointment;
        });

        return response()->json([
            'message' => 'Appointment ' . $validated['status'] . ' successfully.',
            'appointment' => $updatedAppointment->load([
                'customer:id,name,email',
                'property',
                'reviewer:id,name',
            ]),
        ]);
    }
    public function cancel(Request $request, Appointment $appointment)
    {
        if ((int) $appointment->user_id !== (int) $request->user()->id ||
            $this->isManager($request)) {
            return response()->json([
                'message' => 'You can only cancel your own pending appointment.',
            ], 403);
        }

        $cancelledAppointment = DB::transaction(function () use ($appointment) {
            $lockedAppointment = Appointment::whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedAppointment->status !== 'pending') {
                abort(422, 'Only pending appointments can be cancelled.');
            }

            $lockedAppointment->status = 'cancelled';
            $lockedAppointment->save();

            return $lockedAppointment;
        });

        return response()->json([
            'message' => 'Appointment cancelled successfully.',
            'appointment' => $cancelledAppointment,
        ]);
    }
}