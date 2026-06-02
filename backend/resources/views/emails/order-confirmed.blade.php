@extends('emails.layout')

@section('content')

<p class="greeting">Hello, {{ $order->customer->name }}!</p>
<p class="message">
  Your order has been confirmed. We are preparing it for shipment.
</p>

<!-- Order Info -->
<p class="section-label">Order Details</p>
<div class="info-box">
  <div class="info-row">
    <span class="label">Order ID</span>
    <span class="value">#CF-{{ str_pad($order->id, 4, '0', STR_PAD_LEFT) }}</span>
  </div>
  <div class="info-row">
    <span class="label">Date</span>
    <span class="value">{{ $order->created_at->format('d M Y') }}</span>
  </div>
  <div class="info-row">
    <span class="label">Payment</span>
    <span class="value">{{ ucfirst(str_replace('_', ' ', $order->payment_method ?? 'N/A')) }}</span>
  </div>
  <div class="info-row">
    <span class="label">Courier</span>
    <span class="value">{{ ucfirst($order->courier_name ?? 'TBD') }}</span>
  </div>
</div>

<!-- Items -->
<p class="section-label">Items Ordered</p>
<div class="info-box">
  @foreach($order->items as $item)
  <div class="item-row">
    <div>
      <div class="item-name">{{ $item->variant->product->name }}</div>
      <div class="item-meta">
        {{ implode(' · ', array_filter([$item->variant->color, $item->variant->size])) }}
        · Qty: {{ $item->quantity }}
      </div>
    </div>
    <div style="font-weight:600">৳{{ number_format($item->subtotal, 0) }}</div>
  </div>
  @endforeach

  <div class="total-row">
    <span>Total</span>
    <span>৳{{ number_format($order->total_amount, 0) }}</span>
  </div>
</div>

<!-- Delivery address -->
@if($order->customer->delivery_address)
<p class="section-label">Delivery Address</p>
<div class="info-box">
  <p style="font-size:13px;color:#555">{{ $order->customer->delivery_address }}</p>
</div>
@endif

@endsection