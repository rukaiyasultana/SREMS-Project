<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_json_report(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/reports/summary')
            ->assertOk()
            ->assertJsonStructure([
                'report',
            ]);
    }

    public function test_staff_cannot_view_reports(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/reports/summary')
            ->assertForbidden();
    }

    public function test_customer_cannot_view_reports(): void
    {
        $customer = User::factory()->create([
            'role' => 'user',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/reports/summary')
            ->assertForbidden();
    }

    public function test_authority_can_view_json_report(): void
    {
        $authority = User::factory()->create([
            'role' => 'authority',
        ]);

        $this->actingAs($authority, 'sanctum')
            ->getJson('/api/reports/summary')
            ->assertOk()
            ->assertJsonStructure([
                'report',
            ]);
    }

    public function test_admin_can_request_csv_report(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->get('/api/reports/summary?format=csv');

        $response->assertOk();

        $this->assertStringContainsString(
            'text/csv',
            (string) $response->headers->get('content-type')
        );

        $this->assertStringContainsString(
            '.csv',
            (string) $response->headers->get('content-disposition')
        );
    }

    public function test_unauthenticated_user_cannot_view_reports(): void
    {
        $this->getJson('/api/reports/summary')
            ->assertUnauthorized();
    }
}
