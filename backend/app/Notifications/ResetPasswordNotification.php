<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    // Override the reset URL to point to our React frontend
    protected function resetUrl($notifiable)
    {
        $frontendUrl = config(
            'app.frontend_url',
            env('FRONTEND_URL', 'http://localhost:5173')
        );

        return $frontendUrl . '/reset-password?token=' . $this->token
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
    }

    // Customise the email content
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset Your CommerceFlow Password')
            ->greeting('Hello!')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $this->resetUrl($notifiable))
            ->line('This password reset link will expire in 60 minutes.')
            ->line('If you did not request a password reset, no further action is required.')
            ->salutation('CommerceFlow Team');
    }
}
