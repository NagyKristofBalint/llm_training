import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Cart } from './Cart';
import type { CartItem } from '../types';

describe('Cart Component', () => {
  const mockCartItems: CartItem[] = [
    {
      id: 1,
      product_id: 10,
      quantity: 2,
      product: {
        id: 10,
        name: 'Laptop',
        price: 999.99,
        stock: 10,
      },
    },
    {
      id: 2,
      product_id: 20,
      quantity: 1,
      product: {
        id: 20,
        name: 'Mouse',
        price: 29.99,
        stock: 50,
      },
    },
  ];

  const mockHandlers = {
    onUpdateQuantity: vi.fn(),
    onRemoveItem: vi.fn(),
  };

  it('should render cart toggle button', () => {
    render(
      <Cart
        items={[]}
        totalItems={0}
        totalPrice={0}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  it('should show cart badge with item count', () => {
    render(
      <Cart
        items={mockCartItems}
        totalItems={3}
        totalPrice={2029.97}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
  });

  it('should not show badge when cart is empty', () => {
    render(
      <Cart
        items={[]}
        totalItems={0}
        totalPrice={0}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('should toggle cart panel on button click', () => {
    render(
      <Cart
        items={mockCartItems}
        totalItems={3}
        totalPrice={2029.97}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    const toggleButton = screen.getByRole('button');

    // Panel should be hidden initially
    expect(screen.queryByText('Shopping Cart')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(toggleButton);
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();

    // Click to close
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    expect(screen.queryByText('Shopping Cart')).not.toBeInTheDocument();
  });

  it('should display empty cart message when no items', () => {
    render(
      <Cart
        items={[]}
        totalItems={0}
        totalPrice={0}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    // Open cart
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('should display cart items correctly', () => {
    render(
      <Cart
        items={mockCartItems}
        totalItems={3}
        totalPrice={2029.97}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    // Open cart
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    // Check items are displayed
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Mouse')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should show correct quantities', () => {
    render(
      <Cart
        items={mockCartItems}
        totalItems={3}
        totalPrice={2029.97}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    // Open cart
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    // Check quantities
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should display total price', () => {
    render(
      <Cart
        items={mockCartItems}
        totalItems={3}
        totalPrice={2029.97}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    // Open cart
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    expect(screen.getByText('Total: $2029.97')).toBeInTheDocument();
  });

  it('should call onUpdateQuantity when increment button clicked', () => {
    const mockOnUpdate = vi.fn();
    render(
      <Cart
        items={mockCartItems}
        totalItems={3}
        totalPrice={2029.97}
        onUpdateQuantity={mockOnUpdate}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    // Open cart
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    // Find and click increment button for first item
    const incrementButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('cart-btn-increment')
    );
    fireEvent.click(incrementButtons[0]);

    expect(mockOnUpdate).toHaveBeenCalledWith(1, 3); // item id 1, new quantity 3
  });

  it('should call onUpdateQuantity when decrement button clicked', () => {
    const mockOnUpdate = vi.fn();
    render(
      <Cart
        items={mockCartItems}
        totalItems={3}
        totalPrice={2029.97}
        onUpdateQuantity={mockOnUpdate}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    // Open cart
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    // Find and click decrement button for first item
    const decrementButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('cart-btn-decrement')
    );
    fireEvent.click(decrementButtons[0]);

    expect(mockOnUpdate).toHaveBeenCalledWith(1, 1); // item id 1, new quantity 1
  });

  it('should call onRemoveItem when decrement button clicked on quantity 1', () => {
    const mockOnRemove = vi.fn();
    const singleItemCart: CartItem[] = [
      {
        id: 1,
        product_id: 10,
        quantity: 1,
        product: {
          id: 10,
          name: 'Laptop',
          price: 999.99,
          stock: 10,
        },
      },
    ];

    render(
      <Cart
        items={singleItemCart}
        totalItems={1}
        totalPrice={999.99}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockOnRemove}
      />
    );

    // Open cart
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    // Find and click decrement button
    const decrementButton = screen.getAllByRole('button').find(btn =>
      btn.className.includes('cart-btn-decrement')
    );
    fireEvent.click(decrementButton!);

    expect(mockOnRemove).toHaveBeenCalledWith(1);
  });

  it('should format prices with two decimal places', () => {
    const itemsWithOddPrices: CartItem[] = [
      {
        id: 1,
        product_id: 10,
        quantity: 1,
        product: {
          id: 10,
          name: 'Item',
          price: 9.5,
          stock: 10,
        },
      },
    ];

    render(
      <Cart
        items={itemsWithOddPrices}
        totalItems={1}
        totalPrice={9.5}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemoveItem={mockHandlers.onRemoveItem}
      />
    );

    // Open cart
    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);

    expect(screen.getByText('$9.50')).toBeInTheDocument();
  });
});