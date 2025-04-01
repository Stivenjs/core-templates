import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import type {FasttifyProduct, ProductImage} from 'types/products';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  // Obtenemos productos desde Fasttify en lugar de Shopify
  const fasttifyProducts = context.fasttify
    .fetchProducts('6c13a0d')
    .catch((error) => {
      console.error('Error fetching Fasttify products:', error);
      return null;
    });

  return {
    fasttifyProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedFasttifyProducts products={data.fasttifyProducts} />
    </div>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

function RecommendedFasttifyProducts({
  products,
}: {
  products: Promise<FasttifyProduct[] | null>;
}) {
  return (
    <div className="recommended-products">
      <h2>Productos Recomendados</h2>
      <Suspense fallback={<div>Cargando productos...</div>}>
        <Await resolve={products}>
          {(fasttifyProducts) => {
            if (!fasttifyProducts || !Array.isArray(fasttifyProducts)) {
              return <div>No se encontraron productos</div>;
            }

            return (
              <div className="recommended-products-grid">
                {fasttifyProducts.map((product) => {
                  const images: ProductImage[] =
                    typeof product.images === 'string'
                      ? (JSON.parse(product.images) as ProductImage[])
                      : product.images;

                  return (
                    <Link
                      key={product.id}
                      className="recommended-product"
                      to={`/products/${product.id}`}
                    >
                      {images && images.length > 0 && (
                        <Image
                          data={{
                            url: images[0].url,
                            altText: images[0].alt || product.name,
                            width: 500,
                            height: 500,
                            id: `img-${product.id}`,
                          }}
                          aspectRatio="1/1"
                          sizes="(min-width: 45em) 20vw, 50vw"
                        />
                      )}
                      <h4>{product.name}</h4>
                      <small>
                        <Money
                          data={{
                            amount: product.price.toString(),
                            currencyCode: 'COP',
                          }}
                        />
                      </small>
                    </Link>
                  );
                })}
              </div>
            );
          }}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
