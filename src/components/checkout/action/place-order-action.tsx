import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCreateOrder } from '@framework/orders';
import { useCart } from '@store/quick-cart/cart.context';
import { useAtom } from 'jotai';
import { checkoutAtom, discountAtom, walletAtom } from '@store/checkout';
import {
  calculatePaidTotal,
  calculateTotal,
} from '@store/quick-cart/cart.utils';
import { useTranslation } from 'next-i18next';
import Button from '@components/ui/button';
import ValidationError from '@components/ui/validation-error';
import isEmpty from 'lodash/isEmpty';
import { PaymentGateway } from '@type/index';

export const PlaceOrderAction: React.FC<{ children: React.ReactNode }> = (
  props,
) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createOrder, isLoading } = useCreateOrder();
  const { items } = useCart();
  const [bkashPaymentResponse, setBkashPaymentResponse] = useState(null);

  // Atoms for managing checkout state
  const [
    {
      billing_address,
      shipping_address,
      delivery_time,
      coupon,
      verified_response,
      customer_contact,
      customer_name,
      customer_email,
      payment_gateway,
      note,
    },
  ] = useAtom(checkoutAtom);
  const [discount] = useAtom(discountAtom);
  const [use_wallet_points] = useAtom(walletAtom);

  // Filter unavailable items
  const available_items = items?.filter(
    (item) => !verified_response?.unavailable_products?.includes(item.id),
  );

  // Calculate order totals
  const subtotal = calculateTotal(available_items);
  const total = calculatePaidTotal(
    {
      totalAmount: subtotal,
      tax: verified_response?.total_tax!,
      shipping_charge: verified_response?.shipping_charge!,
    },
    Number(discount),
  );

  // Function to initiate Bkash payment
  const initiateBkashPayment = async () => {
    try {
      // Open a blank popup immediately to comply with browser policies
      const popup = window.open('', '_blank', 'width=400,height=500');

      if (!popup) {
        alert('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Show a temporary message in the popup
      popup.document.write('<p>Loading payment page...</p>');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/bkash/create-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total }),
        },
      );
      const paymentData = await response.json();
      console.log(paymentData);
      setBkashPaymentResponse(paymentData);

      if (
        (paymentData?.success || paymentData?.statusMessage == 'Successful') &&
        paymentData?.bkashURL
      ) {
        // Navigate the popup to the payment URL
        popup.location.href = paymentData?.bkashURL;

        // Event listener for receiving payment response
        const handlePaymentResponse = (event: MessageEvent) => {
          console.log('Received event:', event);

          // Allow only trusted origins
          // if (event.origin !== window.location.origin) {
          //   console.warn('Origin mismatch:', event.origin);
          //   return;
          // }

          const paymentResponse = event.data;
          console.log('Parsed payment response:', paymentResponse);
          if (
            paymentResponse &&
            typeof paymentResponse === 'object' &&
            'success' in paymentResponse
          ) {
            if (paymentResponse.success) {
              console.log('Payment successful!');
              let dataWithReceivedTransaction = {
                products: available_items?.map((item) => ({
                  product_id: item.id,
                  order_quantity: item.quantity,
                })),
                amount: subtotal,
                coupon_id: coupon?.id,
                discount,
                paid_total: total,
                sales_tax: verified_response?.total_tax,
                delivery_fee: verified_response?.shipping_charge,
                total,
                delivery_time: delivery_time?.title,
                customer_contact,
                customer_name,
                customer_email,
                note,
                use_wallet_points,
                payment_gateway:
                  payment_gateway ?? (bkashPaymentResponse ? 'BKASH' : null),
                billing_address: billing_address?.address,
                shipping_address: shipping_address?.address,
                transaction: paymentResponse?.transaction_data,
              };
              createOrder(dataWithReceivedTransaction);
            } else {
              alert(paymentResponse.message || 'Payment failed or canceled.');
            }
          }

          // Clean up the event listener
          window.removeEventListener('message', handlePaymentResponse);
        };

        window.addEventListener('message', handlePaymentResponse);

        // Poll to detect when the popup is closed
        const pollPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(pollPopup);
          }
        }, 500);
      } else {
        popup.close();
        setBkashPaymentResponse(null);
        alert(paymentData?.message || 'Payment initiation failed.');
      }
    } catch (error) {
      setBkashPaymentResponse(null);
      console.error('Error initiating payment:', error);
    }
  };

  // place order handle function
  const handlePlaceOrder = () => {
    if (!customer_contact) {
      setErrorMessage(t('common:contact-number-required'));
      return;
    }
    if (!payment_gateway || setBkashPaymentResponse === null) {
      setErrorMessage(t('common:text-gateway-required'));
      return;
    }

    const input = {
      products: available_items?.map((item) => ({
        product_id: item.id,
        order_quantity: item.quantity,
      })),
      amount: subtotal,
      coupon_id: coupon?.id,
      discount,
      paid_total: total,
      sales_tax: verified_response?.total_tax,
      delivery_fee: verified_response?.shipping_charge,
      total,
      delivery_time: delivery_time?.title,
      customer_contact,
      customer_name,
      customer_email,
      note,
      use_wallet_points,
      payment_gateway:
        payment_gateway ?? (bkashPaymentResponse ? 'BKASH' : null),
      billing_address: billing_address?.address,
      shipping_address: shipping_address?.address,
    };

    delete input.billing_address.__typename;
    delete input.shipping_address.__typename;
    console.log(input);
    if (input.payment_gateway === 'BKASH') {
      initiateBkashPayment();
    } else if (input.payment_gateway === 'CASH_ON_DELIVERY') {
      createOrder(input);
    }
  };

  // Ensure all required fields are selected
  const isAllRequiredFieldSelected = [
    customer_contact,
    billing_address,
    shipping_address,
    delivery_time,
    available_items,
  ].every((item) => !isEmpty(item));

  return (
    <div className="px-6">
      <Button
        loading={isLoading}
        className="w-full my-5"
        onClick={handlePlaceOrder}
        disabled={!isAllRequiredFieldSelected}
        {...props}
      >
        {payment_gateway === PaymentGateway.COD
          ? t('common:button-place-order')
          : t('common:button-pay-with-bkash')}
      </Button>

      {errorMessage && (
        <div className="my-3">
          <ValidationError message={errorMessage} />
        </div>
      )}
    </div>
  );
};
