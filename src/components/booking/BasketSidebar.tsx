import { useState } from 'react';
import { useBasket } from '../../contexts/BasketContext';
import { useAuth } from '../../contexts/AuthContext';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BasketSidebar() {
  const {
    items,
    coupon,
    paymentType,
    isValidatingCoupon,
    couponError,
    subtotal,
    couponDiscount,
    upfrontDiscount,
    total,
    weeklyAmount,
    removeItem,
    applyCoupon,
    removeCoupon,
    setPaymentType,
    clearBasket,
  } = useBasket();

  const { isAuthenticated, setShowLoginModal } = useAuth();
  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = async () => {
    const success = await applyCoupon(couponInput);
    if (success) {
      setCouponInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Navigate to checkout - in Astro Islands we'll handle this differently
    window.location.href = '/checkout';
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-[--color-text] mb-4">Your Basket</h2>
        <p className="text-gray-500 text-sm">
          Your basket is empty. Select a program from the schedule to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[--color-text]">Your Basket</h2>
        <button
          onClick={clearBasket}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Clear all
        </button>
      </div>

      {/* Line Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={`${item.session.id}-${item.child.id}`}
            className="flex items-start justify-between py-2 border-b border-gray-100"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-[--color-text]">
                {item.child.first_name} {item.child.last_name || ''}
              </p>
              <p className="text-sm text-gray-600">{item.session.program.name}</p>
              {item.discount_percent > 0 && (
                <p className="text-xs text-green-600">
                  {item.weeks_remaining} weeks remaining ({item.discount_percent}% off)
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[--color-text]">
                {formatPrice(item.price_cents)}
              </span>
              <button
                onClick={() => removeItem(item.session.id, item.child.id)}
                className="text-gray-400 hover:text-red-600"
                aria-label="Remove item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Code */}
      <div className="mb-6">
        {coupon ? (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
            <div>
              <p className="text-sm font-medium text-green-800">
                {coupon.code} applied
              </p>
              <p className="text-xs text-green-600">
                {coupon.discount_type === 'percent'
                  ? `${coupon.discount_value}% off`
                  : formatPrice(coupon.discount_value) + ' off'}
              </p>
            </div>
            <button
              onClick={removeCoupon}
              className="text-sm text-green-700 hover:text-green-900"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <label
              htmlFor="coupon"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {isValidatingCoupon ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="mt-1 text-xs text-red-600">{couponError}</p>
            )}
          </div>
        )}
      </div>

      {/* Payment Type Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Option
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentType('upfront')}
            className={`px-4 py-3 text-sm font-medium rounded-md border-2 transition-colors ${
              paymentType === 'upfront'
                ? 'border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div>Pay Upfront</div>
            <div className="text-xs mt-1 text-green-600">Save 10%</div>
          </button>
          <button
            onClick={() => setPaymentType('installment')}
            className={`px-4 py-3 text-sm font-medium rounded-md border-2 transition-colors ${
              paymentType === 'installment'
                ? 'border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div>Weekly x8</div>
            <div className="text-xs mt-1 text-gray-500">
              {weeklyAmount > 0 ? formatPrice(weeklyAmount) + '/week' : ''}
            </div>
          </button>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-[--color-text]">{formatPrice(subtotal)}</span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Coupon ({coupon?.code})</span>
            <span className="text-green-600">-{formatPrice(couponDiscount)}</span>
          </div>
        )}

        {upfrontDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Upfront Discount (10%)</span>
            <span className="text-green-600">-{formatPrice(upfrontDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {paymentType === 'installment' && (
          <p className="text-xs text-gray-500 text-center">
            8 weekly payments of {formatPrice(weeklyAmount)}
          </p>
        )}
      </div>

      {/* Checkout Button */}
      <div className="mt-6">
        <button
          onClick={handleCheckout}
          className="block w-full text-center px-4 py-3 bg-[--color-primary] text-white font-medium rounded-md hover:opacity-90 transition-colors"
        >
          {isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}
        </button>
      </div>
    </div>
  );
}
