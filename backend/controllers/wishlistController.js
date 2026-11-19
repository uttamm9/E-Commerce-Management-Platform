const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { formatCartResponse } = require('./cartController');

/**
 * Format populated wishlist document
 */
const formatWishlistResponse = (wishlist) => {
  if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
    return {
      products: [],
      totalItems: 0,
    };
  }

  const activeProducts = wishlist.products
    .filter(
      (product) =>
        product &&
        product.status === 'active' &&
        (!product.category || product.category.status === 'active')
    )
    .map((product) => ({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      images: product.images || [],
      image:
        product.images && product.images.length > 0
          ? product.images[0].url
          : '',
      stock: product.stock,
      availability: product.availability,
      brand: product.brand,
      category: product.category,
    }));

  return {
    products: activeProducts,
    totalItems: activeProducts.length,
  };
};

/**
 * @desc    Get current customer's wishlist
 * @route   GET /api/wishlist
 * @access  Private/Customer
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      populate: { path: 'category', select: 'name slug status' },
    });

    res.status(200).json({
      success: true,
      message: 'Wishlist fetched successfully',
      data: formatWishlistResponse(wishlist),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a product to customer's wishlist
 * @route   POST /api/wishlist/add
 * @access  Private/Customer
 */
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

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

    // Find or create customer's wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    // Prevent duplicate products in wishlist
    if (wishlist.products.some((p) => p.toString() === productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist',
      });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    const populatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      populate: { path: 'category', select: 'name slug status' },
    });

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: formatWishlistResponse(populatedWishlist),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a product from customer's wishlist
 * @route   DELETE /api/wishlist/remove/:productId
 * @access  Private/Customer
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    const itemIndex = wishlist.products.findIndex(
      (p) => p.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your wishlist',
      });
    }

    wishlist.products.splice(itemIndex, 1);
    await wishlist.save();

    const populatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      populate: { path: 'category', select: 'name slug status' },
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully',
      data: formatWishlistResponse(populatedWishlist),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move a product from wishlist to cart
 * @route   POST /api/wishlist/move-to-cart
 * @access  Private/Customer
 */
const moveToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const moveQuantity = parseInt(quantity, 10) || 1;

    // Check if product is currently in customer's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist || !wishlist.products.some((p) => p.toString() === productId)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your wishlist',
      });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId).populate('category');
    if (!product || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Product is currently unavailable',
      });
    }

    if (product.category && product.category.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Product category is currently unavailable',
      });
    }

    // Check stock availability
    if (product.stock === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Product is currently out of stock and cannot be moved to cart. It remains in your wishlist.',
      });
    }

    // Find or create customer's cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    const targetQuantity =
      (existingIndex > -1 ? cart.items[existingIndex].quantity : 0) +
      moveQuantity;

    // If stock insufficient, do not remove from wishlist
    if (targetQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${targetQuantity}) exceeds available stock (${product.stock}). Product remains in your wishlist.`,
      });
    }

    // Update cart
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = targetQuantity;
    } else {
      cart.items.push({ product: productId, quantity: moveQuantity });
    }
    await cart.save();

    // Remove from wishlist only after successful cart save
    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    await wishlist.save();

    const [populatedCart, populatedWishlist] = await Promise.all([
      Cart.findById(cart._id).populate({
        path: 'items.product',
        populate: { path: 'category', select: 'name slug status' },
      }),
      Wishlist.findById(wishlist._id).populate({
        path: 'products',
        populate: { path: 'category', select: 'name slug status' },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Product moved to cart successfully',
      data: {
        cart: formatCartResponse(populatedCart),
        wishlist: formatWishlistResponse(populatedWishlist),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  formatWishlistResponse,
};
