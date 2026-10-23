<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('property_images', 'property_id')) {
            Schema::table('property_images', function (Blueprint $table) {
                $table->foreignId('property_id')
                    ->nullable()
                    ->constrained('properties')
                    ->cascadeOnDelete();
            });
        }

        if (!Schema::hasColumn('property_images', 'image_path')) {
            Schema::table('property_images', function (Blueprint $table) {
                $table->string('image_path')->nullable();
            });
        }

        if (!Schema::hasColumn('property_images', 'image_name')) {
            Schema::table('property_images', function (Blueprint $table) {
                $table->string('image_name')->nullable();
            });
        }

        if (!Schema::hasColumn('property_images', 'is_primary')) {
            Schema::table('property_images', function (Blueprint $table) {
                $table->boolean('is_primary')->default(false);
            });
        }
    }

    public function down(): void
    {
        // Intentionally preserve schema during repair.
    }
};