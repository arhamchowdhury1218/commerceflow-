<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Notification;
use App\Mail\OrderConfirmedMail;
use App\Mail\OrderShippedMail;
use App\Mail\OrderDeliveredMail;
use App\Mail\OrderCancelledMail;
use App\Mail\OrderReturnedMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send the right email based on order status
     * Called from OrderController whenever status changes
     */
    public function sendOrderEmail(Order $order, string $status, array $extra = []): void
    {
        // Only send if customer has an email address
        if (!$order->customer?->email) {
            Log::info('No customer email — skipping notification', [
                'order_id' => $order->id,
                'status'   => $status,
            ]);
            return;
        }

        try {
            $mailable = match ($status) {
                'confirmed' => new OrderConfirmedMail($order),
                'shipped'   => new OrderShippedMail($order, $extra['tracking_code'] ?? null),
                'delivered' => new OrderDeliveredMail($order),
                'cancelled' => new OrderCancelledMail($order),
                'returned'  => new OrderReturnedMail($order),
                default     => null,
            };

            if (!$mailable) return;
            // No email for pending, packed — those are internal statuses

            // Send the email
            Mail::to($order->customer->email)->send($mailable);

            // Log to notifications table for tracking
            Notification::create([
                'order_id'     => $order->id,
                'customer_id'  => $order->customer_id,
                'channel'      => 'email',
                'type'         => 'order_' . $status,
                'status'       => 'sent',
                'message_body' => "Order #{$order->id} status: {$status}",
                'sent_at'      => now(),
            ]);

            Log::info('Order email sent', [
                'order_id' => $order->id,
                'status'   => $status,
                'email'    => $order->customer->email,
            ]);
        } catch (\Exception $e) {
            // Log failure but don't crash the request
            // Email failure should never block order status update
            Log::error('Order email failed', [
                'order_id' => $order->id,
                'status'   => $status,
                'error'    => $e->getMessage(),
            ]);

            // Mark notification as failed in DB
            Notification::create([
                'order_id'     => $order->id,
                'customer_id'  => $order->customer_id,
                'channel'      => 'email',
                'type'         => 'order_' . $status,
                'status'       => 'failed',
                'message_body' => $e->getMessage(),
                'sent_at'      => now(),
            ]);
        }
    }
}
