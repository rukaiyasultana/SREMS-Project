<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingPropertyStatusTest extends TestCase
{
    use RefreshDatabase;

    private function createAvailableProperty(User $creator): Property
    {
        return Property::create([
            'property_code' => 'BPS-' . uniqid(),
            'property_name' => 'Booking Status Test Property',
            'project_name' => 'Test Project',
            'property_type' => 'apartment',
            'location' => 'Test Location',
            'size_sqft' => 1200,
            'price' => 5000000,
            'status' => 'available',
            'created_by' => $creator->id,
        ]);
    }

    private function createPendingBooking(
        User $customer,
        Property $property
    ): Booking {
        return Booking::create([
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'requested_date' => now()->addDays(2)->toDateString(),
            'message' => 'Booking status automated test',
            'status' => 'pending',
        ]);
    }

    public function test_approving_booking_reserves_the_property(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);

        $property = $this->createAvailableProperty($admin);
        $booking = $this->createPendingBooking($customer, $property);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/bookings/{$booking->id}/review", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('booking.status', 'approved')
            ->assertJsonPath('booking.property.status', 'reserved');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'reserved',
        ]);
    }

    public function test_rejecting_booking_keeps_property_available(): void
    {
        $authority = User::factory()->create(['role' => 'authority']);
        $customer = User::factory()->create(['role' => 'user']);

        $property = $this->createAvailableProperty($authority);
        $booking = $this->createPendingBooking($customer, $property);

        $this->actingAs($authority, 'sanctum')
            ->patchJson("/api/bookings/{$booking->id}/review", [
                'status' => 'rejected',
            ])
            ->assertOk()
            ->assertJsonPath('booking.status', 'rejected');

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'available',
        ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'rejected',
        ]);
    }

    public function test_booking_cannot_be_approved_if_property_is_not_available(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);

        $property = $this->createAvailableProperty($admin);
        $booking = $this->createPendingBooking($customer, $property);

        $property->update(['status' => 'reserved']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/bookings/{$booking->id}/review", [
                'status' => 'approved',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'reserved',
        ]);
    }

    public function test_customer_cannot_review_a_booking(): void
    {
        $creator = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);

        $property = $this->createAvailableProperty($creator);
        $booking = $this->createPendingBooking($customer, $property);

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/bookings/{$booking->id}/review", [
                'status' => 'approved',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'available',
        ]);
    }

    public function test_property_with_approved_booking_cannot_be_marked_available(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);

        $property = $this->createAvailableProperty($admin);
        $booking = $this->createPendingBooking($customer, $property);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/bookings/{$booking->id}/review", [
                'status' => 'approved',
            ])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/properties/{$property->id}", [
                'status' => 'available',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'reserved',
        ]);
    }

    public function test_second_customer_cannot_book_property_with_approved_booking(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $firstCustomer = User::factory()->create(['role' => 'user']);
        $secondCustomer = User::factory()->create(['role' => 'user']);

        $property = $this->createAvailableProperty($admin);
        $booking = $this->createPendingBooking($firstCustomer, $property);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/bookings/{$booking->id}/review", [
                'status' => 'approved',
            ])
            ->assertOk();

        $this->actingAs($secondCustomer, 'sanctum')
            ->postJson('/api/bookings', [
                'property_id' => $property->id,
                'message' => 'Second customer booking attempt',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('bookings', 1);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'reserved',
        ]);
    }
}
