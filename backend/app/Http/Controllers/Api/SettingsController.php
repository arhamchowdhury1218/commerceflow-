<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SteadFastService;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    // GET /api/settings
    // Returns current business settings
    public function index(Request $request)
    {
        $user     = $request->user();
        $business = $user->business;

        return response()->json([
            'user'     => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'business' => [
                'id'               => $business->id,
                'name'             => $business->name,
                'whatsapp_number'  => $business->whatsapp_number,
                'facebook_page_id' => $business->facebook_page_id,
                'instagram_id'     => $business->instagram_id,
            ],
            // Don't return actual API keys for security
            // Just tell frontend whether they are set
            'integrations' => [
                'steadfast_configured' => !empty(config('services.steadfast.api_key'))
                    && config('services.steadfast.api_key') !== 'test_key',
                'steadfast_test_mode'  => config('services.steadfast.test_mode'),
                'mail_configured'      => !empty(config('mail.from.address')),
                'mail_from'            => config('mail.from.address'),
            ],
        ]);
    }

    // PUT /api/settings/business
    // Updates business profile
    public function updateBusiness(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'whatsapp_number'  => 'nullable|string|max:20',
            'facebook_page_id' => 'nullable|string|max:255',
            'instagram_id'     => 'nullable|string|max:255',
        ]);

        $business = $request->user()->business;
        $business->update([
            'name'             => $request->name,
            'whatsapp_number'  => $request->whatsapp_number,
            'facebook_page_id' => $request->facebook_page_id,
            'instagram_id'     => $request->instagram_id,
        ]);

        return response()->json([
            'message'  => 'Business updated successfully',
            'business' => $business,
        ]);
    }

    // PUT /api/settings/profile
    // Updates seller name
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $request->user()->update(['name' => $request->name]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $request->user(),
        ]);
    }

    // POST /api/settings/test-steadfast
    // Tests SteadFast connection
    public function testSteadFast(Request $request)
    {
        $steadfast = new SteadFastService();
        $result    = $steadfast->getBalance();

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'SteadFast connected successfully',
                'balance' => $result['balance'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Could not connect to SteadFast. Check your API keys.',
        ], 422);
    }
}
