import type { Product } from '../types';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="product-details-modal">
      <h2 className="details-title">Product Details</h2>
      
      <div className="details-content">
        <h3 className="product-name">{product.name}</h3>
        
        <p className="product-description-full">
          {product.description || 'No description available'}
        </p>
        
        <div className="details-separator"></div>
        
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Price:</span>
            <span className="detail-value price">${product.price.toFixed(2)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Stock:</span>
            <span className="detail-value">{product.stock} units</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Product ID:</span>
            <span className="detail-value">{product.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}