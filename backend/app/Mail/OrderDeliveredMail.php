<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderDeliveredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Delivered — #CF-' .
                str_pad($this->order->id, 4, '0', STR_PAD_LEFT),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-delivered',
            with: [
                'order'       => $this->order->load('customer'),
                'statusBadge' => [
                    'bg'    => '#f0fdf4',
                    'color' => '#15803d',
                    'text'  => '#ffffff',
                    'label' => 'Delivered',
                ],
            ],
        );
    }
}
