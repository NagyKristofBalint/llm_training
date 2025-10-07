import { Eye, Edit, Trash2 } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCard({ product, onView, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="product-card">
      <div className="product-card-header">
        <h4 className="product-title">{product.name}</h4>
      </div>
      
      <div className="product-card-content">
        <p className="product-description">
          {product.description || 'No description available'}
        </p>
        
        <div className="product-details">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <span className="product-stock">Stock: {product.stock}</span>
        </div>
      </div>
      
      <div className="product-card-actions">
        <button 
          className="btn btn-outline"
          onClick={() => onView(product)}
        >
          <Eye size={14} />
          View
        </button>
        
        <button 
          className="btn btn-outline"
          onClick={() => onEdit(product)}
        >
          <Edit size={14} />
          Edit
        </button>
        
        <button 
          className="btn btn-danger"
          onClick={() => onDelete(product)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}