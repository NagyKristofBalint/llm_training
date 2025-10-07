import { describe, it, expect } from 'vitest';
import type { 
  Product, 
  ProductCreate, 
  ProductUpdate, 
  CartItem, 
  Cart,
  CartItemCreate,
  CartItemUpdate 
} from './types';

describe('Type Definitions', () => {
  describe('Product', () => {
    it('should have all required properties', () => {
      const product: Product = {
        id: 1,
        name: 'Test Product',
        price: 29.99,
        stock: 100,
      };
      
      expect(product.id).toBe(1);
      expect(product.name).toBe('Test Product');
      expect(product.price).toBe(29.99);
      expect(product.stock).toBe(100);
    });
    
    it('should allow optional description', () => {
      const productWithDescription: Product = {
        id: 1,
        name: 'Test Product',
        price: 29.99,
        description: 'A test product',
        stock: 100,
      };
      
      const productWithoutDescription: Product = {
        id: 2,
        name: 'Another Product',
        price: 19.99,
        stock: 50,
      };
      
      expect(productWithDescription.description).toBe('A test product');
      expect(productWithoutDescription.description).toBeUndefined();
    });
  });
  
  describe('ProductCreate', () => {
    it('should require name, price, and stock', () => {
      const createData: ProductCreate = {
        name: 'New Product',
        price: 49.99,
        stock: 25,
      };
      
      expect(createData.name).toBe('New Product');
      expect(createData.price).toBe(49.99);
      expect(createData.stock).toBe(25);
    });
    
    it('should allow optional description', () => {
      const createData: ProductCreate = {
        name: 'New Product',
        price: 49.99,
        description: 'Optional description',
        stock: 25,
      };
      
      expect(createData.description).toBe('Optional description');
    });
  });
  
  describe('ProductUpdate', () => {
    it('should allow all fields to be optional', () => {
      const updateData: ProductUpdate = {};
      expect(updateData).toBeDefined();
    });
    
    it('should allow partial updates', () => {
      const priceUpdate: ProductUpdate = { price: 39.99 };
      const stockUpdate: ProductUpdate = { stock: 75 };
      const nameUpdate: ProductUpdate = { name: 'Updated Name' };
      
      expect(priceUpdate.price).toBe(39.99);
      expect(stockUpdate.stock).toBe(75);
      expect(nameUpdate.name).toBe('Updated Name');
    });
  });
  
  describe('CartItem', () => {
    it('should have all required properties', () => {
      const cartItem: CartItem = {
        id: 1,
        product_id: 10,
        quantity: 3,
        product: {
          id: 10,
          name: 'Product',
          price: 29.99,
          stock: 50,
        },
      };
      
      expect(cartItem.id).toBe(1);
      expect(cartItem.product_id).toBe(10);
      expect(cartItem.quantity).toBe(3);
      expect(cartItem.product).toBeDefined();
    });
  });
  
  describe('Cart', () => {
    it('should have all required properties', () => {
      const cart: Cart = {
        id: 1,
        session_id: 'test-session',
        items: [],
        total_items: 0,
        total_price: 0,
      };
      
      expect(cart.id).toBe(1);
      expect(cart.session_id).toBe('test-session');
      expect(cart.items).toEqual([]);
      expect(cart.total_items).toBe(0);
      expect(cart.total_price).toBe(0);
    });
    
    it('should support items with products', () => {
      const cart: Cart = {
        id: 1,
        session_id: 'test-session',
        items: [
          {
            id: 1,
            product_id: 10,
            quantity: 2,
            product: {
              id: 10,
              name: 'Product',
              price: 29.99,
              stock: 50,
            },
          },
        ],
        total_items: 2,
        total_price: 59.98,
      };
      
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.total_items).toBe(2);
      expect(cart.total_price).toBe(59.98);
    });
  });
  
  describe('CartItemCreate', () => {
    it('should have product_id and quantity', () => {
      const createData: CartItemCreate = {
        product_id: 10,
        quantity: 3,
      };
      
      expect(createData.product_id).toBe(10);
      expect(createData.quantity).toBe(3);
    });
  });
  
  describe('CartItemUpdate', () => {
    it('should have quantity', () => {
      const updateData: CartItemUpdate = {
        quantity: 5,
      };
      
      expect(updateData.quantity).toBe(5);
    });
  });
});