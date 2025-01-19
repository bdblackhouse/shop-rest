import Link from '@components/ui/link';
import { getLayout } from '@components/layout/layout';
import AccountLayout from '@components/my-account/account-layout';
import { ROUTES } from '@lib/routes';
import { useTranslation } from 'next-i18next';
import { useUser } from '@framework/auth';
import Spinner from '@components/ui/loaders/spinner/spinner';
import axios from 'axios';
import { useEffect, useState } from 'react';

export { getStaticProps } from '@framework/common.ssr';

export default function AccountPage() {
  const { t } = useTranslation('common');
  const { me, loading } = useUser();
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [coupons, setCoupons] = useState([]);
  console.log(me);

  useEffect(() => {
    setLoadingCoupons(true);
    axios
      .get(
        process.env.NEXT_PUBLIC_REST_API_ENDPOINT +
          ROUTES.AP_COUPONS +
          '/' +
          me.id,
      )
      .then((response) => {
        console.log(response.data.coupons);
        setCoupons(response.data.coupons);
      })
      .catch((error) => {
        console.error('Failed to fetch coupons:', error);
      })
      .finally(() => setLoadingCoupons(false));
  }, [me.id]);

  if (loading || loadingCoupons) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner showText={false} />
      </div>
    );
  }

  return (
    <AccountLayout>
      <h2 className="text-lg md:text-xl xl:text-2xl font-bold text-heading mb-3 xl:mb-5">
        {t('Coupons list')}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider"
              >
                Code
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider"
              >
                Expire At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon: any) => (
              <tr key={coupon?.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {coupon?.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {coupon?.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {coupon?.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(coupon?.expire_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AccountLayout>
  );
}

AccountPage.authenticate = true;
AccountPage.getLayout = getLayout;
