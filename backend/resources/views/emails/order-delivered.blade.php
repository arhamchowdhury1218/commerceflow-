@extends('emails.layout')

@section('content')

<p class="greeting">Your order has been delivered!</p>
<p class="message">
  Hi {{ $order->customer->name }}, we hope you love your purchase.
  Thank you for shopping with us.
</p>

<p class="section-label">Order Summary</p>
<div class="info-box">
  <div class="info-row">
    <span class="label">Order ID</span>
    <span class="value">#CF-{{ str_pad($order->id, 4, '0', STR_PAD_LEFT) }}</span>
  </div>
  <div class="info-row">
    <span class="label">Total paid</span>
    <span class="value">৳{{ number_format($order->total_amount, 0) }}</span>
  </div>
  <div class="info-row">
    <span class="label">Delivered on</span>
    <span class="value">{{ now()->format('d M Y') }}</span>
  </div>
</div>

@endsection