const PDFDocument = require('pdfkit');
const { uploadToS3 } = require('../config/s3');

/**
 * Generate PDF Invoice using PDFKit and upload directly to AWS S3.
 *
 * @param {Object} order - Order document with historical snapshot details
 * @returns {Promise<{ invoiceNumber: string, invoiceS3Key: string, invoiceUrl: string, pdfBuffer: Buffer }>}
 */
const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          const invoiceNumber =
            order.invoiceNumber || `INV-${order.orderNumber.replace(/^ORD-/, '')}`;

          // Upload invoice buffer to AWS S3 under invoices/
          const uploadResult = await uploadToS3(
            pdfBuffer,
            `${invoiceNumber}.pdf`,
            'application/pdf',
            'invoices'
          );

          resolve({
            invoiceNumber,
            invoiceS3Key: uploadResult.key,
            invoiceUrl: uploadResult.url,
            pdfBuffer,
          });
        } catch (uploadError) {
          console.error('Invoice S3 upload error:', uploadError.message);
          resolve({
            invoiceNumber:
              order.invoiceNumber || `INV-${order.orderNumber.replace(/^ORD-/, '')}`,
            invoiceS3Key: null,
            invoiceUrl: null,
            pdfBuffer: Buffer.concat(buffers),
          });
        }
      });

      doc.on('error', (err) => reject(err));

      // --- Header Details ---
      const storeName = process.env.STORE_NAME || 'Elite Store';
      const storeEmail = process.env.STORE_EMAIL || 'support@elitestore.com';
      const storePhone = process.env.STORE_PHONE || '+91 9876543210';

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(storeName, 50, 50);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Email: ${storeEmail}`, 50, 75)
        .text(`Phone: ${storePhone}`, 50, 90);

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', 350, 50, { align: 'right' });

      const invoiceNumber =
        order.invoiceNumber || `INV-${order.orderNumber.replace(/^ORD-/, '')}`;
      const invoiceDate = new Date(
        order.paidAt || order.createdAt
      ).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Invoice No: ${invoiceNumber}`, 350, 75, { align: 'right' })
        .text(`Order No: ${order.orderNumber}`, 350, 90, { align: 'right' })
        .text(`Date: ${invoiceDate}`, 350, 105, { align: 'right' });

      // --- Divider ---
      doc
        .moveTo(50, 125)
        .lineTo(550, 125)
        .stroke();

      // --- Customer & Shipping Details ---
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Billed & Shipped To:', 50, 140)
        .font('Helvetica')
        .fontSize(9)
        .text(order.shippingAddress.fullName, 50, 155)
        .text(`Phone: ${order.shippingAddress.phone}`, 50, 170)
        .text(
          `${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2
            ? ', ' + order.shippingAddress.addressLine2
            : ''
          }`,
          50,
          185
        )
        .text(
          `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`,
          50,
          200
        )
        .text(order.shippingAddress.country, 50, 215);

      // --- Payment Details ---
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Payment Information:', 350, 140, { align: 'right' })
        .font('Helvetica')
        .fontSize(9)
        .text(
          `Method: ${(order.paymentMethod || 'razorpay').toUpperCase()}`,
          350,
          155,
          { align: 'right' }
        )
        .text(
          `Status: ${(order.paymentStatus || 'paid').toUpperCase()}`,
          350,
          170,
          { align: 'right' }
        )
        .text(
          `Payment ID: ${order.razorpayPaymentId || 'N/A'}`,
          350,
          185,
          { align: 'right' }
        );

      // --- Itemized Line Items Table ---
      const tableTop = 245;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Item Description', 50, tableTop)
        .text('SKU', 250, tableTop)
        .text('Qty', 350, tableTop, { width: 40, align: 'right' })
        .text('Unit Price', 400, tableTop, { width: 60, align: 'right' })
        .text('Subtotal', 470, tableTop, { width: 70, align: 'right' });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      let y = tableTop + 22;
      doc.font('Helvetica').fontSize(9);

      for (const item of order.items) {
        doc
          .text(item.name.substring(0, 32), 50, y)
          .text(item.sku, 250, y)
          .text(item.quantity.toString(), 350, y, { width: 40, align: 'right' })
          .text(`₹${item.unitPrice.toFixed(2)}`, 400, y, {
            width: 60,
            align: 'right',
          })
          .text(`₹${item.subtotal.toFixed(2)}`, 470, y, {
            width: 70,
            align: 'right',
          });

        y += 20;
      }

      doc
        .moveTo(50, y + 5)
        .lineTo(550, y + 5)
        .stroke();

      // --- Calculations Summary ---
      y += 15;
      doc.font('Helvetica').fontSize(9);
      doc.text('Subtotal:', 380, y, { width: 80, align: 'right' });
      doc.text(`₹${order.subtotal.toFixed(2)}`, 470, y, {
        width: 70,
        align: 'right',
      });

      y += 15;
      doc.text('Tax (GST):', 380, y, { width: 80, align: 'right' });
      doc.text(`₹${order.taxAmount.toFixed(2)}`, 470, y, {
        width: 70,
        align: 'right',
      });

      y += 15;
      doc.text('Shipping:', 380, y, { width: 80, align: 'right' });
      doc.text(`₹${order.shippingFee.toFixed(2)}`, 470, y, {
        width: 70,
        align: 'right',
      });

      y += 16;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Total Amount:', 380, y, { width: 80, align: 'right' });
      doc.text(`₹${order.totalAmount.toFixed(2)}`, 470, y, {
        width: 70,
        align: 'right',
      });

      // --- Footer ---
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(
          'Thank you for shopping with us! This is a system-generated tax invoice.',
          50,
          y + 40,
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoice;
