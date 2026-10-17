<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyStatusValidationTest extends TestCase
{
    use RefreshDatabase;

    private function createProperty(User $admin): Property
    {
        return Property::create([
            'property_code' => 'PSV-' . uniqid(),
            'property_name' => 'Status Validation Test',
            'project_name' => 'Test Project',
            'property_type' => 'apartment',
            'location' => 'Test Location',
            'size_sqft' => 1000,
            'price' => 2500000,
            'status' => 'available',
            'created_by' => $admin->id,
        ]);
    }

    public function test_under_construction_status_is_allowed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $property = $this->createProperty($admin);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/properties/{$property->id}", [
                'status' => 'under_construction',
            ])
            ->assertOk();

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'under_construction',
        ]);
    }

    public function test_unavailable_status_is_allowed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $property = $this->createProperty($admin);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/properties/{$property->id}", [
                'status' => 'unavailable',
            ])
            ->assertOk();

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'status' => 'unavailable',
        ]);
    }
}
