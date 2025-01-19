import { NextSeo, ProductJsonLd } from 'next-seo';
import Container from '@components/ui/container';
import { getLayout } from '@components/layout/layout';
import Subscription from '@components/common/subscription';
import ProductSingleDetails from '@components/product/product-single-details';
import Divider from '@components/ui/divider';
import Breadcrumb from '@components/common/breadcrumb';
import { useRouter } from 'next/router';
import Spinner from '@components/ui/loaders/spinner/spinner';
import dynamic from 'next/dynamic';

export { getStaticPaths, getStaticProps } from '@framework/product.ssr';

const RelatedProducts = dynamic(() => import('@containers/related-products'));

export default function ProductPage({ product }: any) {
  const router = useRouter();

  // Fallback handling for SSG
  if (router.isFallback) {
    return <Spinner />;
  }

  // If product data is missing, display an error message
  if (!product) {
    return (
      <Container>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="mt-4">
            Sorry, we couldn't find the product you were looking for.
          </p>
        </div>
      </Container>
    );
  }

  const seoImages = product?.image
    ? Array(product?.image)?.map((img: any) => ({
        url: img.thumbnail,
        width: 800,
        height: 600,
        alt: product?.name,
      }))
    : [];

  // SEO metadata
  const seoTitle = product?.name || 'Product Details';
  const seoDescription =
    product?.description || 'Check out this amazing product!';
  const seoUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product?.slug}`;

  return (
    <>
      {/* Next.js SEO */}
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={seoUrl}
        openGraph={{
          url: seoUrl,
          title: seoTitle,
          description: seoDescription,
          images: seoImages,
        }}
        twitter={{
          cardType: 'summary_large_image',
          site: '@twtacc',
          title: seoTitle,
          description: seoDescription,
          image: seoImages[0]?.url, // Use the first image as the primary Twitter card image
        }}
      />

      {/* Product structured data */}
      <ProductJsonLd
        productName={product?.name}
        description={product?.description}
        brand={product?.brand || 'Default Brand'}
        offers={{
          price: product?.price,
          priceCurrency: 'USD',
          availability: product?.stock ? 'InStock' : 'OutOfStock',
          url: seoUrl,
        }}
        images={seoImages.map((img) => img.url)} // Pass the list of image URLs for structured data
      />

      {/* Main content */}
      <Divider className="mb-0" />
      <Container>
        <div className="pt-8">
          <Breadcrumb />
        </div>
        <ProductSingleDetails product={product} />
        <RelatedProducts
          products={product?.related_products}
          currentProductId={product?.id}
          sectionHeading="text-related-products"
        />
        <Subscription />
      </Container>
    </>
  );
}

ProductPage.getLayout = getLayout;
