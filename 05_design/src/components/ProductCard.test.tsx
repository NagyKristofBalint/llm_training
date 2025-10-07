import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

describe('ProductCard Component', () => {
  const mockProduct: Product = {
    id: 1,
    name: 'Test Laptop',
    price: 999.99,
    description: 'A high-performance laptop for developers',
    stock: 10,
  };
  
  const mockHandlers = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddToCart: vi.fn(),
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render product name', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    expect(screen.getByText('Test Laptop')).toBeInTheDocument();
  });
  
  it('should render product price with two decimal places', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    expect(screen.getByText('$999.99')).toBeInTheDocument();
  });
  
  it('should render product stock', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    expect(screen.getByText('Stock: 10')).toBeInTheDocument();
  });
  
  it('should render product description', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    expect(screen.getByText('A high-performance laptop for developers')).toBeInTheDocument();
  });
  
  it('should show default message when no description', () => {
    const productWithoutDescription: Product = {
      ...mockProduct,
      description: undefined,
    };
    
    render(<ProductCard product={productWithoutDescription} {...mockHandlers} />);
    
    expect(screen.getByText('No description available')).toBeInTheDocument();
  });
  
  it('should call onView when View button is clicked', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);
    
    expect(mockHandlers.onView).toHaveBeenCalledWith(mockProduct);
    expect(mockHandlers.onView).toHaveBeenCalledTimes(1);
  });
  
  it('should call onEdit when Edit button is clicked', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockProduct);
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });
  
  it('should call onDelete when Delete button is clicked', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.className.includes('btn-danger'));
    fireEvent.click(deleteButton!);
    
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockProduct);
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });
  
  it('should call onAddToCart when Add to Cart button is clicked', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    const addButton = screen.getAllByRole('button').find(btn =>
      btn.className.includes('btn-add-to-cart')
    );
    fireEvent.click(addButton!);
    
    expect(mockHandlers.onAddToCart).toHaveBeenCalledWith(mockProduct);
    expect(mockHandlers.onAddToCart).toHaveBeenCalledTimes(1);
  });
  
  it('should render all action buttons', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4); // Add to cart, View, Edit, Delete
  });
  
  it('should format prices correctly for whole numbers', () => {
    const productWithWholePrice: Product = {
      ...mockProduct,
      price: 100,
    };
    
    render(<ProductCard product={productWithWholePrice} {...mockHandlers} />);
    
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
  
  it('should handle zero stock', () => {
    const outOfStockProduct: Product = {
      ...mockProduct,
      stock: 0,
    };
    
    render(<ProductCard product={outOfStockProduct} {...mockHandlers} />);
    
    expect(screen.getByText('Stock: 0')).toBeInTheDocument();
  });
  
  it('should handle large stock numbers', () => {
    const highStockProduct: Product = {
      ...mockProduct,
      stock: 9999,
    };
    
    render(<ProductCard product={highStockProduct} {...mockHandlers} />);
    
    expect(screen.getByText('Stock: 9999')).toBeInTheDocument();
  });
});