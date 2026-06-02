<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderReturnedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Return Received — #CF-' .
                str_pad($this->order->id, 4, '0', STR_PAD_LEFT),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-returned',
            with: [
                'order'       => $this->order->load('customer'),
                'statusBadge' => [
                    'bg'    => '#fff7ed',
                    'color' => '#ea580c',
                    'text'  => '#ffffff',
                    'label' => 'Return Received',
                ],
            ],
        );
    }
}
