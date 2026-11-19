const crypto = require('crypto');
const mongoose = require('mongoose');
const razorpay = require('../config/razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const generateInvoice = require('../utils/generateInvoice');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

/**
 * Check if the active MongoDB deployment supports transactions (Replica Set)
 */
const supportsTransactions = () => {
  try {
    const topology = mongoose.connection.client?.topology;
    const desc = topology?.description;
    return (
      desc?.type === 'ReplicaSetWithPrimary' ||
      desc?.type === 'ReplicaSetNoPrimary' ||
      Boolean(desc?.setName)
    );
  } catch {
    return false;
  }
};

/**
 * Shared order fulfillment helper.
 * Deducts warehouse inventory conditionally, confirms order, clears cart,
 * generates invoice, and triggers customer confirmation email.
 */
const fulfillOrder = async (order, razorpayPaymentId, triggerSource = 'verification') => {
  // If order is already fulfilled and inventory deducted, do nothing (idempotent)
  if (order.inventoryDeducted && order.paymentStatus === 'paid') {
    return { success: true, order, onHold: false };
  }

  // Multi-document transactions require a MongoDB replica set or sharded cluster
  let session = null;
  const useTransaction = supportsTransactions();

  if (useTransaction) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionErr) {
      console.warn('Transaction session start failed:', sessionErr.message);
      session = null;
    }
  }

  const successfullyDeductedItems = [];
  let stockDepletedItem = null;

  try {
    // Perform conditional atomic deduction for each item
    for (const item of order.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, ...(session && { session }) }
      );

      if (!updatedProduct) {
        stockDepletedItem = item;
        break;
      }
      successfullyDeductedItems.push({ product: item.product, quantity: item.quantity });
    }

    // Handle race condition: payment captured but inventory is no longer available
    if (stockDepletedItem) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      } else {
        // Roll back any successful deductions in standalone mode
        for (const item of successfullyDeductedItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }

      order.paymentStatus = 'paid';
      order.paidAt = order.paidAt || new Date();
      order.razorpayPaymentId = razorpayPaymentId;
      order.inventoryDeducted = false;
      order.orderStatus = 'on_hold';
      order.statusHistory.push({
        status: 'on_hold',
        note: `Payment captured (${razorpayPaymentId}), but warehouse stock insufficient for '${stockDepletedItem.name}'. Placed on hold for Admin review.`,
        updatedAt: new Date(),
      });

      await order.save();
      return { success: true, order, onHold: true };
    }

    // All product inventories successfully deducted
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    order.paymentStatus = 'paid';
    order.paidAt = order.paidAt || new Date();
    order.razorpayPaymentId = razorpayPaymentId;
    order.inventoryDeducted = true;
    order.orderStatus = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      note: `Payment confirmed via ${triggerSource} (${razorpayPaymentId}). Inventory deducted.`,
      updatedAt: new Date(),
    });

    await order.save();

    // Clear customer's shopping cart
    await Cart.updateOne({ user: order.user }, { $set: { items: [] } });

    // Generate PDF invoice & upload to S3 (non-blocking)
    if (!order.invoiceS3Key) {
      generateInvoice(order)
        .then(async ({ invoiceNumber, invoiceS3Key }) => {
          if (invoiceS3Key) {
            order.invoiceNumber = invoiceNumber;
            order.invoiceS3Key = invoiceS3Key;
            order.invoiceGeneratedAt = new Date();
            await order.save();
          }
        })
        .catch((err) => console.error('Background invoice generation error:', err.message));
    }

    // Send order confirmation email (non-blocking)
    User.findById(order.user)
      .then((user) => {
        if (user && user.email) {
          sendOrderConfirmationEmail(order, user.email);
        }
      })
      .catch((err) => console.error('Background email error:', err.message));

    return { success: true, order, onHold: false };
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

/**
 * @desc    Create Razorpay Order for a pending checkout order
 * @route   POST /api/payment/create-order
 * @access  Private/Customer
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid',
      });
    }

    if (order.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total amount',
      });
    }

    const amountInPaise = Math.round(order.totalAmount * 100);

    // Reuse existing Razorpay order ID if already created and pending
    if (order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: 'Reusing existing Razorpay order',
        data: {
          orderId: order._id,
          razorpayOrderId: order.razorpayOrderId,
          amount: amountInPaise,
          currency: order.currency || 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: order.currency || 'INR',
        receipt: order.orderNumber,
      });
    } catch (rzpErr) {
      console.error('Razorpay Order Creation Error:', rzpErr);
      return res.status(502).json({
        success: false,
        message:
          rzpErr.error?.description ||
          'Failed to initialize order with payment gateway. Please verify Razorpay credentials.',
      });
    }

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: order._id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature & confirm order payment
 * @route   POST /api/payment/verify
 * @access  Private/Customer
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID mismatch with local order record',
      });
    }

    // Verify cryptographic HMAC SHA256 signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'RAZORPAY_KEY_SECRET is not configured on the server',
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf8'),
        Buffer.from(razorpay_signature, 'utf8')
      );
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification rejected.',
      });
    }

    // If order was already fulfilled (e.g. via parallel webhook), return success idempotently
    if (order.paymentStatus === 'paid' && order.inventoryDeducted) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified and order already confirmed',
        data: { order },
      });
    }

    // Optional gateway payment verification check if Razorpay API reachable
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (payment.order_id && payment.order_id !== razorpay_order_id) {
        return res.status(400).json({
          success: false,
          message: 'Payment does not belong to the expected Razorpay order',
        });
      }
      if (payment.currency && payment.currency !== (order.currency || 'INR')) {
        return res.status(400).json({
          success: false,
          message: 'Payment currency mismatch with order',
        });
      }
      if (payment.amount && payment.amount !== Math.round(order.totalAmount * 100)) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount mismatch with order',
        });
      }
    } catch (fetchErr) {
      // In testing or when gateway is in simulation mode, continue if signature is cryptographically valid
      console.warn('Razorpay fetch warning during verification:', fetchErr.message);
    }

    const { order: updatedOrder, onHold } = await fulfillOrder(
      order,
      razorpay_payment_id,
      'signature_verification'
    );

    res.status(200).json({
      success: true,
      message: onHold
        ? 'Payment verified, but order placed on hold due to warehouse stock depletion'
        : 'Payment verified and order confirmed successfully',
      data: { order: updatedOrder },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle incoming Razorpay webhooks (raw body signature verification)
 * @route   POST /api/payment/webhook
 * @access  Public / Razorpay Gateway Only
 */
const handleWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSignature || !webhookSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature or secret configuration',
      });
    }

    // Raw body buffer preserved by express.json({ verify: ... })
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(webhookSignature, 'utf8')
      );
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const eventId = req.headers['x-razorpay-event-id'] || req.body?.event_id;
    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;
    const orderEntity = req.body?.payload?.order?.entity;

    const razorpayOrderId = payment?.order_id || orderEntity?.id;

    if (!razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: 'Webhook received but no associated order identifier found',
      });
    }

    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      return res.status(200).json({
        success: true,
        message: 'No matching order found for this Razorpay Order ID',
      });
    }

    // Prevent duplicate webhook event execution
    if (eventId && order.processedWebhookEventIds.includes(eventId)) {
      return res.status(200).json({
        success: true,
        message: 'Webhook event already processed (idempotent)',
      });
    }

    // Record event ID for idempotency and persist
    if (eventId) {
      order.processedWebhookEventIds.push(eventId);
      await order.save();
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentId = payment?.id || order.razorpayPaymentId || `pay_webhook_${Date.now()}`;
      await fulfillOrder(order, paymentId, 'webhook');
    } else if (event === 'payment.failed') {
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.paymentFailureReason = payment?.error_description || 'Payment failed';
        order.statusHistory.push({
          status: 'pending',
          note: `Payment failed: ${order.paymentFailureReason}`,
          updatedAt: new Date(),
        });
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  fulfillOrder,
};
