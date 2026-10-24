<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    private function authorizeManager(Request $request): void
    {
        $role = strtolower((string) $request->user()->role);

        abort_unless(
            in_array($role, ['admin', 'authority'], true),
            403,
            'Only Admin and Authority accounts can access financial reports.'
        );
    }

    public function summary(Request $request)
    {
        $this->authorizeManager($request);

        $today = Carbon::today()->toDateString();

        $propertyStatuses = DB::table('properties')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        $bookingStatuses = DB::table('bookings')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        $paymentStatuses = DB::table('payments')
            ->select(
                'status',
                DB::raw('COUNT(*) as total'),
                DB::raw('COALESCE(SUM(amount), 0) as amount')
            )
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        $propertyTotal = DB::table('properties')->count();
        $propertyValue = (float) DB::table('properties')->sum('price');

        $bookingTotal = DB::table('bookings')->count();
        $paymentTotal = DB::table('payments')->count();

        $installmentStats = DB::table('installments')
            ->selectRaw('
                COUNT(*) as total,
                COALESCE(SUM(amount_due), 0) as due_total,
                COALESCE(SUM(amount_paid), 0) as paid_total,
                COALESCE(SUM(
                    CASE
                        WHEN due_date IS NOT NULL
                         AND due_date < ?
                         AND amount_due > amount_paid
                        THEN amount_due - amount_paid
                        ELSE 0
                    END
                ), 0) as overdue_amount,
                SUM(
                    CASE
                        WHEN due_date IS NOT NULL
                         AND due_date < ?
                         AND amount_due > amount_paid
                        THEN 1
                        ELSE 0
                    END
                ) as overdue_count
            ', [$today, $today])
            ->first();

        $paymentStatusMap = [];
        foreach ($paymentStatuses as $row) {
            $paymentStatusMap[$row->status] = [
                'count' => (int) $row->total,
                'amount' => (float) $row->amount,
            ];
        }

        $bookingStatusMap = [];
        foreach ($bookingStatuses as $row) {
            $bookingStatusMap[$row->status] = (int) $row->total;
        }

        $propertyStatusMap = [];
        foreach ($propertyStatuses as $row) {
            $propertyStatusMap[$row->status ?? 'unknown'] = (int) $row->total;
        }

        $summary = [
            'generated_at' => now()->toIso8601String(),
            'properties' => [
                'total' => $propertyTotal,
                'inventory_value' => $propertyValue,
                'by_status' => $propertyStatusMap,
            ],
            'bookings' => [
                'total' => $bookingTotal,
                'by_status' => $bookingStatusMap,
            ],
            'payments' => [
                'total' => $paymentTotal,
                'by_status' => $paymentStatusMap,
                'approved_count' => $paymentStatusMap['approved']['count'] ?? 0,
                'approved_amount' => $paymentStatusMap['approved']['amount'] ?? 0,
                'pending_count' => $paymentStatusMap['pending']['count'] ?? 0,
                'pending_amount' => $paymentStatusMap['pending']['amount'] ?? 0,
                'rejected_count' => $paymentStatusMap['rejected']['count'] ?? 0,
                'rejected_amount' => $paymentStatusMap['rejected']['amount'] ?? 0,
            ],
            'installments' => [
                'total' => (int) ($installmentStats->total ?? 0),
                'due_total' => (float) ($installmentStats->due_total ?? 0),
                'paid_total' => (float) ($installmentStats->paid_total ?? 0),
                'remaining_total' => max(
                    0,
                    (float) ($installmentStats->due_total ?? 0)
                    - (float) ($installmentStats->paid_total ?? 0)
                ),
                'overdue_count' => (int) ($installmentStats->overdue_count ?? 0),
                'overdue_amount' => (float) ($installmentStats->overdue_amount ?? 0),
            ],
        ];

        if ($request->query('format') === 'csv') {
            $rows = [
                ['SREMS Financial Report', 'Value'],
                ['Generated At', $summary['generated_at']],
                ['Properties - Total', $summary['properties']['total']],
                ['Properties - Inventory Value', $summary['properties']['inventory_value']],
            ];

            foreach ($propertyStatusMap as $status => $count) {
                $rows[] = ['Properties - Status - ' . $status, $count];
            }

            $rows[] = ['Bookings - Total', $summary['bookings']['total']];
            foreach ($bookingStatusMap as $status => $count) {
                $rows[] = ['Bookings - Status - ' . $status, $count];
            }

            $rows[] = ['Payments - Total Records', $summary['payments']['total']];
            $rows[] = ['Payments - Approved Amount', $summary['payments']['approved_amount']];
            $rows[] = ['Payments - Pending Amount', $summary['payments']['pending_amount']];
            $rows[] = ['Payments - Rejected Amount', $summary['payments']['rejected_amount']];
            $rows[] = ['Payments - Approved Count', $summary['payments']['approved_count']];
            $rows[] = ['Payments - Pending Count', $summary['payments']['pending_count']];
            $rows[] = ['Payments - Rejected Count', $summary['payments']['rejected_count']];
            $rows[] = ['Installments - Total Due', $summary['installments']['due_total']];
            $rows[] = ['Installments - Total Paid', $summary['installments']['paid_total']];
            $rows[] = ['Installments - Remaining Due', $summary['installments']['remaining_total']];
            $rows[] = ['Installments - Overdue Count', $summary['installments']['overdue_count']];
            $rows[] = ['Installments - Overdue Amount', $summary['installments']['overdue_amount']];

            return response()->streamDownload(function () use ($rows) {
                $output = fopen('php://output', 'w');


                foreach ($rows as $row) {
                    fputcsv($output, $row);
                }

                fclose($output);
            }, 'srems_report_' . now()->format('Ymd_His') . '.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        return response()->json(['report' => $summary]);
    }
}
