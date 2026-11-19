/**
 * Formats a number as INR currency
 * @param {number} amount - Amount in INR
 * @returns {string} - Formatted currency string
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(amount));
};

export default formatPrice;
