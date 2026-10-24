<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password';

    protected $description = 'Reset Admin password';

    public function handle(): int
    {
        $email = $this->ask('Enter Admin email');

        $admin = User::where('email', $email)
            ->where('role', 'admin')
            ->first();

        if (!$admin) {
            $this->error('Admin account not found.');
            return self::FAILURE;
        }

        // Use ask() so keyboard input works in your terminal.
        $password = $this->ask('Enter NEW Admin password');

        if (strlen($password) < 12) {
            $this->error('Password must be at least 12 characters.');
            return self::FAILURE;
        }

        $confirmation = $this->ask('Confirm NEW Admin password');

        if ($password !== $confirmation) {
            $this->error('Passwords do not match.');
            return self::FAILURE;
        }

        if (Hash::check($password, $admin->password)) {
            $this->error('Please choose a different password.');
            return self::FAILURE;
        }

        $admin->password = Hash::make($password);
        $admin->save();

        $admin->tokens()->delete();

        $this->info('Admin password updated successfully.');
        $this->info('Existing API tokens have been revoked.');

        return self::SUCCESS;
    }
}
