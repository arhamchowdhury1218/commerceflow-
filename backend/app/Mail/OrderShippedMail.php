<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderShippedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public ?string $trackingCode = null
        // trackingCode is optional — passed when SteadFast booking succeeds
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Order Has Been Shipped — #CF-' .
                str_pad($this->order->id, 4, '0', STR_PAD_LEFT),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-shipped',
            with: [
                'order'        => $this->order->load(['customer', 'items.variant.product']),
                'trackingCode' => $this->trackingCode,
                'statusBadge'  => [
                    'bg'    => '#eff6ff',
                    'color' => '#2563eb',
                    'text'  => '#ffffff',
                    'label' => 'Shipped',
                ],
            ],
        );
    }
}
