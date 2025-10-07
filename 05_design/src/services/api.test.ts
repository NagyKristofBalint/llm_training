import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from './api';
import type { Product, ProductCreate, ProductUpdate } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getProducts', () => {
    it('should fetch all products', async () => {
      const mockProducts: Product[] = [
        { id: 1, name: 'Product 1', price: 29.99, stock: 10 },
        { id: 2, name: 'Product 2', price: 39.99, stock: 20 },
      ];
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });
      
      const result = await apiService.getProducts();
      
      expect(result).toEqual(mockProducts);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/products/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
    
    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      await expect(apiService.getProducts()).rejects.toThrow('HTTP error\! status: 500');
    });
  });
  
  describe('getProduct', () => {
    it('should fetch a single product by id', async () => {
      const mockProduct: Product = {
        id: 1,
        name: 'Product 1',
        price: 29.99,
        stock: 10,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });
      
      const result = await apiService.getProduct(1);
      
      expect(result).toEqual(mockProduct);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/products/1',
        expect.any(Object)
      );
    });
    
    it('should handle 404 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      
      await expect(apiService.getProduct(999)).rejects.toThrow('HTTP error\! status: 404');
    });
  });
  
  describe('createProduct', () => {
    it('should create a new product', async () => {
      const createData: ProductCreate = {
        name: 'New Product',
        price: 49.99,
        stock: 30,
      };
      
      const mockResponse: Product = {
        id: 3,
        ...createData,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      const result = await apiService.createProduct(createData);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/products/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );
    });
    
    it('should handle validation errors', async () => {
      const createData: ProductCreate = {
        name: '',
        price: -10,
        stock: -5,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
      });
      
      await expect(apiService.createProduct(createData)).rejects.toThrow();
    });
  });
  
  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updateData: ProductUpdate = {
        price: 59.99,
        stock: 50,
      };
      
      const mockResponse: Product = {
        id: 1,
        name: 'Product 1',
        price: 59.99,
        stock: 50,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      const result = await apiService.updateProduct(1, updateData);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/products/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
    
    it('should handle partial updates', async () => {
      const updateData: ProductUpdate = {
        price: 29.99,
      };
      
      const mockResponse: Product = {
        id: 1,
        name: 'Product 1',
        price: 29.99,
        stock: 10,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      const result = await apiService.updateProduct(1, updateData);
      
      expect(result.price).toBe(29.99);
    });
  });
  
  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockResponse = { message: 'Product deleted successfully' };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      const result = await apiService.deleteProduct(1);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/products/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
  
  describe('Cart operations', () => {
    describe('getCart', () => {
      it('should fetch cart for session', async () => {
        const mockCart = {
          id: 1,
          session_id: 'test-session',
          items: [],
          total_items: 0,
          total_price: 0,
        };
        
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        });
        
        const result = await apiService.getCart('test-session');
        
        expect(result).toEqual(mockCart);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/cart/test-session',
          expect.any(Object)
        );
      });
    });
    
    describe('addToCart', () => {
      it('should add item to cart', async () => {
        const mockResponse = {
          message: 'Item added to cart',
          cart_item_id: 1,
        };
        
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });
        
        const result = await apiService.addToCart('test-session', {
          product_id: 1,
          quantity: 2,
        });
        
        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/cart/test-session/items',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ product_id: 1, quantity: 2 }),
          })
        );
      });
    });
    
    describe('updateCartItem', () => {
      it('should update cart item quantity', async () => {
        const mockResponse = { message: 'Cart item updated' };
        
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });
        
        const result = await apiService.updateCartItem('test-session', 1, {
          quantity: 5,
        });
        
        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/cart/test-session/items/1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ quantity: 5 }),
          })
        );
      });
    });
    
    describe('removeFromCart', () => {
      it('should remove item from cart', async () => {
        const mockResponse = { message: 'Item removed from cart' };
        
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });
        
        const result = await apiService.removeFromCart('test-session', 1);
        
        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/cart/test-session/items/1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });
  
  describe('Error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(apiService.getProducts()).rejects.toThrow('Network error');
    });
    
    it('should handle empty responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });
      
      const result = await apiService.getProducts();
      expect(result).toBeNull();
    });
  });
});