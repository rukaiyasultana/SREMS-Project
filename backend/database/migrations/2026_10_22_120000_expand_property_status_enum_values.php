<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("
            ALTER TABLE `properties`
            MODIFY `status` ENUM(
                'available',
                'reserved',
                'sold',
                'rented',
                'under_construction',
                'unavailable'
            ) NOT NULL DEFAULT 'available'
        ");
    }

    public function down(): void
    {
        // Keep the expanded status values to protect existing records.
    }
};