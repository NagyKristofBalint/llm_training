import React, { useState, useEffect } from 'react';
import type { Product, ProductUpdate } from '../types';

interface ProductEditFormProps {
  product: Product;
  onSubmit: (data: ProductUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductEditForm({ product, onSubmit, onCancel, isLoading = false }: ProductEditFormProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price,
    description: product.description || '',
    stock: product.stock,
  });

  useEffect(() => {
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description || '',
      stock: product.stock,
    });
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="product-form">
      <h2 className="form-title">Edit Product</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Product Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter product description"
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price ($)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
}