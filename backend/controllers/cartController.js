const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Format populated cart document with calculated subtotal, prices, and availability
 */
const formatCartResponse = (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      items: [],
      totalItems: 0,
      subtotal: 0,
    };
  }

  const formattedItems = [];
  let totalItems = 0;
  let subtotal = 0;

  for (const item of cart.items) {
    if (!item.product) continue;

    const product = item.product;
    const effectivePrice =
      product.discountPrice > 0 && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    const itemSubtotal = parseFloat(
      (effectivePrice * item.quantity).toFixed(2)
    );

    subtotal += itemSubtotal;
    totalItems += item.quantity;

    formattedItems.push({
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image:
          product.images && product.images.length > 0
            ? product.images[0].url
            : '',
        images: product.images || [],
        price: product.price,
        discountPrice: product.discountPrice,
        availableStock: product.stock,
        availability: product.availability,
        status: product.status,
        brand: product.brand,
        category: product.category,
      },
      quantity: item.quantity,
      price: effectivePrice,
      originalPrice: product.price,
      subtotal: itemSubtotal,
      isAvailable:
        product.status === 'active' &&
        (!product.category || product.category.status === 'active') &&
        product.stock >= item.quantity,
    });
  }

  return {
    items: formattedItems,
    totalItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
  };
};

/**
 * @desc    Get current customer's shopping cart
 * @route   GET /api/cart
 * @access  Private/Customer
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      populate: { path: 'category', select: 'name slug status' },
    });

    res.status(200).json({
      success: true,
      message: 'Cart fetched successfully',
      data: formatCartResponse(cart),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add product to cart or increase quantity
 * @route   POST /api/cart/add
 * @access  Private/Customer
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const addQuantity = parseInt(quantity, 10) || 1;

    // Verify product exists and is active
    const product = await Product.findById(productId).populate('category');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This product is currently unavailable',
      });
    }

    if (product.category && product.category.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Product category is currently unavailable',
      });
    }

    if (product.stock === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently out of stock',
      });
    }

    // Find or create customer's cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if product already in cart
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let targetQuantity = addQuantity;
    if (existingIndex > -1) {
      targetQuantity = cart.items[existingIndex].quantity + addQuantity;
    }

    // Verify requested total quantity against available stock
    if (targetQuantity > product.stock) {
      const alreadyInCart =
        existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Cannot add ${addQuantity} item(s). Requested total (${targetQuantity}) exceeds available stock (${product.stock}). You already have ${alreadyInCart} in your cart.`,
      });
    }

    // Update or insert item
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = targetQuantity;
    } else {
      cart.items.push({ product: productId, quantity: addQuantity });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      populate: { path: 'category', select: 'name slug status' },
    });

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      data: formatCartResponse(populatedCart),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quantity of a product in the cart
 * @route   PUT /api/cart/update
 * @access  Private/Customer
 */
const updateCartQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const newQuantity = parseInt(quantity, 10);

    if (!newQuantity || newQuantity < 1) {
      return res.status(400).json({
        success: false,
        message:
          'Quantity must be a positive integer. To remove the item, please use the remove API.',
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your cart',
      });
    }

    // Check product status and available stock
    const product = await Product.findById(productId).populate('category');
    if (!product || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Product is currently unavailable',
      });
    }

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${newQuantity}) exceeds available stock (${product.stock})`,
      });
    }

    cart.items[itemIndex].quantity = newQuantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      populate: { path: 'category', select: 'name slug status' },
    });

    res.status(200).json({
      success: true,
      message: 'Cart quantity updated successfully',
      data: formatCartResponse(populatedCart),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a product from the customer's cart
 * @route   DELETE /api/cart/remove/:productId
 * @access  Private/Customer
 */
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your cart',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      populate: { path: 'category', select: 'name slug status' },
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from cart successfully',
      data: formatCartResponse(populatedCart),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all items from current customer's cart
 * @route   DELETE /api/cart/clear
 * @access  Private/Customer
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        totalItems: 0,
        subtotal: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  formatCartResponse,
};
