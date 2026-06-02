<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $subject ?? 'CommerceFlow' }}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      padding: 0 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e5e5;
    }
    .header {
      background: #1a1a1a;
      padding: 24px 32px;
      text-align: center;
    }
    .header .logo {
      color: #ffffff;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .header .logo span {
      color: #6366f1;
    }
    .status-bar {
      padding: 20px 32px;
      text-align: center;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .body { padding: 24px 32px; }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .message {
      font-size: 14px;
      color: #555;
      margin-bottom: 24px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #888;
      margin-bottom: 10px;
    }
    .info-box {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #777; }
    .info-row .value { font-weight: 500; color: #1a1a1a; }
    .item-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .item-row:last-child { border-bottom: none; }
    .item-name { font-weight: 500; }
    .item-meta { color: #888; font-size: 12px; margin-top: 2px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 700;
      padding: 12px 0 0;
      border-top: 2px solid #1a1a1a;
      margin-top: 8px;
    }
    .tracking-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      margin-bottom: 16px;
    }
    .tracking-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #16a34a;
      margin-bottom: 6px;
    }
    .tracking-code {
      font-family: monospace;
      font-size: 20px;
      font-weight: 700;
      color: #15803d;
      letter-spacing: 2px;
    }
    .footer {
      padding: 20px 32px;
      border-top: 1px solid #f0f0f0;
      text-align: center;
      font-size: 12px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="logo"><span>Commerce</span>Flow</div>
      </div>

      <!-- Status bar -->
      @if(isset($statusBadge))
      <div class="status-bar" style="background: {{ $statusBadge['bg'] }}">
        <span class="status-badge" style="background: {{ $statusBadge['color'] }}; color: {{ $statusBadge['text'] }}">
          {{ $statusBadge['label'] }}
        </span>
      </div>
      @endif

      <!-- Body -->
      <div class="body">
        @yield('content')
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>CommerceFlow — Built for Bangladeshi sellers</p>
        <p style="margin-top:4px">You are receiving this because an order was placed for you.</p>
      </div>

    </div>
  </div>
</body>
</html>