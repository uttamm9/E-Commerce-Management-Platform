const express = require('express');
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
} = require('../controllers/wishlistController');
const {
  addToWishlistValidator,
  moveToCartValidator,
  wishlistProductIdParamValidator,
} = require('../validators/wishlistValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');

// All wishlist routes require user authentication
router.use(protect);

router.get('/', getWishlist);
router.post('/add', addToWishlistValidator, validate, addToWishlist);
router.post('/', addToWishlistValidator, validate, addToWishlist);
router.delete(
  '/remove/:productId',
  wishlistProductIdParamValidator,
  validate,
  removeFromWishlist
);
router.delete(
  '/:productId',
  wishlistProductIdParamValidator,
  validate,
  removeFromWishlist
);
router.post('/move-to-cart', moveToCartValidator, validate, moveToCart);

module.exports = router;
