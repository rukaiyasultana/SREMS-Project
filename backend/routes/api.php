<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Login
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => $request->user(),
        ]);
    });

    // Admin/Authority: create authorized accounts
    Route::post('/admin/users', [AuthController::class, 'createUser']);
    Route::post('/users', [AuthController::class, 'createUser']);

    // Property viewing
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{property}', [PropertyController::class, 'show']);

    // Booking requests
        Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::patch('/appointments/{appointment}/review', [AppointmentController::class, 'review'])->middleware('throttle:30,1');
    Route::patch('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store'])
        ->middleware('throttle:10,1');
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::patch('/bookings/{booking}/review', [BookingController::class, 'review'])
        ->middleware('throttle:30,1');
    Route::patch('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
Route::get('/installments', [PaymentController::class, 'installments']);
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{payment}/receipt', [PaymentController::class, 'downloadReceipt']);
Route::post('/payments', [PaymentController::class, 'store'])->middleware('throttle:10,1');
Route::patch('/payments/{payment}/review', [PaymentController::class, 'review'])->middleware('throttle:30,1');
Route::post('/bookings/{booking}/installments', [PaymentController::class, 'createInstallmentPlan'])->middleware('throttle:10,1');

    // Reports: restricted to Admin and Authority by the controller
    Route::get('/reports/summary', [ReportController::class, 'summary']);

    // Property management and image management
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{property}', [PropertyController::class, 'update']);
        Route::patch('/properties/{property}', [PropertyController::class, 'update']);
        Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);

        Route::post(
            '/properties/{property}/images',
            [PropertyController::class, 'uploadImages']
        );

        Route::delete(
            '/properties/{property}/images/{image}',
            [PropertyController::class, 'deleteImage']
        );
    });
});
