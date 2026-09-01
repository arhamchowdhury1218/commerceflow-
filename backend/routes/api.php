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
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\ConversationController;

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────
// No token required — accessible before login
Route::post('/login',           [AuthController::class, 'login']);
Route::post('/register',        [AuthController::class, 'register']);
Route::post('/forgot-password', [PasswordController::class, 'forgotPassword']);
Route::post('/reset-password',  [PasswordController::class, 'resetPassword']);

// ── FACEBOOK MESSENGER WEBHOOK (public — Facebook's servers call these) ────
// GET  = Facebook's verification handshake when saving the webhook URL
// POST = incoming message events from Facebook
// These MUST be public: Facebook has no Sanctum token.
Route::get('/webhooks/messenger',  [WebhookController::class, 'verify']);
Route::post('/webhooks/messenger', [WebhookController::class, 'handle']);

// ── PROTECTED ROUTES ──────────────────────────────────────────────────────
// All routes inside this group require a valid Sanctum token
Route::middleware('auth:sanctum')->group(function () {

    // ── AUTH ──────────────────────────────────────────────────────────────
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── DASHBOARD ─────────────────────────────────────────────────────────
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── ANALYTICS ─────────────────────────────────────────────────────────
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    // ── ORDERS ────────────────────────────────────────────────────────────
    // Specific PATCH routes must come BEFORE apiResource
    // because apiResource registers PATCH /orders/{order} → update()
    // and we need these two to hit their own dedicated methods
    Route::patch('/orders/{order}/status',  [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/payment', [OrderController::class, 'updatePayment']);
    Route::apiResource('orders', OrderController::class);

    // ── PRODUCTS ──────────────────────────────────────────────────────────
    // Specific routes BEFORE apiResource — critical for correct routing
    // If apiResource comes first, /products/{product}/status would be
    // caught by the apiResource's show() route and never reach toggleStatus()

    // Status toggle — PATCH /products/{product}/status
    // Hits ProductController@toggleStatus — requires NO body
    // DO NOT merge this into apiResource update() — that requires name + base_price
    Route::patch('/products/{product}/status', [ProductController::class, 'toggleStatus']);

    // Image management
    Route::post('/products/{product}/images',   [ImageController::class, 'upload']);
    Route::delete('/products/{product}/images', [ImageController::class, 'delete']);

    // Variant management — add, update, delete individual variants
    Route::post(
        '/products/{product}/variants',
        [ProductController::class, 'addVariant']
    );
    Route::put(
        '/products/{product}/variants/{variant}',
        [ProductController::class, 'updateVariant']
    );
    Route::delete(
        '/products/{product}/variants/{variant}',
        [ProductController::class, 'deleteVariant']
    );

    // apiResource LAST — registers index, store, show, update, destroy
    // PATCH /products/{product} → update() — requires name + base_price
    // This must come after the specific routes above
    Route::apiResource('products', ProductController::class);

    // ── CUSTOMERS ─────────────────────────────────────────────────────────
    Route::apiResource('customers', CustomerController::class);

    // ── DELIVERIES ────────────────────────────────────────────────────────
    // Specific named routes before any potential conflicts
    Route::get('/deliveries',                  [DeliveryController::class, 'index']);
    Route::post('/deliveries/book/{order}',    [DeliveryController::class, 'book']);
    Route::post('/deliveries/sync/{delivery}', [DeliveryController::class, 'sync']);
    Route::post('/deliveries/sync-all',        [DeliveryController::class, 'syncAll']);
    Route::get('/deliveries/balance',           [DeliveryController::class, 'balance']);
    Route::get('/deliveries/balance/{courier}', [DeliveryController::class, 'balanceFor']);

    // ── SETTINGS ──────────────────────────────────────────────────────────
    Route::get('/settings',                 [SettingsController::class, 'index']);
    Route::put('/settings/profile',         [SettingsController::class, 'updateProfile']);
    Route::put('/settings/business',        [SettingsController::class, 'updateBusiness']);
    Route::put('/settings/facebook',        [SettingsController::class, 'updateFacebook']);
    Route::put('/settings/password',        [PasswordController::class, 'changePassword']);
    Route::post('/settings/test-steadfast', [SettingsController::class, 'testSteadFast']);

    // ── MESSENGER INBOX ───────────────────────────────────────────────────
    Route::get('/conversations',                  [ConversationController::class, 'index']);
    Route::get('/conversations/{conversation}',   [ConversationController::class, 'show']);
    Route::post('/conversations/{conversation}/reply', [ConversationController::class, 'reply']);
});
