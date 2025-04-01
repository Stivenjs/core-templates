import {
  createWithCache,
  CacheLong,
} from '@shopify/hydrogen';
import type {FasttifyProduct} from 'types/products';

export interface FasttifyClient {
  fetchProducts: (storeId: string) => Promise<FasttifyProduct[]>;
}

/**
 * Crea un cliente para interactuar con la API de Fasttify
 * @param cache - Caché para almacenar respuestas
 * @param waitUntil - Contexto de ejecución para operaciones asíncronas
 * @param request - Objeto de solicitud HTTP
 * @returns Cliente Fasttify con métodos para obtener productos
 */
export function createFasttifyClient({
  cache,
  waitUntil,
  request,
}: {
  cache: Cache;
  waitUntil: ExecutionContext['waitUntil'];
  request: Request;
}): FasttifyClient {
  const withCache = createWithCache({cache, waitUntil, request});

  /**
   * Obtiene los productos de una tienda específica
   * @param storeId - ID de la tienda
   * @returns Promesa que resuelve a un array de productos
   */
  async function fetchProducts(storeId: string): Promise<FasttifyProduct[]> {
    const endpoint = `https://axklpoqdb7.execute-api.us-east-2.amazonaws.com/dev/get-store-products?storeId=${storeId}`;

    // Realizamos la petición a la API con caché
    const response = await withCache.fetch<{products: any[]; error?: string}>(
      endpoint,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        cacheKey: ['fasttify', 'products', storeId],
        cacheStrategy: CacheLong(),
        shouldCacheResponse: (body: {products: any[]; error?: string}) =>
          !body.error || body.error.length === 0,
      },
    );

    // Convertimos la respuesta a JSON
    const data = response.data as {products: any[]; error?: string};

    // Verificamos si hay productos en la respuesta
    if (!data.products || !Array.isArray(data.products)) {
      console.error('No se encontraron productos o formato inválido:', data);
      return [];
    }

    // Devolvemos los productos tal como vienen de la API sin manipular
    return data.products as FasttifyProduct[];
  }

  return {fetchProducts};
}
