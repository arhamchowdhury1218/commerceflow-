<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    // POST /api/forgot-password
    // Sends a password reset link to the seller's email
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Laravel's built-in password broker sends the reset email
        // It creates a token, stores it in password_reset_tokens table,
        // and sends an email with a link containing the token
        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Password reset link sent to your email.'
            ]);
        }

        // Email not found in database
        return response()->json([
            'message' => 'We could not find an account with that email address.'
        ], 422);
    }

    // POST /api/reset-password
    // Called when seller clicks the link in the email
    // Validates the token and sets the new password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        // Laravel validates the token matches the email
        // and that it has not expired (tokens expire after 60 minutes by default)
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Fire the PasswordReset event
                // This invalidates all existing tokens for this user
                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password reset successfully. Please log in with your new password.'
            ]);
        }

        return response()->json([
            'message' => 'This password reset link is invalid or has expired.'
        ], 422);
    }

    // PUT /api/settings/password
    // Called from Settings page when seller is logged in
    // Requires current password to be correct before changing
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password'      => 'required',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        $user = $request->user();

        // Verify current password is correct
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Your current password is incorrect.'
            ], 422);
        }

        // Update to new password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Delete all existing tokens — forces re-login on other devices
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password changed successfully. Please log in again.'
        ]);
    }
}
