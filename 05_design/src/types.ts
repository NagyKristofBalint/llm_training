export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  stock: number;
}

export interface ProductCreate {
  name: string;
  price: number;
  description?: string;
  stock: number;
}

export interface ProductUpdate {
  name?: string;
  price?: number;
  description?: string;
  stock?: number;
}