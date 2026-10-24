<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Installment;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_protected_user_endpoint(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->postJson('/api/login', [
            'email' => 'invalid-user@example.test',
            'password' => 'Incorrect-Password-123!',
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_accounts(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/users', [
                'name' => 'New Staff',
                'email' => 'new.staff@example.test',
                'password' => 'SecurePass123!',
                'role' => 'staff',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', [
            'email' => 'new.staff@example.test',
        ]);
    }

    public function test_authority_cannot_create_admin_accounts(): void
    {
        $authority = User::factory()->create(['role' => 'authority']);

        $this->actingAs($authority, 'sanctum')
            ->postJson('/api/admin/users', [
                'name' => 'New Admin',
                'email' => 'new.admin@example.test',
                'password' => 'SecurePass123!',
                'role' => 'admin',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseMissing('users', [
            'email' => 'new.admin@example.test',
        ]);
    }

    public function test_admin_can_create_staff_without_exposing_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/users', [
                'name' => 'New Staff',
                'email' => 'new.staff@example.test',
                'password' => 'SecurePass123!',
                'role' => 'staff',
            ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'new.staff@example.test')
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('password');

        $this->assertDatabaseHas('users', [
            'email' => 'new.staff@example.test',
            'role' => 'staff',
        ]);
    }

    private function createPropertyFor(User $creator): Property
    {
        return Property::create([
            'property_code' => 'TEST-' . uniqid(),
            'property_name' => 'Test Property',
            'project_name' => 'Test Project',
            'property_type' => 'Apartment',
            'location' => 'Test Location',
            'size_sqft' => 1200,
            'price' => 5000000,
            'status' => 'available',
            'created_by' => $creator->id,
        ]);
    }

    private function createBookingFor(User $customer): Booking
    {
        $property = $this->createPropertyFor($customer);

        return Booking::create([
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'status' => 'pending',
            'message' => 'Automated security test',
        ]);
    }

    private function createAppointmentFor(User $customer): Appointment
    {
        $property = $this->createPropertyFor($customer);

        return Appointment::create([
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '10:30:00',
            'status' => 'pending',
            'message' => 'Automated security test',
        ]);
    }

    public function test_customer_cannot_view_another_customers_booking(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $otherCustomer = User::factory()->create(['role' => 'user']);
        $booking = $this->createBookingFor($owner);

        $this->actingAs($otherCustomer, 'sanctum')
            ->getJson('/api/bookings/' . $booking->id)
            ->assertForbidden();
    }

    public function test_customer_cannot_cancel_another_customers_booking(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $otherCustomer = User::factory()->create(['role' => 'user']);
        $booking = $this->createBookingFor($owner);

        $this->actingAs($otherCustomer, 'sanctum')
            ->patchJson('/api/bookings/' . $booking->id . '/cancel')
            ->assertForbidden();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'user_id' => $owner->id,
            'status' => 'pending',
        ]);
    }

    public function test_customer_cannot_view_another_customers_appointment(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $otherCustomer = User::factory()->create(['role' => 'user']);
        $appointment = $this->createAppointmentFor($owner);

        $this->actingAs($otherCustomer, 'sanctum')
            ->getJson('/api/appointments/' . $appointment->id)
            ->assertForbidden();
    }

    public function test_customer_cannot_cancel_another_customers_appointment(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $otherCustomer = User::factory()->create(['role' => 'user']);
        $appointment = $this->createAppointmentFor($owner);

        $this->actingAs($otherCustomer, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/cancel')
            ->assertForbidden();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'user_id' => $owner->id,
            'status' => 'pending',
        ]);
    }

    public function test_cancelled_appointment_cannot_be_reviewed(): void
    {
        $customer = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);
        $appointment = $this->createAppointmentFor($customer);

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/cancel')
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_approved_appointment_cannot_be_cancelled_by_customer(): void
    {
        $customer = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);
        $appointment = $this->createAppointmentFor($customer);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertOk();

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/cancel')
            ->assertUnprocessable();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'approved',
        ]);
    }

    public function test_already_reviewed_appointment_cannot_be_reviewed_again(): void
    {
        $customer = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);
        $appointment = $this->createAppointmentFor($customer);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/review', [
                'status' => 'approved',
                'admin_note' => 'Approved in test',
            ])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/review', [
                'status' => 'rejected',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'approved',
            'admin_note' => 'Approved in test',
        ]);
    }
    public function test_customer_cannot_review_an_appointment(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $customer = User::factory()->create(['role' => 'user']);
        $appointment = $this->createAppointmentFor($owner);

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/appointments/' . $appointment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'pending',
            'reviewed_by' => null,
        ]);
    }

    private function createPaymentFor(User $customer, string $status = 'pending'): Payment
    {
        $property = $this->createPropertyFor($customer);

        $booking = Booking::create([
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'status' => 'approved',
            'message' => 'Payment security test',
        ]);

        $installment = Installment::create([
            'booking_id' => $booking->id,
            'installment_number' => 1,
            'amount_due' => '5000000.00',
            'amount_paid' => '0.00',
            'status' => 'pending',
            'created_by' => $customer->id,
        ]);

        return Payment::create([
            'booking_id' => $booking->id,
            'installment_id' => $installment->id,
            'user_id' => $customer->id,
            'amount' => '1000.00',
            'payment_method' => 'cash',
            'status' => $status,
        ]);
    }

    public function test_customer_payment_list_does_not_include_other_customers_payments(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $otherCustomer = User::factory()->create(['role' => 'user']);

        $ownPayment = $this->createPaymentFor($owner);
        $otherPayment = $this->createPaymentFor($otherCustomer);

        $response = $this->actingAs($owner, 'sanctum')
            ->getJson('/api/payments')
            ->assertOk();

        $paymentIds = collect($response->json('payments.data'))
            ->pluck('id')
            ->all();

        $this->assertContains($ownPayment->id, $paymentIds);
        $this->assertNotContains($otherPayment->id, $paymentIds);
    }

    public function test_authority_can_review_a_pending_payment(): void
    {
        $authority = User::factory()->create(['role' => 'authority']);
        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($customer);

        $this->actingAs($authority, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
                'admin_note' => 'Verified by authority',
            ])
            ->assertOk()
            ->assertJsonPath('payment.status', 'approved');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'approved',
            'reviewed_by' => $authority->id,
            'admin_note' => 'Verified by authority',
        ]);

        $this->assertNotNull(
            Payment::findOrFail($payment->id)->reviewed_at
        );

        $this->assertDatabaseHas('installments', [
            'id' => $payment->installment_id,
            'amount_paid' => '1000.00',
            'status' => 'partially_paid',
        ]);
    }

    public function test_staff_cannot_review_a_payment(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($customer);

        $this->actingAs($staff, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
            'reviewed_by' => null,
            'reviewed_at' => null,
        ]);

        $this->assertDatabaseHas('installments', [
            'id' => $payment->installment_id,
            'amount_paid' => '0.00',
            'status' => 'pending',
        ]);
    }
    public function test_customer_cannot_review_a_payment(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($owner);

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
            'reviewed_by' => null,
        ]);
    }

    public function test_customer_cannot_create_an_installment_plan(): void
    {
        $customer = User::factory()->create(['role' => 'user']);
        $booking = $this->createBookingFor($customer);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/bookings/' . $booking->id . '/installments', [
                'installments' => [
                    ['amount_due' => 5000000],
                ],
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('installments', [
            'booking_id' => $booking->id,
        ]);
    }

    public function test_customer_installment_list_excludes_other_customers_bookings(): void
    {
        $customer = User::factory()->create(['role' => 'user']);
        $otherCustomer = User::factory()->create(['role' => 'user']);

        $ownBooking = $this->createBookingFor($customer);
        $ownBooking->update(['status' => 'approved']);

        $otherBooking = $this->createBookingFor($otherCustomer);
        $otherBooking->update(['status' => 'approved']);

        $ownInstallment = Installment::create([
            'booking_id' => $ownBooking->id,
            'installment_number' => 1,
            'amount_due' => '5000000.00',
            'amount_paid' => '0.00',
            'status' => 'pending',
            'created_by' => $customer->id,
        ]);

        $otherInstallment = Installment::create([
            'booking_id' => $otherBooking->id,
            'installment_number' => 1,
            'amount_due' => '5000000.00',
            'amount_paid' => '0.00',
            'status' => 'pending',
            'created_by' => $otherCustomer->id,
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson('/api/installments')
            ->assertOk();

        $installmentIds = collect($response->json('installments'))
            ->pluck('id')
            ->all();

        $this->assertContains($ownInstallment->id, $installmentIds);
        $this->assertNotContains($otherInstallment->id, $installmentIds);
    }

    public function test_customer_can_download_own_payment_receipt(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');

        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($customer);

        $receiptPath = 'receipts/security-test.pdf';
        \Illuminate\Support\Facades\Storage::disk('local')
            ->put($receiptPath, 'Test receipt content');

        $payment->update(['receipt_path' => $receiptPath]);

        $this->actingAs($customer, 'sanctum')
            ->get('/api/payments/' . $payment->id . '/receipt')
            ->assertOk()
            ->assertHeader('content-disposition');
    }

    public function test_customer_cannot_download_another_customers_payment_receipt(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');

        $owner = User::factory()->create(['role' => 'user']);
        $otherCustomer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($owner);

        $receiptPath = 'receipts/another-customer.pdf';
        \Illuminate\Support\Facades\Storage::disk('local')
            ->put($receiptPath, 'Private receipt content');

        $payment->update(['receipt_path' => $receiptPath]);

        $this->actingAs($otherCustomer, 'sanctum')
            ->get('/api/payments/' . $payment->id . '/receipt')
            ->assertForbidden();
    }

    public function test_admin_can_download_payment_receipt(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');

        $customer = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);
        $payment = $this->createPaymentFor($customer);

        $receiptPath = 'receipts/admin-access-test.pdf';
        \Illuminate\Support\Facades\Storage::disk('local')
            ->put($receiptPath, 'Admin receipt test');

        $payment->update(['receipt_path' => $receiptPath]);

        $this->actingAs($admin, 'sanctum')
            ->get('/api/payments/' . $payment->id . '/receipt')
            ->assertOk()
            ->assertHeader('content-disposition');
    }

    public function test_approved_partial_payment_updates_installment_balance(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($customer);

        $payment->update(['amount' => '1000.00']);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertOk();

        $response->assertJsonPath('payment.status', 'approved');

        $this->assertDatabaseHas('installments', [
            'id' => $payment->installment_id,
            'amount_paid' => '1000.00',
            'status' => 'partially_paid',
        ]);
    }

    public function test_fully_paid_installment_is_marked_paid(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($customer);

        Installment::whereKey($payment->installment_id)->update([
            'amount_due' => '1000.00',
            'amount_paid' => '0.00',
        ]);

        $payment->update(['amount' => '1000.00']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertOk();

        $this->assertDatabaseHas('installments', [
            'id' => $payment->installment_id,
            'amount_paid' => '1000.00',
            'status' => 'paid',
        ]);
    }

    public function test_payment_cannot_be_approved_above_remaining_installment_balance(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($customer);

        Installment::whereKey($payment->installment_id)->update([
            'amount_due' => '1000.00',
            'amount_paid' => '500.00',
        ]);

        $payment->update(['amount' => '600.00']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('installments', [
            'id' => $payment->installment_id,
            'amount_paid' => '500.00',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
    }

    public function test_pending_payments_reserve_installment_balance_until_reviewed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);
        $firstPayment = $this->createPaymentFor($customer);

        Installment::whereKey($firstPayment->installment_id)->update([
            'amount_due' => '1000.00',
            'amount_paid' => '0.00',
        ]);

        $firstPayment->update(['amount' => '700.00']);

        $secondPayment = Payment::create([
            'booking_id' => $firstPayment->booking_id,
            'installment_id' => $firstPayment->installment_id,
            'user_id' => $customer->id,
            'amount' => '400.00',
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $firstPayment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('payments', [
            'id' => $firstPayment->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('installments', [
            'id' => $firstPayment->installment_id,
            'amount_paid' => '0.00',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $secondPayment->id . '/review', [
                'status' => 'rejected',
            ])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $firstPayment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('payment.status', 'approved');

        $this->assertDatabaseHas('payments', [
            'id' => $secondPayment->id,
            'status' => 'rejected',
        ]);

        $this->assertDatabaseHas('installments', [
            'id' => $firstPayment->installment_id,
            'amount_paid' => '700.00',
            'status' => 'partially_paid',
        ]);
    }
    public function test_already_reviewed_payment_cannot_be_approved_again(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);
        $payment = $this->createPaymentFor($customer);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/payments/' . $payment->id . '/review', [
                'status' => 'approved',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('installments', [
            'id' => $payment->installment_id,
            'amount_paid' => '1000.00',
        ]);
    }
}
