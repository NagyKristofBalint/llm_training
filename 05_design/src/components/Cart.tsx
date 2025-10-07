import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import type { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
}

export function Cart({ items, totalItems, totalPrice, onUpdateQuantity, onRemoveItem }: CartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleIncrement = (item: CartItem) => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = (item: CartItem) => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else {
      onRemoveItem(item.id);
    }
  };

  return (
    <div className="cart-container">
      <button 
        className="cart-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ShoppingCart size={20} />
        {totalItems > 0 && (
          <span className="cart-badge">{totalItems}</span>
        )}
      </button>

      {isOpen && (
        <div className="cart-panel">
          <div className="cart-header">
            <h3>Shopping Cart</h3>
            <button 
              className="cart-close"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="cart-content">
            {items.length === 0 ? (
              <p className="cart-empty">Your cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {items.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4 className="cart-item-name">{item.product.name}</h4>
                        <p className="cart-item-price">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="cart-item-controls">
                        <button 
                          className="cart-btn cart-btn-decrement"
                          onClick={() => handleDecrement(item)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="cart-item-quantity">{item.quantity}</span>
                        <button 
                          className="cart-btn cart-btn-increment"
                          onClick={() => handleIncrement(item)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="cart-footer">
                  <div className="cart-total">
                    <strong>Total: ${totalPrice.toFixed(2)}</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}