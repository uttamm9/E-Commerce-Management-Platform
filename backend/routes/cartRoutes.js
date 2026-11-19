const express = require('express');
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const {
  addToCartValidator,
  updateCartValidator,
  cartProductIdParamValidator,
} = require('../validators/cartValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');

// All cart routes require user authentication
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCartValidator, validate, addToCart);
router.post('/', addToCartValidator, validate, addToCart);
router.put('/update', updateCartValidator, validate, updateCartQuantity);
router.put('/', updateCartValidator, validate, updateCartQuantity);
router.delete('/clear', clearCart);
router.delete('/', clearCart);
router.delete(
  '/remove/:productId',
  cartProductIdParamValidator,
  validate,
  removeFromCart
);
router.delete(
  '/:productId',
  cartProductIdParamValidator,
  validate,
  removeFromCart
);

module.exports = router;
