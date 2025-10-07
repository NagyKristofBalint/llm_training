import type { Product } from '../types';

interface DeleteConfirmationProps {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmation({ product, onConfirm, onCancel, isLoading = false }: DeleteConfirmationProps) {
  const shortenedName = product.name.length > 50 ? product.name.slice(0, 47) + '...' : product.name;
  return (
    <div className="delete-confirmation">
      <h2 className="delete-title">Delete Product</h2>
      
      <p className="delete-message">
        Are you sure you want to delete "{shortenedName}"?
      </p>
      <p className="delete-message">
        This action cannot be undone.
      </p>
      
      <div className="delete-actions">
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          type="button" 
          className="btn btn-danger" 
          onClick={onConfirm}
          disabled={isLoading}
        >
          Delete Product
        </button>
      </div>
    </div>
  );
}