const nodemailer = require('nodemailer');

/**
 * Send an email using SMTP configuration.
 * Fails safely without reversing or disrupting financial transactions.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials not configured in .env. Email skipped.');
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10) || 465,
      secure:
        process.env.SMTP_SECURE === 'true' ||
        parseInt(SMTP_PORT, 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    let sender = MAIL_FROM;
    if (sender) {
      sender = sender.replace(/^["']|["']$/g, '');
      if (!sender.includes('<')) {
        sender = `"EliteStore" <${sender}>`;
      }
    } else {
      sender = `"EliteStore" <${SMTP_USER}>`;
    }

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email notification error (non-blocking):', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send customer order confirmation email with summary
 */
const sendOrderConfirmationEmail = async (order, customerEmail) => {
  if (!customerEmail) return;

  const subject = `Order Confirmed - ${order.orderNumber}`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">₹${item.subtotal.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2b7a0b;">Order Confirmed!</h2>
      <p>Hi ${order.shippingAddress.fullName},</p>
      <p>Thank you for shopping with us. Your payment of <strong>₹${order.totalAmount.toFixed(2)}</strong> has been received.</p>
      <p><strong>Order Number:</strong> ${order.orderNumber}<br/>
      <strong>Payment ID:</strong> ${order.razorpayPaymentId || 'N/A'}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background: #f7f7f7;">
            <th style="padding: 8px; border: 1px solid #e0e0e0; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #e0e0e0; text-align: center;">Qty</th>
            <th style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <p style="text-align: right; margin-top: 12px; font-size: 16px;">
        <strong>Total Paid: ₹${order.totalAmount.toFixed(2)}</strong>
      </p>
      
      <p style="margin-top: 20px; font-size: 13px; color: #777;">
        We are preparing your items for delivery. You can track your shipment through your order history.
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    html,
    text: `Your order ${order.orderNumber} for ₹${order.totalAmount.toFixed(2)} has been confirmed.`,
  });
};

/**
 * Send welcome email to newly registered customer
 */
const sendWelcomeEmail = async (user) => {
  if (!user || !user.email) return;

  const storeName = process.env.STORE_NAME || 'EliteStore';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const subject = `Welcome to ${storeName}, ${user.name}! 🎉`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${storeName}</title>
    </head>
    <body style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center">
            <div style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0; text-align: left;">
              
              <!-- Header Brand Banner -->
              <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 36px 32px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">${storeName}</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 500; color: #e0e7ff;">Your Premium Shopping Destination</p>
              </div>

              <!-- Content Body -->
              <div style="padding: 36px 32px;">
                <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
                  Welcome aboard, ${user.name}! 👋
                </h2>

                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                  Thank you for registering with <strong>${storeName}</strong>. Your account has been successfully created and is ready to use!
                </p>

                <!-- Account Summary Card -->
                <div style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 28px;">
                  <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 12px 0; letter-spacing: 0.5px;">
                    Account Summary
                  </p>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; width: 120px;">Name:</td>
                      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${user.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Email:</td>
                      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${user.email}</td>
                    </tr>
                    ${
                      user.phone
                        ? `
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Phone:</td>
                      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${user.phone}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Account Status:</td>
                      <td style="padding: 6px 0; color: #10b981; font-weight: 600;">Active Customer</td>
                    </tr>
                  </table>
                </div>

                <!-- Next Steps Highlight -->
                <div style="margin-bottom: 32px;">
                  <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Here is what you can do right away:</h3>
                  <ul style="padding-left: 20px; margin: 0; color: #475569; font-size: 14px; line-height: 1.8;">
                    <li>Browse top-quality products across all our featured departments.</li>
                    <li>Add your favorite picks to your personal <strong>Wishlist</strong>.</li>
                    <li>Checkout securely using credit/debit cards, UPI, or net banking via <strong>Razorpay</strong>.</li>
                    <li>Track real-time shipment updates and download official tax invoices.</li>
                  </ul>
                </div>

                <!-- Call to Action Button -->
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${clientUrl}/products" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                    Start Shopping Now →
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0 0 6px 0;">Need help or have questions? Contact our support team anytime.</p>
                <p style="margin: 0;">© 2026 ${storeName}. All rights reserved.</p>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Welcome to ${storeName}, ${user.name}!\n\nYour account has been successfully created with ${user.email}.\n\nExplore our latest products and start shopping at: ${clientUrl}/products\n\n© 2026 ${storeName}. All rights reserved.`,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
};
