import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { Modal } from './components/Modal';
import { ProductForm } from './components/ProductForm';
import { ProductEditForm } from './components/ProductEditForm';
import { ProductDetails } from './components/ProductDetails';
import { DeleteConfirmation } from './components/DeleteConfirmation';
import { Cart } from './components/Cart';
import { apiService } from './services/api';
import type { Product, ProductCreate, ProductUpdate, Cart as CartType } from './types';
import './App.css';

type ModalType = 'add' | 'edit' | 'view' | 'delete' | null;

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartType | null>(null);
  const [sessionId] = useState(() => {
    // Generate a session ID for guest users
    return localStorage.getItem('sessionId') || (() => {
      const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('sessionId', id);
      return id;
    })();
  });

  // Load products and cart on component mount
  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await apiService.getCart(sessionId);
      setCart(cartData);
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  };

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchTerm]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products. Please make sure the server is running.');
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (productData: ProductCreate) => {
    try {
      setIsLoading(true);
      const newProduct = await apiService.createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      setModalType(null);
    } catch (err) {
      setError('Failed to add product.');
      console.error('Error adding product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (productData: ProductUpdate) => {
    if (!selectedProduct) return;
    
    try {
      setIsLoading(true);
      const updatedProduct = await apiService.updateProduct(selectedProduct.id, productData);
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      setModalType(null);
      setSelectedProduct(null);
    } catch (err) {
      setError('Failed to update product.');
      console.error('Error updating product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      setIsLoading(true);
      await apiService.deleteProduct(selectedProduct.id);
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setModalType(null);
      setSelectedProduct(null);
    } catch (err) {
      setError('Failed to delete product.');
      console.error('Error deleting product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (type: ModalType, product?: Product) => {
    setModalType(type);
    setSelectedProduct(product || null);
    setError(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedProduct(null);
    setError(null);
  };

  // Cart functionality
  const addToCart = async (product: Product) => {
    try {
      await apiService.addToCart(sessionId, { product_id: product.id, quantity: 1 });
      await loadCart(); // Reload cart after adding item
    } catch (err) {
      setError('Failed to add item to cart.');
      console.error('Error adding to cart:', err);
    }
  };

  const updateCartItemQuantity = async (itemId: number, quantity: number) => {
    try {
      await apiService.updateCartItem(sessionId, itemId, { quantity });
      await loadCart(); // Reload cart after updating
    } catch (err) {
      setError('Failed to update cart item.');
      console.error('Error updating cart item:', err);
    }
  };

  const removeCartItem = async (itemId: number) => {
    try {
      await apiService.removeFromCart(sessionId, itemId);
      await loadCart(); // Reload cart after removing item
    } catch (err) {
      setError('Failed to remove item from cart.');
      console.error('Error removing from cart:', err);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="app-title">Product Management</h1>
          
          <div className="header-actions">
            <div className="search-container">
              <Search className="search-icon" size={14} />
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              className="btn btn-primary"
              onClick={() => openModal('add')}
            >
              <Plus size={14} />
              Add Product
            </button>
          </div>
        </header>

        {error && (
          <div className="error">
            {error}
            <button onClick={loadProducts} style={{ marginLeft: '10px' }}>
              Retry
            </button>
          </div>
        )}

        <main>
          {isLoading && filteredProducts.length === 0 ? (
            <div className="loading">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>
                {searchTerm 
                  ? `No products match "${searchTerm}"`
                  : 'Get started by adding your first product'
                }
              </p>
              {!searchTerm && (
                <button 
                  className="btn btn-primary"
                  onClick={() => openModal('add')}
                >
                  <Plus size={14} />
                  Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={() => openModal('view', product)}
                  onEdit={() => openModal('edit', product)}
                  onDelete={() => openModal('delete', product)}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </main>

        {/* Modals */}
        <Modal
          isOpen={modalType === 'add'}
          onClose={closeModal}
        >
          <ProductForm
            onSubmit={handleAddProduct}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        </Modal>

        <Modal
          isOpen={modalType === 'edit'}
          onClose={closeModal}
        >
          {selectedProduct && (
            <ProductEditForm
              product={selectedProduct}
              onSubmit={handleEditProduct}
              onCancel={closeModal}
              isLoading={isLoading}
            />
          )}
        </Modal>

        <Modal
          isOpen={modalType === 'view'}
          onClose={closeModal}
        >
          {selectedProduct && (
            <ProductDetails product={selectedProduct} />
          )}
        </Modal>

        <Modal
          isOpen={modalType === 'delete'}
          onClose={closeModal}
        >
          {selectedProduct && (
            <DeleteConfirmation
              product={selectedProduct}
              onConfirm={handleDeleteProduct}
              onCancel={closeModal}
              isLoading={isLoading}
            />
          )}
        </Modal>

        {/* Shopping Cart */}
        <Cart 
          items={cart?.items || []}
          totalItems={cart?.total_items || 0}
          totalPrice={cart?.total_price || 0}
          onUpdateQuantity={updateCartItemQuantity}
          onRemoveItem={removeCartItem}
        />
      </div>
    </div>
  );
}

export default App;
