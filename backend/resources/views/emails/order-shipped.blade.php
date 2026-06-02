@extends('emails.layout')

@section('content')

<p class="greeting">Good news, {{ $order->customer->name }}!</p>
<p class="message">
  Your order has been shipped and is on its way to you.
</p>

<!-- Tracking -->
@if($trackingCode)
<div class="tracking-box">
  <div class="tracking-label">Tracking Number</div>
  <div class="tracking-code">{{ $trackingCode }}</div>
  <p style="font-size:12px;color:#555;margin-top:8px">
    Use this code to track your parcel on SteadFast
  </p>
</div>
@endif

<!-- Order Info -->
<p class="section-label">Order Summary</p>
<div class="info-box">
  <div class="info-row">
    <span class="label">Order ID</span>
    <span class="value">#CF-{{ str_pad($order->id, 4, '0', STR_PAD_LEFT) }}</span>
  </div>
  <div class="info-row">
    <span class="label">Courier</span>
    <span class="value">{{ ucfirst($order->courier_name ?? 'SteadFast') }}</span>
  </div>
  <div class="info-row">
    <span class="label">Total</span>
    <span class="value">৳{{ number_format($order->total_amount, 0) }}</span>
  </div>
  <div class="info-row">
    <span class="label">Payment</span>
    <span class="value">{{ ucfirst($order->payment_status) }}</span>
  </div>
</div>

<!-- Delivery address -->
@if($order->customer->delivery_address)
<p class="section-label">Delivering To</p>
<div class="info-box">
  <p style="font-size:13px;color:#555">{{ $order->customer->delivery_address }}</p>
</div>
@endif

@endsection