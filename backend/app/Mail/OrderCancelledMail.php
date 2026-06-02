<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Cancelled — #CF-' .
                str_pad($this->order->id, 4, '0', STR_PAD_LEFT),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-cancelled',
            with: [
                'order'       => $this->order->load('customer'),
                'statusBadge' => [
                    'bg'    => '#fef2f2',
                    'color' => '#dc2626',
                    'text'  => '#ffffff',
                    'label' => 'Cancelled',
                ],
            ],
        );
    }
}
