<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('bank_name', 120)->nullable();
            $table->string('bank_slip_number', 120)->nullable();

            $table->unique(
                ['bank_name', 'bank_slip_number'],
                'payments_bank_slip_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_bank_slip_unique');
            $table->dropColumn(['bank_name', 'bank_slip_number']);
        });
    }
};
