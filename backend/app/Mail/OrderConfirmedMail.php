<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        // public property = automatically available in blade view
        // $order can be used directly in the email template
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Confirmed — #CF-' .
                str_pad($this->order->id, 4, '0', STR_PAD_LEFT),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-confirmed',
            with: [
                'order'       => $this->order->load([
                    'customer',
                    'items.variant.product'
                ]),
                'statusBadge' => [
                    'bg'    => '#f0fdf4',
                    'color' => '#16a34a',
                    'text'  => '#ffffff',
                    'label' => 'Order Confirmed',
                ],
            ],
        );
    }
}
