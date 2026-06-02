@extends('emails.layout')

@section('content')

<p class="greeting">Hi {{ $order->customer->name }},</p>
<p class="message">
  Your order has been cancelled. If you have any questions,
  please contact us.
</p>

<p class="section-label">Cancelled Order</p>
<div class="info-box">
  <div class="info-row">
    <span class="label">Order ID</span>
    <span class="value">#CF-{{ str_pad($order->id, 4, '0', STR_PAD_LEFT) }}</span>
  </div>
  <div class="info-row">
    <span class="label">Total</span>
    <span class="value">৳{{ number_format($order->total_amount, 0) }}</span>
  </div>
</div>

@endsection