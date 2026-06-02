<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AnalyticsController;

// Public routes — no token needed
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes — token required
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('orders',    OrderController::class);
    Route::apiResource('products',  ProductController::class);
    Route::apiResource('customers', CustomerController::class);

    Route::patch('/orders/{order}/status',  [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/payment', [OrderController::class, 'updatePayment']);


    Route::get('/deliveries',                    [DeliveryController::class, 'index']);
    Route::post('/deliveries/book/{order}',      [DeliveryController::class, 'book']);
    Route::post('/deliveries/sync/{delivery}',   [DeliveryController::class, 'sync']);
    Route::get('/deliveries/balance',            [DeliveryController::class, 'balance']);

    Route::get('/settings',                    [SettingsController::class, 'index']);
    Route::put('/settings/business',           [SettingsController::class, 'updateBusiness']);
    Route::put('/settings/profile',            [SettingsController::class, 'updateProfile']);
    Route::post('/settings/test-steadfast',    [SettingsController::class, 'testSteadFast']);

    Route::get('/analytics', [AnalyticsController::class, 'index']);
});
