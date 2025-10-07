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

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  session_id: string;
  items: CartItem[];
  total_items: number;
  total_price: number;
}

export interface CartItemCreate {
  product_id: number;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}