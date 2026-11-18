export type Category = {
  id: string;
  name: string;
  icon?: string;
  order?: number;
  createdAt?: number;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  originalPrice?: number | null;
  image?: string;
  images?: string[];
  colorImages?: { color: string; images: string[] }[];
  colors?: string[];
  craftDays?: string;
  shortDesc: string;
  fullDesc?: string;
  inStock?: boolean;
  featured?: boolean;
  isPublished?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

export type ProductDraft = Omit<Product, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: number;
};
