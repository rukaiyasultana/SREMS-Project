<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyDeletionSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_property_images_remain_when_deletion_is_blocked_by_booking(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);

        $property = Property::create([
            'property_code' => 'TEST-DELETE-001',
            'property_name' => 'Deletion Safety Test Property',
            'project_name' => 'Test Project',
            'property_type' => 'apartment',
            'location' => 'Test Location',
            'size_sqft' => 1000,
            'price' => 5000000,
            'status' => 'available',
            'description' => 'Property deletion safety test.',
            'created_by' => $admin->id,
        ]);

        $imagePath = 'properties/test-delete-safety.jpg';
        Storage::disk('public')->put($imagePath, 'test image content');

        $image = PropertyImage::create([
            'property_id' => $property->id,
            'image_path' => $imagePath,
            'image_name' => 'test-delete-safety.jpg',
            'is_primary' => true,
        ]);

        $booking = Booking::create([
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'status' => 'pending',
            'message' => 'Keep this linked property.',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/properties/' . $property->id)
            ->assertStatus(409);

        $this->assertDatabaseHas('properties', ['id' => $property->id]);
        $this->assertDatabaseHas('property_images', [
            'id' => $image->id,
            'property_id' => $property->id,
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'property_id' => $property->id,
        ]);

        Storage::disk('public')->assertExists($imagePath);
    }
}
