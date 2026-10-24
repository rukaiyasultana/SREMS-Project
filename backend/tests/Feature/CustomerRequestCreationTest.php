<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerRequestCreationTest extends TestCase
{
    use RefreshDatabase;

    private function createAvailableProperty(User $creator): Property
    {
        return Property::create([
            'property_code' => 'CRC-' . uniqid(),
            'property_name' => 'Customer Request Test Property',
            'project_name' => 'Test Project',
            'property_type' => 'Apartment',
            'location' => 'Test Location',
            'size_sqft' => 1200,
            'price' => 5000000,
            'status' => 'available',
            'created_by' => $creator->id,
        ]);
    }

    public function test_customer_can_submit_booking_request_as_pending(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);
        $property = $this->createAvailableProperty($admin);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/bookings', [
                'property_id' => $property->id,
                'requested_date' => now()->addDays(2)->toDateString(),
                'message' => 'Automated booking creation test',
            ])
            ->assertCreated()
            ->assertJsonPath('booking.status', 'pending')
            ->assertJsonPath('booking.property.id', $property->id);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'available',
        ]);
    }

    public function test_customer_can_submit_appointment_request_as_pending(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);
        $property = $this->createAvailableProperty($admin);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/appointments', [
                'property_id' => $property->id,
                'appointment_date' => now()->addDays(2)->toDateString(),
                'appointment_time' => '10:30',
                'message' => 'Automated appointment creation test',
            ])
            ->assertCreated()
            ->assertJsonPath('appointment.status', 'pending')
            ->assertJsonPath('appointment.property.id', $property->id);

        $this->assertDatabaseHas('appointments', [
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'status' => 'pending',
        ]);
    }
}
