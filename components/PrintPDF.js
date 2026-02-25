'use client';

const LOGO_TEXT = 'Tolun Logistics';
const fmtN = (n) => (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toDataURL(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function printExportPDF(data, boxes) {
  const fields = [
    ['Order Code', data.order_code], ['Client', data.client],
    ['Date', data.export_date], ['MAWB No', data.mawb_no],
    ['Item', data.item], ['Sender', data.sender],
    ['Sender Phone', data.sender_phone], ['Recipient', data.recipient],
    ['Recipient Phone', data.recipient_phone], ['Total Boxes', data.total_boxs],
    ['Total GW', data.total_gw], ['Bill THB', data.bill_thb],
    ['Bill MNT', data.bill_mnt], ['Payment', data.payment],
    ['Box Type', data.box_type], ['Remark', data.remark],
  ];

  let boxesHTML = '';
  if (boxes && boxes.length > 0) {
    for (const b of boxes) {
      let photosHTML = '';
      const photos = b.photos || {};
      const photoLabels = { received_package: 'Received package', items_in_box: 'Items in the box', box_and_weight: 'Box and weight', other_1: 'Other 1', other_2: 'Other 2' };
      for (const [key, label] of Object.entries(photoLabels)) {
        if (photos[key]) {
          const d = await toDataURL(photos[key]);
          if (d) photosHTML += `<div style="display:inline-block;margin:4px;text-align:center"><img src="${d}" style="max-height:100px;border-radius:6px"/><div style="font-size:9px;color:#888;margin-top:2px">${label}</div></div>`;
        }
      }
      const items = (b.items || []).map(it => `<tr><td style="padding:4px 8px;border:1px solid #e0e0e0;font-size:11px">${it.item||'-'}</td><td style="padding:4px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:center">${it.unit||'-'}</td><td style="padding:4px 8px;border:1px solid #e0e0e0;font-size:11px">${it.type||'-'}</td></tr>`).join('');
      boxesHTML += `
        <div style="margin-top:12px;padding:12px;border:1px solid #e0d8d0;border-radius:8px;background:#faf8f5">
          <div style="font-weight:700;color:#c0392b;margin-bottom:6px;font-size:13px">${b.box_code || 'Box'}</div>
          <table style="width:100%;font-size:11px;margin-bottom:6px"><tr>
            <td><b>Size:</b> ${b.box_w}×${b.box_h}×${b.box_l} cm</td>
            <td><b>Dim:</b> ${b.dimension}</td>
            <td><b>GW:</b> ${b.gross_weight} kg</td>
            <td><b>WR:</b> ${b.weight_result} kg</td>
          </tr></table>
          ${items ? `<table style="width:100%;border-collapse:collapse;margin-bottom:6px"><thead><tr style="background:#e8ddd3"><th style="padding:4px 8px;border:1px solid #e0e0e0;font-size:10px;text-align:left">Item</th><th style="padding:4px 8px;border:1px solid #e0e0e0;font-size:10px;text-align:center">Unit</th><th style="padding:4px 8px;border:1px solid #e0e0e0;font-size:10px;text-align:left">Type</th></tr></thead><tbody>${items}</tbody></table>` : ''}
          ${photosHTML ? `<div style="margin-top:6px">${photosHTML}</div>` : ''}
        </div>`;
    }
  }

  openPrintWindow('Export — ' + (data.order_code || ''), fields, boxesHTML ? `<div style="margin-top:16px"><div style="font-size:14px;font-weight:700;color:#c0392b;margin-bottom:8px">Boxes (${boxes.length})</div>${boxesHTML}</div>` : '');
}

export async function printClientPDF(data) {
  const fields = [
    ['Client Code', data.client_code], ['Name', data.name],
    ['Nationality', data.nationality], ['Gender', data.gender],
    ['Contact Channel', data.contact_channel], ['Supporter', data.supporter],
    ['Sender Address', data.sender_address], ['Sender Phone', data.sender_phone],
    ['Recipient Address', data.recipient_address], ['Recipient Phone', data.recipient_phone],
    ['Remark', data.remark],
  ];

  let imagesHTML = '';
  const imageFields = [
    ['ID Card', data.id_card_image], ['Profile', data.profile_image],
    ['Sender', data.sender_image], ['Recipient', data.recipient_image],
  ];
  for (const [label, url] of imageFields) {
    if (url) {
      const d = await toDataURL(url);
      if (d) imagesHTML += `<div style="display:inline-block;margin:6px;text-align:center"><img src="${d}" style="max-height:140px;border-radius:8px"/><div style="font-size:10px;color:#888;margin-top:3px">${label}</div></div>`;
    }
  }

  openPrintWindow('Client — ' + (data.name || ''), fields, imagesHTML ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e0d8d0"><div style="font-size:13px;font-weight:700;margin-bottom:8px">Images</div>${imagesHTML}</div>` : '');
}

export async function printNotePDF(data) {
  const fields = [
    ['Date', data.date], ['Topic', data.topic],
    ['Type', data.type], ['Description', data.description],
  ];

  let imagesHTML = '';
  if (data.images && data.images.length > 0) {
    for (const url of data.images) {
      const d = await toDataURL(url);
      if (d) imagesHTML += `<div style="display:inline-block;margin:6px"><img src="${d}" style="max-height:160px;border-radius:8px"/></div>`;
    }
  }

  openPrintWindow('Note — ' + (data.topic || ''), fields, imagesHTML ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e0d8d0"><div style="font-size:13px;font-weight:700;margin-bottom:8px">Images</div>${imagesHTML}</div>` : '');
}

export function printInvoicePDF(ef) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice — ${ef.order_code || ''}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Poppins',sans-serif;background:#fff;color:#1a1a1a;padding:40px}
@media print{body{padding:20px}@page{margin:14mm}}
.inv-header{display:flex;align-items:center;gap:14px;margin-bottom:28px;padding-bottom:18px;border-bottom:3px solid #1a1a1a}
.inv-logo{width:50px;height:50px;background:#1a1a1a;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:18px}
.inv-title{font-size:22px;font-weight:700}
.inv-sub{font-size:11px;color:#a89080;font-weight:500}
.inv-badge{margin-left:auto;background:#c0392b;color:white;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px}
.inv-section{margin-bottom:20px}
.inv-section-title{font-size:12px;font-weight:700;color:#a89080;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e8ddd3}
.inv-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}
.inv-label{font-size:10px;color:#a09890;text-transform:uppercase;letter-spacing:0.5px}
.inv-value{font-size:13px;font-weight:500;margin-bottom:6px}
.inv-highlight{font-size:15px;font-weight:700;color:#c0392b}
table.inv-table{width:100%;border-collapse:collapse;margin-top:12px}
table.inv-table th{background:#1a1a1a;color:white;padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:1px;text-align:left}
table.inv-table td{padding:10px 14px;font-size:12px;border-bottom:1px solid #e8ddd3}
table.inv-table tr:last-child td{border-bottom:none}
.inv-totals{margin-top:20px;background:#faf8f5;border-radius:12px;padding:20px;border:1px solid #e8ddd3}
.inv-total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
.inv-total-row.big{font-size:16px;font-weight:700;padding-top:10px;margin-top:8px;border-top:2px solid #1a1a1a}
.inv-footer{margin-top:32px;padding-top:16px;border-top:1px solid #e8ddd3;text-align:center;font-size:10px;color:#a09890}
</style></head><body>
<div class="inv-header">
  <div class="inv-logo">TL</div>
  <div>
    <div class="inv-title">${LOGO_TEXT}</div>
    <div class="inv-sub">Invoice / Export Form</div>
  </div>
  <div class="inv-badge">INVOICE</div>
</div>

<div class="inv-section">
  <div class="inv-section-title">Export Information</div>
  <div class="inv-grid">
    <div><div class="inv-label">Order Code</div><div class="inv-value inv-highlight">${ef.order_code || '-'}</div></div>
    <div><div class="inv-label">Export Date</div><div class="inv-value">${ef.export_date || '-'}</div></div>
    <div><div class="inv-label">Client</div><div class="inv-value">${ef.client || '-'}</div></div>
    <div><div class="inv-label">Type Box</div><div class="inv-value">${ef.type_box || '-'}</div></div>
  </div>
</div>

<div class="inv-section">
  <div class="inv-section-title">Weight & Pricing</div>
  <table class="inv-table">
    <thead><tr>
      <th>Item</th><th style="text-align:right">Value</th>
    </tr></thead>
    <tbody>
      <tr><td>Total Boxes</td><td style="text-align:right">${ef.total_boxes || 0}</td></tr>
      <tr><td>Total GW</td><td style="text-align:right">${fmtN(ef.total_gw)} kg</td></tr>
      <tr><td>Weight Result</td><td style="text-align:right">${fmtN(ef.weight_result)} kg</td></tr>
      <tr><td>Weight Difference</td><td style="text-align:right">${fmtN(ef.weight_diff)} kg</td></tr>
      <tr><td>Price per kg</td><td style="text-align:right">${fmtN(ef.price_per_kg)}</td></tr>
      <tr><td>Price per diff</td><td style="text-align:right">${fmtN(ef.price_per_diff)}</td></tr>
    </tbody>
  </table>
</div>

<div class="inv-totals">
  <div class="inv-total-row"><span>Price per kg × Weight Result</span><span>${fmtN(ef.price_per_kg)} × ${fmtN(ef.weight_result)}</span></div>
  <div class="inv-total-row"><span>Price per diff × Weight Diff</span><span>${fmtN(ef.price_per_diff)} × ${fmtN(ef.weight_diff)}</span></div>
  <div class="inv-total-row big"><span>Total THB</span><span style="color:#c0392b">฿ ${fmtN(ef.total_thb)}</span></div>
  <div class="inv-total-row big"><span>Total MNT</span><span style="color:#2c6ea0">₮ ${fmtN(ef.total_mnt)}</span></div>
</div>

<div class="inv-footer">
  <div>${LOGO_TEXT} — Thank you for your business</div>
  <div style="margin-top:4px">Generated: ${new Date().toLocaleString()}</div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(html);
  w.document.close();
}

function openPrintWindow(title, fields, extraHTML) {
  const rows = fields.map(([label, val]) => {
    const v = val || '-';
    return `<tr><td style="padding:8px 12px;font-size:11px;font-weight:600;color:#8b7355;width:160px;vertical-align:top;border-bottom:1px solid #f0ebe5">${label}</td><td style="padding:8px 12px;font-size:12px;color:#1a1a1a;border-bottom:1px solid #f0ebe5;white-space:pre-wrap">${v}</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Poppins',sans-serif;background:#fff;color:#1a1a1a;padding:32px}
@media print{body{padding:16px}@page{margin:12mm}}
</style></head><body>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1a1a1a">
  <div style="width:44px;height:44px;background:#1a1a1a;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px">TL</div>
  <div><div style="font-size:18px;font-weight:700;color:#1a1a1a">${LOGO_TEXT}</div><div style="font-size:11px;color:#a89080;font-weight:500">${title}</div></div>
  <div style="margin-left:auto;font-size:10px;color:#a09890">Printed: ${new Date().toLocaleString()}</div>
</div>
<table style="width:100%;border-collapse:collapse">${rows}</table>
${extraHTML}
<script>window.onload=function(){window.print()}</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(html);
  w.document.close();
}
