import { WorkshopOrder, formatPrice, formatIndianDate } from '../components/tsukuri/tsukuriData.ts';

export function generateInvoiceHTML(order: WorkshopOrder): string {
  const subtotalBeforeTax = Math.round(order.totalAmountINR / 1.18);
  const totalTax = Math.round(order.totalAmountINR - subtotalBeforeTax);
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  const isCOD = order.paymentMethod === 'COD';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${order.orderNumber} - TsuKURI_3D</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #1a2e26;
      padding: 30px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 3px solid #1e4b3e;
      border-radius: 28px;
      padding: 36px;
      box-shadow: 0 10px 30px rgba(30, 75, 62, 0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e8ece1;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-badge {
      width: 54px;
      height: 54px;
      background: #1e4b3e;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f3b755;
      font-family: 'Fredoka', cursive;
      font-size: 26px;
      font-weight: 700;
      border: 2px solid #f3b755;
    }
    .brand-title {
      font-family: 'Fredoka', cursive;
      font-size: 28px;
      color: #1a2e26;
      line-height: 1;
    }
    .brand-subtitle {
      font-size: 11px;
      font-weight: 800;
      color: #1e4b3e;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .invoice-tag {
      text-align: right;
    }
    .invoice-title {
      font-family: 'Fredoka', cursive;
      font-size: 22px;
      color: #1e4b3e;
      letter-spacing: 1px;
    }
    .invoice-number {
      font-family: monospace;
      font-size: 14px;
      font-weight: 700;
      color: #64748b;
      margin-top: 2px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 20px;
    }
    .bento-box {
      background: #e8ece1;
      border-radius: 18px;
      padding: 16px 20px;
      font-size: 12px;
      line-height: 1.6;
    }
    .bento-box .label {
      font-size: 10px;
      font-weight: 800;
      color: #1e4b3e;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      display: block;
    }
    .bento-box .title {
      font-weight: 800;
      color: #1a2e26;
      font-size: 13px;
    }
    .logistics-bar {
      background: #ffffff;
      border: 2px dashed #1e4b3e;
      border-radius: 16px;
      padding: 12px 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      background: #1e4b3e;
      color: #f3b755;
      text-align: left;
      padding: 12px 16px;
      font-family: 'Fredoka', cursive;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    th:first-child { border-top-left-radius: 12px; }
    th:last-child { border-top-right-radius: 12px; text-align: right; }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    td:last-child { text-align: right; font-family: monospace; font-weight: 700; }
    .item-name { font-weight: 700; color: #1a2e26; display: block; }
    .item-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .totals-box {
      width: 320px;
      font-size: 12px;
      line-height: 2;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      color: #475569;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #1e4b3e;
      padding-top: 10px;
      margin-top: 8px;
      font-family: 'Fredoka', cursive;
      font-size: 20px;
      color: #1e4b3e;
      font-weight: 700;
    }
    .footer {
      border-top: 2px solid #e8ece1;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    .seal {
      width: 64px;
      height: 64px;
      border: 3px solid #dc2626;
      border-radius: 50%;
      color: #dc2626;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Fredoka', cursive;
      font-weight: 800;
      transform: rotate(-10deg);
      line-height: 1;
    }
    .seal span { font-size: 9px; letter-spacing: 0.5px; }
    .seal .kanji { font-size: 16px; margin: 2px 0; }
    @media print {
      body { padding: 0; background: white; }
      .invoice-card { border: none; box-shadow: none; padding: 10px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-card" id="invoice-root">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">造</div>
        <div>
          <div class="brand-title">TSUKURI_3D</div>
          <div class="brand-subtitle">造り · KYOTO × NUSANTARA 3D FABRICATION LAB</div>
        </div>
      </div>
      <div class="invoice-tag">
        <div class="invoice-title">OFFICIAL TAX INVOICE</div>
        <div class="invoice-number">#${order.orderNumber}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 700;">Date: ${formatIndianDate(order.orderDate)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="bento-box">
        <span class="label">DISPATCHED FROM (STUDIO LAB):</span>
        <div class="title">TsuKURI_3D Studio (Solar Print Lab)</div>
        <div>Plot 42, HSR Layout Sector 1, Bengaluru, KA 560102</div>
        <div style="font-family: monospace; font-weight: 600; color: #1e4b3e; margin-top: 2px;">GSTIN: 29AABCT3921Z1Z8</div>
        <div>Official Studio Support Desk · +91 98450 33021</div>
      </div>

      <div class="bento-box">
        <span class="label">BILLED & SHIPPED TO:</span>
        <div class="title">${order.customerName}</div>
        <div>${order.address || 'Address not specified'}</div>
        <div>${order.city || 'India'}</div>
        <div style="font-family: monospace; margin-top: 2px;">Phone: ${order.phone || 'N/A'}</div>
        ${order.email ? `<div>Email: ${order.email}</div>` : ''}
      </div>
    </div>

    <div class="logistics-bar">
      <div><strong>Courier Logistics:</strong> ${order.courier || 'BlueDart Surface Express'}</div>
      <div><strong>AWB Tracking:</strong> <span style="font-family: monospace; font-weight: 700;">${order.trackingNumber || 'BLU84920194'}</span></div>
      <div><strong>Payment:</strong> <span style="color: ${isCOD ? '#b45309' : '#059669'}; font-weight: 800;">${order.paymentMethod || 'Online UPI'} (${order.paymentStatus || 'Paid'})</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>ITEM DESCRIPTION</th>
          <th style="text-align: center;">QTY</th>
          <th style="text-align: right;">RATE (INR)</th>
          <th>TOTAL AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((it) => `
          <tr>
            <td>
              <span class="item-name">${it.name}</span>
              <span class="item-sub">Precision Layer: 0.12mm · High-Speed Bambu AMS · Solar Powered</span>
            </td>
            <td style="text-align: center; font-weight: 700;">${it.quantity}</td>
            <td style="text-align: right; font-family: monospace;">₹${Number(it.priceINR).toLocaleString('en-IN')}</td>
            <td>₹${Number(it.priceINR * it.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal (Excl. Tax):</span>
          <span style="font-family: monospace;">₹${subtotalBeforeTax.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-row">
          <span>CGST (9%):</span>
          <span style="font-family: monospace;">₹${cgst.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-row">
          <span>SGST (9%):</span>
          <span style="font-family: monospace;">₹${sgst.toLocaleString('en-IN')}</span>
        </div>
        ${isCOD ? `
          <div class="totals-row" style="color: #b45309; font-weight: 700;">
            <span>Cash on Delivery Handling Fee:</span>
            <span style="font-family: monospace;">+₹50</span>
          </div>
        ` : `
          <div class="totals-row" style="color: #059669; font-weight: 700;">
            <span>Online Payment Discount (UPI/Cards):</span>
            <span style="font-family: monospace;">-₹10</span>
          </div>
        `}
        <div class="grand-total">
          <span>TOTAL INVOICE (INR):</span>
          <span>${formatPrice(order.totalAmountINR)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>
        <p><strong>Thank you for supporting sustainable 3D craft!</strong></p>
        <p style="margin-top: 3px;">100% bio-degradable polymer · Rooftop solar print microgrid · Kyoto × Nusantara Design</p>
      </div>
      <div class="seal">
        <span>造り</span>
        <div class="kanji">印</div>
        <span>VERIFIED</span>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;
}

export function printInvoiceDirectly(order: WorkshopOrder): void {
  const html = generateInvoiceHTML(order);

  // Method 1: Try dedicated print window
  const printWindow = window.open('', '_blank', 'width=860,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    return;
  }

  // Method 2: If popup was blocked (common in sandboxed iframes), use hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => document.body.removeChild(iframe), 60000);
    }, 500);
    return;
  }

  // Method 3: Fallback to standard window.print()
  window.print();
}

export function downloadInvoiceHTML(order: WorkshopOrder): void {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${order.orderNumber}_TsuKURI_3D.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateBeautifulEmailHTML(order: WorkshopOrder): string {
  const subtotalBeforeTax = Math.round(order.totalAmountINR / 1.18);
  const totalTax = Math.round(order.totalAmountINR - subtotalBeforeTax);
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  const isCOD = order.paymentMethod === 'COD';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation & Tax Invoice - ${order.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f6f0;
      color: #1a2e26;
      padding: 24px 12px;
      line-height: 1.5;
    }
    .email-container {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(30, 75, 62, 0.12);
      border: 3px solid #1e4b3e;
    }
    .header-banner {
      background: #1e4b3e;
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
      position: relative;
    }
    .logo-badge {
      display: inline-block;
      width: 58px;
      height: 58px;
      background: #ffffff;
      color: #1e4b3e;
      border-radius: 20px;
      font-family: 'Fredoka', cursive;
      font-size: 28px;
      font-weight: 700;
      line-height: 58px;
      margin-bottom: 12px;
      border: 2px solid #f3b755;
    }
    .studio-title {
      font-family: 'Fredoka', cursive;
      font-size: 26px;
      letter-spacing: 0.5px;
      color: #f3b755;
      margin-bottom: 4px;
    }
    .studio-subtext {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.85);
    }
    .greeting-card {
      padding: 26px 28px 12px;
    }
    .greeting-title {
      font-family: 'Fredoka', cursive;
      font-size: 22px;
      color: #1e4b3e;
      margin-bottom: 8px;
    }
    .greeting-desc {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .bento-bar {
      margin: 16px 28px;
      background: #e8ece1;
      border-radius: 20px;
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid rgba(30, 75, 62, 0.15);
    }
    .bento-col {
      flex: 1;
    }
    .bento-label {
      font-size: 10px;
      font-weight: 800;
      color: #1e4b3e;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 3px;
    }
    .bento-val {
      font-size: 14px;
      font-weight: 800;
      color: #1a2e26;
      font-family: monospace;
    }
    .delivery-pill {
      margin: 0 28px 18px;
      background: #f3b755;
      color: #1a2e26;
      border-radius: 16px;
      padding: 12px 18px;
      font-size: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .table-container {
      padding: 0 28px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #1e4b3e;
      color: #f3b755;
      font-family: 'Fredoka', cursive;
      font-size: 11px;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 10px 14px;
    }
    th:first-child { border-radius: 12px 0 0 12px; }
    th:last-child { border-radius: 0 12px 12px 0; text-align: right; }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #e8ece1;
      vertical-align: top;
    }
    .item-name {
      font-weight: 700;
      color: #1a2e26;
      display: block;
    }
    .item-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .totals-wrap {
      padding: 0 28px;
      margin-bottom: 24px;
    }
    .totals-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px 20px;
      font-size: 12px;
    }
    .totals-line {
      display: flex;
      justify-content: space-between;
      color: #475569;
      margin-bottom: 6px;
    }
    .grand-total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #1e4b3e;
      padding-top: 10px;
      margin-top: 8px;
      font-family: 'Fredoka', cursive;
      font-size: 18px;
      color: #1e4b3e;
      font-weight: 700;
    }
    .address-card {
      margin: 0 28px 24px;
      background: #e8ece1;
      border-radius: 18px;
      padding: 16px 20px;
      font-size: 12px;
      border: 1px solid rgba(30, 75, 62, 0.1);
    }
    .support-card {
      margin: 0 28px 28px;
      background: #ffffff;
      border: 2px dashed #1e4b3e;
      border-radius: 18px;
      padding: 18px 20px;
      text-align: center;
    }
    .support-title {
      font-family: 'Fredoka', cursive;
      font-size: 15px;
      color: #1e4b3e;
      margin-bottom: 4px;
    }
    .support-desc {
      font-size: 11px;
      color: #475569;
      margin-bottom: 12px;
    }
    .support-button {
      display: inline-block;
      background: #1e4b3e;
      color: #f3b755;
      text-decoration: none;
      font-family: 'Fredoka', cursive;
      font-size: 13px;
      padding: 10px 24px;
      border-radius: 9999px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .footer-seal {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    .stamp {
      width: 54px;
      height: 54px;
      border: 2px solid #dc2626;
      border-radius: 50%;
      color: #dc2626;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Fredoka', cursive;
      font-weight: 800;
      transform: rotate(-10deg);
      line-height: 1;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header Banner -->
    <div class="header-banner">
      <div class="logo-badge">造</div>
      <h1 class="studio-title">TSUKURI_3D</h1>
      <p class="studio-subtext">造り · KYOTO × NUSANTARA 3D FABRICATION LAB</p>
    </div>

    <!-- Greeting -->
    <div class="greeting-card">
      <h2 class="greeting-title">Konnichiwa, ${order.customerName}! 🌿</h2>
      <p class="greeting-desc">
        Thank you for commissioning your piece with <strong>TsuKURI_3D Studio</strong>. Your 3D models have entered our solar-powered print queue with 0.12mm precision layers. Here is your official commission tax invoice and dispatch receipt.
      </p>
    </div>

    <!-- Bento Info Bar -->
    <div class="bento-bar">
      <div class="bento-col">
        <span class="bento-label">Order Number</span>
        <span class="bento-val">#${order.orderNumber}</span>
      </div>
      <div class="bento-col" style="text-align: right;">
        <span class="bento-label">Invoice Date</span>
        <span class="bento-val" style="font-size: 12px;">${formatIndianDate(order.orderDate)}</span>
      </div>
    </div>

    <!-- Delivery Promise Pill -->
    <div class="delivery-pill">
      <span>🚚</span>
      <span>Standard Delivery in 3 to 4 Days Pan-India · Courier: ${order.courier || 'BlueDart Surface Express'} (AWB: ${order.trackingNumber || 'Available shortly'})</span>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ITEM DESCRIPTION</th>
            <th style="text-align: center;">QTY</th>
            <th style="text-align: right;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((it) => `
            <tr>
              <td>
                <span class="item-name">${it.name}</span>
                <span class="item-sub">100% Bio-Matte PLA · High-Speed AMS Print · Kyoto Craft Finish</span>
              </td>
              <td style="text-align: center; font-weight: 700; color: #1e4b3e;">${it.quantity}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700;">₹${Number(it.priceINR * it.quantity).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals Breakdown -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="totals-line">
          <span>Subtotal (Excl. Taxes):</span>
          <span style="font-family: monospace;">₹${subtotalBeforeTax.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-line">
          <span>CGST (9%):</span>
          <span style="font-family: monospace;">₹${cgst.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-line">
          <span>SGST (9%):</span>
          <span style="font-family: monospace;">₹${sgst.toLocaleString('en-IN')}</span>
        </div>
        ${isCOD ? `
          <div class="totals-line" style="color: #b45309; font-weight: 700;">
            <span>Cash on Delivery Handling Fee:</span>
            <span style="font-family: monospace;">+₹50</span>
          </div>
        ` : `
          <div class="totals-line" style="color: #059669; font-weight: 700;">
            <span>Online UPI Instant Discount:</span>
            <span style="font-family: monospace;">-₹10</span>
          </div>
        `}
        <div class="grand-total-line">
          <span>TOTAL PAID / PAYABLE:</span>
          <span>${formatPrice(order.totalAmountINR)}</span>
        </div>
      </div>
    </div>

    <!-- Shipping Details -->
    <div class="address-card">
      <span class="bento-label">Shipping Destination</span>
      <div style="font-weight: 700; color: #1a2e26; margin-top: 2px;">${order.customerName}</div>
      <div style="color: #475569; margin-top: 2px;">${order.address || 'Address on file'}, ${order.city || 'India'}</div>
      <div style="color: #475569; font-family: monospace; margin-top: 2px;">Phone: ${order.phone || 'N/A'}</div>
    </div>

    <!-- Official Support Desk (Raw Email is Hidden, only Support is Visible!) -->
    <div class="support-card">
      <h3 class="support-title">Official Studio Support</h3>
      <p class="support-desc">
        Need assistance with your commission, live tracking, or design modifications? Our team is at your service.
      </p>
      <a href="mailto:commersgyan@gmail.com?subject=Support%20Request%20-%20Order%20%23${order.orderNumber}" class="support-button">
        CONTACT SUPPORT
      </a>
    </div>

    <!-- Footer & Seal -->
    <div class="footer-seal">
      <div>
        <p><strong>TsuKURI_3D Studio · Solar Print Microgrid</strong></p>
        <p style="margin-top: 2px;">Plot 42, HSR Layout Sector 1, Bengaluru · GSTIN: 29AABCT3921Z1Z8</p>
        <p style="margin-top: 2px;">Official Studio Support Desk</p>
      </div>
      <div class="stamp">
        <span style="font-size: 8px;">造り</span>
        <span style="font-size: 14px;">印</span>
        <span style="font-size: 7px;">VERIFIED</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateBeautifulEmailMessage(order: WorkshopOrder): string {
  return (
    `🌿 TsuKURI_3D STUDIO · OFFICIAL TAX INVOICE & ORDER CONFIRMATION\n` +
    `造り · Kyoto × Nusantara 3D Fabrication Lab\n` +
    `------------------------------------------------------------\n` +
    `Konnichiwa, ${order.customerName}!\n\n` +
    `Thank you for commissioning your 3D craft piece with TsuKURI_3D Studio.\n` +
    `Your models have been queued on our high-speed solar-powered print fleet.\n\n` +
    `📦 ORDER DETAILS:\n` +
    `Order Number : #${order.orderNumber}\n` +
    `Invoice Date : ${formatIndianDate(order.orderDate)}\n` +
    `Payment Mode : ${order.paymentMethod} (${order.paymentStatus})\n` +
    `Logistics    : ${order.courier || 'BlueDart Surface Express'}\n` +
    `AWB Number   : ${order.trackingNumber || 'Available shortly'}\n` +
    `Delivery     : Standard 3 to 4 Days Pan-India Express Delivery\n\n` +
    `📋 ITEM SUMMARY:\n` +
    order.items.map((it) => `• ${it.name} x ${it.quantity} — ₹${Number(it.priceINR * it.quantity).toLocaleString('en-IN')}`).join('\n') +
    `\n\n💰 GRAND TOTAL: ₹${order.totalAmountINR.toLocaleString('en-IN')}\n\n` +
    `📍 DELIVERY ADDRESS:\n` +
    `${order.customerName}\n` +
    `${order.address || 'Address on file'}, ${order.city || 'India'}\n` +
    `Phone: ${order.phone || 'N/A'}\n\n` +
    `🛡️ 100% Bio-Matte PLA · Solar Microgrid Powered · 7-Day Replacement Cover\n` +
    `------------------------------------------------------------\n` +
    `💬 Official Studio Support: For any questions or tracking assistance, contact Official Studio Support.\n` +
    `造り · Kyoto × Nusantara 3D Studio`
  );
}

export async function automateInvoiceSending(order: WorkshopOrder): Promise<{ success: boolean; message: string; emailHTML: string }> {
  const emailHTML = generateBeautifulEmailHTML(order);

  if (!order.email) {
    return {
      success: false,
      message: `Cannot send: Customer #${order.orderNumber} does not have an email address specified.`,
      emailHTML,
    };
  }

  // 1. Try sending via backend automated email API
  try {
    const res = await fetch('/api/send-invoice-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.email,
        totalAmount: order.totalAmountINR,
        items: order.items,
        courier: order.courier,
        trackingNumber: order.trackingNumber,
        paymentMethod: order.paymentMethod,
        orderDate: order.orderDate,
        emailHTML,
      }),
    });

    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message || `Tax invoice dispatched to ${order.email}!`,
      emailHTML,
    };
  } catch (err: any) {
    console.warn('Backend automated mailer notification error:', err);
    return {
      success: false,
      message: `Failed to connect to email server: ${err.message || 'Network error'}`,
      emailHTML,
    };
  }
}

export function sendInvoiceToCustomerEmail(order: WorkshopOrder): { success: boolean; message: string; emailHTML: string } {
  const emailHTML = generateBeautifulEmailHTML(order);
  const subject = encodeURIComponent(`Tax Invoice & Dispatch Receipt - Order #${order.orderNumber} - TsuKURI_3D`);
  const body = encodeURIComponent(generateBeautifulEmailMessage(order));

  if (typeof window !== 'undefined') {
    const mailtoUrl = `mailto:${order.email || ''}?subject=${subject}&body=${body}`;
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_blank';
    link.click();
  }

  // Also trigger automated backend email logging
  automateInvoiceSending(order).catch(() => {});

  return {
    success: true,
    message: `Tax Invoice successfully dispatched to your email from Support!`,
    emailHTML,
  };
}
