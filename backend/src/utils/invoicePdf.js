const PDFDocument = require('pdfkit');

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
const shortId = (id) => String(id).slice(-8).toUpperCase();

// Writes a tax-style invoice PDF for one order straight into the HTTP response.
function buildInvoicePdf(order, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${shortId(order._id)}.pdf"`);
  doc.pipe(res);

  const dark = '#0F2238';
  const muted = '#64748B';
  const right = 545;

  doc.fillColor(dark).font('Helvetica-Bold').fontSize(20).text('Ashwa India');
  doc.font('Helvetica').fontSize(10).fillColor(muted).text('Tax invoice');

  doc.fillColor(dark).font('Helvetica-Bold').fontSize(11)
    .text(`Invoice #${shortId(order._id)}`, 350, 50, { width: right - 350, align: 'right' });
  doc.font('Helvetica').fontSize(10).fillColor(muted)
    .text(new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 350, 66, { width: right - 350, align: 'right' });

  const address = order.shippingAddress
    ? [order.shippingAddress.line1, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', ')
    : '';

  doc.moveDown(3);
  const top = doc.y;
  doc.fillColor(muted).fontSize(9).text('SOLD BY', 50, top);
  doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text(order.seller?.businessName || order.seller?.name || 'Seller', 50, top + 14);
  doc.fillColor(muted).font('Helvetica').fontSize(9).text('BILLED TO', 320, top);
  doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text(order.buyer?.name || order.buyer?.phone || 'Customer', 320, top + 14);
  doc.font('Helvetica').fontSize(10).fillColor(dark).text(order.shippingAddress?.phone || order.buyer?.phone || '', 320, doc.y);
  if (address) doc.text(address, 320, doc.y, { width: 225 });

  // Items table
  const tableTop = Math.max(doc.y, top + 60) + 24;
  const cols = { item: 50, qty: 330, price: 390, amount: 470 };
  doc.font('Helvetica-Bold').fontSize(9).fillColor(muted);
  doc.text('ITEM', cols.item, tableTop);
  doc.text('QTY', cols.qty, tableTop, { width: 40, align: 'right' });
  doc.text('PRICE', cols.price, tableTop, { width: 70, align: 'right' });
  doc.text('AMOUNT', cols.amount, tableTop, { width: 75, align: 'right' });
  doc.moveTo(50, tableTop + 14).lineTo(right, tableTop + 14).strokeColor('#E4E1D8').stroke();

  let y = tableTop + 22;
  doc.font('Helvetica').fontSize(10).fillColor(dark);
  for (const item of order.items) {
    const name = `${item.product?.name || 'Item'}${item.variantLabel ? ` (${item.variantLabel})` : ''}`;
    doc.text(name, cols.item, y, { width: 260 });
    doc.text(String(item.quantity), cols.qty, y, { width: 40, align: 'right' });
    doc.text(money(item.price), cols.price, y, { width: 70, align: 'right' });
    doc.text(money(item.price * item.quantity), cols.amount, y, { width: 75, align: 'right' });
    y = Math.max(doc.y, y + 16) + 6;
  }

  // Totals
  y += 10;
  doc.moveTo(330, y).lineTo(right, y).strokeColor('#E4E1D8').stroke();
  y += 8;
  const row = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(bold ? dark : muted);
    doc.text(label, 330, y, { width: 130 });
    doc.fillColor(dark).text(value, 390, y, { width: right - 390, align: 'right' });
    y += bold ? 20 : 16;
  };
  row('Subtotal', money(order.subtotal ?? order.total + (order.discount || 0)));
  if (order.discount) row(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${money(order.discount)}`);
  if (order.gst?.amount) row(`GST (${order.gst.percent}%)`, money(order.gst.amount));
  row('Total', money(order.total), true);

  doc.font('Helvetica').fontSize(10).fillColor(muted)
    .text(`Paid by ${order.paymentMethod === 'cod' ? 'cash on delivery' : order.paymentMethod === 'wallet' ? 'Ashwa wallet' : 'online payment'}`, 50, y + 10);
  doc.fillColor(muted).fontSize(9).text('Thank you for shopping with Ashwa India.', 50, 760, { align: 'center', width: 495 });

  doc.end();
}

module.exports = { buildInvoicePdf };
