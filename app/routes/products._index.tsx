import {
  json,
  type LoaderFunctionArgs,
  MetaFunction,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import type {FasttifyProduct, ProductImage} from 'types/products';

export async function loader({context}: LoaderFunctionArgs) {
  // Llama al cliente Fasttify pasando el storeId
  const products: FasttifyProduct[] =
    await context.fasttify.fetchProducts('6c13a0d');
  return json({products});
}

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Products'}];
};

export default function Products() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Productos de Fasttify</h1>
      <ul>
        {products.map((product: FasttifyProduct) => {
          const images: ProductImage[] =
            typeof product.images === 'string'
              ? (JSON.parse(product.images) as ProductImage[])
              : product.images;

          return (
            <li key={product.id}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p>
                Precio: {product.price} - Precio anterior:{' '}
                {product.compareAtPrice}
              </p>
              {images && images.length > 0 && (
                <img
                  src={images[0].url}
                  alt={images[0].alt || product.name}
                  style={{maxWidth: '200px'}}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
