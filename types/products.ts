export type FasttifyProduct = {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  costPerItem: number | null;
  sku: string;
  barcode: string;
  quantity: number;
  category: string;
  images: {alt: string; url: string}[] | string;
  attributes: string;
  status: string;
  slug: string | null;
  featured: string | null;
  tags: string;
  variants: string;
  supplier: string | null;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductImage = {
  alt: string;
  url: string;
};
