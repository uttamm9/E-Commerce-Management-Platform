import React from 'react';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from '../../utils/constants';

export const OrderStatusBadge = ({ status }) => {
  const normalized = status?.toLowerCase() || 'pending';
  const label = ORDER_STATUS_LABELS[normalized] || normalized;
  const style =
    ORDER_STATUS_COLORS[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      {label}
    </span>
  );
};

export const PaymentStatusBadge = ({ status }) => {
  const normalized = status?.toLowerCase() || 'pending';
  const style =
    PAYMENT_STATUS_COLORS[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${style}`}
    >
      {normalized}
    </span>
  );
};

export default OrderStatusBadge;
