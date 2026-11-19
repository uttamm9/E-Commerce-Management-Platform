export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  on_hold: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export const PAYMENT_STATUS_COLORS = {
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const AVAILABILITY_LABELS = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export const AVAILABILITY_COLORS = {
  in_stock: 'bg-green-100 text-green-800',
  low_stock: 'bg-yellow-100 text-yellow-800',
  out_of_stock: 'bg-red-100 text-red-800',
};
