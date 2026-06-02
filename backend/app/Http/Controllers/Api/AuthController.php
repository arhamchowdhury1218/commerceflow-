<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:8|confirmed',
            'business_name' => 'required|string|max:255',
        ]);

        // Create seller account
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Auto-create their business
        $business = Business::create([
            'user_id' => $user->id,
            'name'    => $request->business_name,
        ]);

        // Create token for immediate login
        $token = $user->createToken('commerceflow')->plainTextToken;

        return response()->json([
            'token'    => $token,
            'user'     => $user,
            'business' => $business,
        ], 201);
    }

    // POST /api/login
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Delete old tokens — fresh login
        $user->tokens()->delete();

        $token    = $user->createToken('commerceflow')->plainTextToken;
        $business = Business::where('user_id', $user->id)->first();

        return response()->json([
            'token'    => $token,
            'user'     => $user,
            'business' => $business,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    // GET /api/me
    public function me(Request $request)
    {
        return response()->json([
            'user'     => $request->user(),
            'business' => $request->user()->business,
        ]);
    }
}
