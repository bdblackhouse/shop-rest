import Link from '@components/ui/link';
import { getLayout } from '@components/layout/layout';
import AccountLayout from '@components/my-account/account-layout';
import { ROUTES } from '@lib/routes';
import { useTranslation } from 'next-i18next';
import { useUser } from '@framework/auth';
import Spinner from '@components/ui/loaders/spinner/spinner';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Drawer from '@components/ui/drawer';
import Button from '@components/ui/button';
import { useForm } from 'react-hook-form';

export { getStaticProps } from '@framework/common.ssr';

export default function AccountPage() {
  const { t } = useTranslation('common');
  const { me, loading, refetch } = useUser();
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log(me.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (!me?.id) return;
    setLoadingRequests(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}${ROUTES.AP_WITHDRAWALS}/${me.id}`,
      )
      .then((response) => {
        setRequests(response.data.requests);
      })
      .catch((error) => {
        console.error('Failed to fetch requests:', error);
      })
      .finally(() => setLoadingRequests(false));
  }, [me?.id, refetch]);

  const onSubmit = async (data: { amount: string }) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}${ROUTES.AP_WITHDRAWALS}`,
        { amount: data.amount, user_id: me.id },
      );
      if (response.data.success === true) {
        // setRequests((prevRequests) => [...prevRequests, response.data]);
        setIsDrawerOpen(false);
        reset();
        refetch();
      }
    } catch (error) {
      console.error('Failed to submit withdrawal request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingRequests) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner showText={false} />
      </div>
    );
  }

  return (
    <AccountLayout>
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center">
        <h2 className="text-lg md:text-xl xl:text-2xl font-bold text-heading mb-3 xl:mb-5">
          {t('Requests list')}
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
          Balance: <strong className="text-base">{me.ap_wallet_balance}</strong>
        </span>
        {me.ap_wallet_balance && (
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => setIsDrawerOpen(true)}
          >
            Withdraw
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length > 0 ? (
              requests.map((request: any) => (
                <tr key={request?.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request?.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="bg-blue-100 text-blue-800 text-sm uppercase font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-blue-400 border border-blue-400">
                      {request?.status}
                    </span>{' '}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request?.created_at
                      ? new Date(request?.created_at).toLocaleDateString()
                      : '---'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="text-center px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  colSpan={4}
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer for Withdrawal Form */}
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Withdraw balance</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <input
                max={me.ap_wallet_balance}
                min={0}
                step="0.01"
                type="number"
                defaultValue={me.ap_wallet_balance}
                placeholder="Enter amount"
                className={`rounded form-input w-full ${
                  errors.amount ? 'border-red-500' : ''
                }`}
                {...register('amount', {
                  required: 'Amount is required',
                  max: {
                    value: me.ap_wallet_balance,
                    message: `Maximum amount is ${me.ap_wallet_balance}`,
                  },
                  min: { value: 1, message: 'Minimum amount is 1' },
                  pattern: {
                    value: /^[0-9]+(\.[0-9]{1,2})?$/,
                    message:
                      'Please enter a valid amount with up to 2 decimal places',
                  },
                })}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Submit
            </Button>
          </form>
        </div>
      </Drawer>
    </AccountLayout>
  );
}

AccountPage.authenticate = true;
AccountPage.getLayout = getLayout;
