
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('property_code', 50)->unique();
            $table->string('property_name');
            $table->string('project_name')->nullable();
            $table->string('property_type', 50);
            $table->text('location');
            $table->decimal('size_sqft', 12, 2)->nullable();
            $table->decimal('price', 15, 2);
            $table->enum('status', [
                'available',
                'reserved',
                'sold',
                'rented',
                'under_construction',
                'unavailable',
            ])->default('available');
            $table->text('description')->nullable();
            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('property_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
