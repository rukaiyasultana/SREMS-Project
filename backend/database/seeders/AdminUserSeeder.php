<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Prevent creating another Admin account
        if (User::where('role', 'admin')->exists()) {
            $this->command->error(
                'An Admin account already exists. No account was created.'
            );

            return;
        }

        // Get Admin information
        $name = $this->command->ask('Enter Admin name');
        $email = $this->command->ask('Enter Admin email');
        $password = $this->command->ask('Enter Admin password');

        // Validate information
        if (
            blank($name) ||
            !filter_var($email, FILTER_VALIDATE_EMAIL) ||
            blank($password) ||
            strlen($password) < 12
        ) {
            $this->command->error(
                'Invalid input. Use a valid email and a password of at least 12 characters.'
            );

            return;
        }

        // Prevent duplicate email
        if (User::where('email', $email)->exists()) {
            $this->command->error(
                'This email is already registered. No account was created.'
            );

            return;
        }

        // Create the first Admin account
        User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]);

        $this->command->info(
            'Admin account created successfully.'
        );
    }
}
