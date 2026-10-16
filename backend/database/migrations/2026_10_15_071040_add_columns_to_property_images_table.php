<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_images', function (Blueprint $table) {
            $table->foreignId('property_id')
                ->constrained('properties')
                ->cascadeOnDelete();

            $table->string('image_path');
            $table->string('image_name')->nullable();
            $table->boolean('is_primary')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('property_images', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropColumn([
                'property_id',
                'image_path',
                'image_name',
                'is_primary',
            ]);
        });
    }
};