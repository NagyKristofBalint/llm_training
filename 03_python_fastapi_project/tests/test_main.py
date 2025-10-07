import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, Product, Cart, CartItem, get_db


# Test database setup
@pytest.fixture
async def test_db():
    """Create a test database"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    AsyncTestSession = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    
    async with AsyncTestSession() as session:
        yield session
    
    await engine.dispose()


@pytest.fixture
async def client(test_db):
    """Create test client with dependency override"""
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def sample_products(test_db):
    """Create sample products for testing"""
    products = [
        Product(name="Laptop", price=999.99, description="High-end laptop", stock=10),
        Product(name="Mouse", price=29.99, description="Wireless mouse", stock=50),
        Product(name="Keyboard", price=79.99, description="Mechanical keyboard", stock=30),
    ]
    test_db.add_all(products)
    await test_db.commit()
    for p in products:
        await test_db.refresh(p)
    return products


class TestRootEndpoint:
    """Test cases for root endpoint"""
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client):
        """Test root endpoint returns welcome message"""
        response = await client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Welcome to FastAPI Template"}


class TestProductEndpoints:
    """Test cases for product CRUD endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_product_success(self, client):
        """Test creating a product successfully"""
        product_data = {
            "name": "Test Product",
            "price": 49.99,
            "description": "A test product",
            "stock": 100
        }
        response = await client.post("/products/", json=product_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["price"] == product_data["price"]
        assert data["description"] == product_data["description"]
        assert data["stock"] == product_data["stock"]
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_create_product_without_description(self, client):
        """Test creating a product without optional description"""
        product_data = {
            "name": "Minimal Product",
            "price": 19.99,
            "stock": 50
        }
        response = await client.post("/products/", json=product_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Minimal Product"
        assert data["description"] is None
    
    @pytest.mark.asyncio
    async def test_create_product_with_zero_stock(self, client):
        """Test creating a product with zero stock"""
        product_data = {
            "name": "Out of Stock",
            "price": 99.99,
            "stock": 0
        }
        response = await client.post("/products/", json=product_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["stock"] == 0
    
    @pytest.mark.asyncio
    async def test_create_product_missing_required_field(self, client):
        """Test creating a product with missing required field"""
        product_data = {
            "name": "Incomplete Product",
            "price": 29.99
            # Missing stock field
        }
        response = await client.post("/products/", json=product_data)
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_get_all_products_empty(self, client):
        """Test getting all products when database is empty"""
        response = await client.get("/products/")
        
        assert response.status_code == 200
        assert response.json() == []
    
    @pytest.mark.asyncio
    async def test_get_all_products(self, client, _sample_products):
        """Test getting all products"""
        response = await client.get("/products/")
        
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 3
        assert products[0]["name"] == "Laptop"
    
    @pytest.mark.asyncio
    async def test_get_product_by_id(self, client, sample_products):
        """Test getting a specific product by ID"""
        product_id = sample_products[0].id
        response = await client.get(f"/products/{product_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id
        assert data["name"] == "Laptop"
    
    @pytest.mark.asyncio
    async def test_get_product_not_found(self, client):
        """Test getting a non-existent product"""
        response = await client.get("/products/99999")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_update_product_full(self, client, sample_products):
        """Test updating all fields of a product"""
        product_id = sample_products[0].id
        update_data = {
            "name": "Updated Laptop",
            "price": 1199.99,
            "description": "Updated description",
            "stock": 15
        }
        response = await client.put(f"/products/{product_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Laptop"
        assert data["price"] == 1199.99
        assert data["description"] == "Updated description"
        assert data["stock"] == 15
    
    @pytest.mark.asyncio
    async def test_update_product_partial(self, client, sample_products):
        """Test partial update of a product"""
        product_id = sample_products[0].id
        original_name = sample_products[0].name
        update_data = {
            "price": 899.99
        }
        response = await client.put(f"/products/{product_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == original_name  # Name unchanged
        assert data["price"] == 899.99  # Price updated
    
    @pytest.mark.asyncio
    async def test_update_product_not_found(self, client):
        """Test updating a non-existent product"""
        update_data = {"price": 100.0}
        response = await client.put("/products/99999", json=update_data)
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_delete_product(self, client, sample_products):
        """Test deleting a product"""
        product_id = sample_products[0].id
        response = await client.delete(f"/products/{product_id}")
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"].lower()
        
        # Verify product is deleted
        get_response = await client.get(f"/products/{product_id}")
        assert get_response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_delete_product_not_found(self, client):
        """Test deleting a non-existent product"""
        response = await client.delete("/products/99999")
        
        assert response.status_code == 404


class TestCartEndpoints:
    """Test cases for cart endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_cart_creates_new_cart(self, client):
        """Test that getting a cart creates it if it doesn't exist"""
        session_id = "test-session-new"
        response = await client.get(f"/cart/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert data["items"] == []
        assert data["total_items"] == 0
        assert data["total_price"] == 0
    
    @pytest.mark.asyncio
    async def test_get_existing_cart(self, client, test_db, sample_products):
        """Test getting an existing cart with items"""
        session_id = "test-session-existing"
        
        # Create cart and add items
        cart = Cart(session_id=session_id)
        test_db.add(cart)
        await test_db.commit()
        await test_db.refresh(cart)
        
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=sample_products[0].id,
            quantity=2
        )
        test_db.add(cart_item)
        await test_db.commit()
        
        response = await client.get(f"/cart/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 2
        assert data["total_items"] == 2
        assert data["total_price"] == sample_products[0].price * 2
    
    @pytest.mark.asyncio
    async def test_add_item_to_cart(self, client, sample_products):
        """Test adding an item to cart"""
        session_id = "test-add-item"
        item_data = {
            "product_id": sample_products[0].id,
            "quantity": 3
        }
        response = await client.post(f"/cart/{session_id}/items", json=item_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "cart_item_id" in data
        
        # Verify cart has the item
        cart_response = await client.get(f"/cart/{session_id}")
        cart_data = cart_response.json()
        assert len(cart_data["items"]) == 1
        assert cart_data["items"][0]["quantity"] == 3
    
    @pytest.mark.asyncio
    async def test_add_item_to_cart_increments_existing(self, client, sample_products):
        """Test that adding same item again increments quantity"""
        session_id = "test-increment"
        item_data = {
            "product_id": sample_products[0].id,
            "quantity": 2
        }
        
        # Add item first time
        await client.post(f"/cart/{session_id}/items", json=item_data)
        
        # Add same item again
        await client.post(f"/cart/{session_id}/items", json=item_data)
        
        # Verify quantity is incremented
        cart_response = await client.get(f"/cart/{session_id}")
        cart_data = cart_response.json()
        assert len(cart_data["items"]) == 1
        assert cart_data["items"][0]["quantity"] == 4  # 2 + 2
    
    @pytest.mark.asyncio
    async def test_add_nonexistent_product_to_cart(self, client):
        """Test adding a non-existent product to cart"""
        session_id = "test-invalid-product"
        item_data = {
            "product_id": 99999,
            "quantity": 1
        }
        response = await client.post(f"/cart/{session_id}/items", json=item_data)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_update_cart_item_quantity(self, client, test_db, sample_products):
        """Test updating cart item quantity"""
        session_id = "test-update-quantity"
        
        # Create cart with item
        cart = Cart(session_id=session_id)
        test_db.add(cart)
        await test_db.commit()
        await test_db.refresh(cart)
        
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=sample_products[0].id,
            quantity=2
        )
        test_db.add(cart_item)
        await test_db.commit()
        await test_db.refresh(cart_item)
        
        # Update quantity
        update_data = {"quantity": 5}
        response = await client.put(
            f"/cart/{session_id}/items/{cart_item.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        
        # Verify update
        cart_response = await client.get(f"/cart/{session_id}")
        cart_data = cart_response.json()
        assert cart_data["items"][0]["quantity"] == 5
    
    @pytest.mark.asyncio
    async def test_update_cart_item_to_zero_removes_item(self, client, test_db, sample_products):
        """Test that updating quantity to 0 removes the item"""
        session_id = "test-remove-via-update"
        
        # Create cart with item
        cart = Cart(session_id=session_id)
        test_db.add(cart)
        await test_db.commit()
        await test_db.refresh(cart)
        
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=sample_products[0].id,
            quantity=2
        )
        test_db.add(cart_item)
        await test_db.commit()
        await test_db.refresh(cart_item)
        
        # Update quantity to 0
        update_data = {"quantity": 0}
        response = await client.put(
            f"/cart/{session_id}/items/{cart_item.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        
        # Verify item is removed
        cart_response = await client.get(f"/cart/{session_id}")
        cart_data = cart_response.json()
        assert len(cart_data["items"]) == 0
    
    @pytest.mark.asyncio
    async def test_update_nonexistent_cart_item(self, client):
        """Test updating a non-existent cart item"""
        session_id = "test-invalid-update"
        update_data = {"quantity": 3}
        response = await client.put(
            f"/cart/{session_id}/items/99999",
            json=update_data
        )
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_remove_item_from_cart(self, client, test_db, sample_products):
        """Test removing an item from cart"""
        session_id = "test-remove-item"
        
        # Create cart with item
        cart = Cart(session_id=session_id)
        test_db.add(cart)
        await test_db.commit()
        await test_db.refresh(cart)
        
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=sample_products[0].id,
            quantity=3
        )
        test_db.add(cart_item)
        await test_db.commit()
        await test_db.refresh(cart_item)
        
        # Remove item
        response = await client.delete(f"/cart/{session_id}/items/{cart_item.id}")
        
        assert response.status_code == 200
        assert "removed" in response.json()["message"].lower()
        
        # Verify item is removed
        cart_response = await client.get(f"/cart/{session_id}")
        cart_data = cart_response.json()
        assert len(cart_data["items"]) == 0
    
    @pytest.mark.asyncio
    async def test_remove_nonexistent_cart_item(self, client):
        """Test removing a non-existent cart item"""
        session_id = "test-invalid-remove"
        response = await client.delete(f"/cart/{session_id}/items/99999")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_cart_total_calculation(self, client, _test_db, sample_products):
        """Test that cart totals are calculated correctly"""
        session_id = "test-totals"
        
        # Add multiple items to cart
        await client.post(f"/cart/{session_id}/items", json={
            "product_id": sample_products[0].id,
            "quantity": 2
        })
        await client.post(f"/cart/{session_id}/items", json={
            "product_id": sample_products[1].id,
            "quantity": 3
        })
        
        # Get cart and verify totals
        response = await client.get(f"/cart/{session_id}")
        cart_data = response.json()
        
        expected_total_items = 2 + 3
        expected_total_price = (sample_products[0].price * 2) + (sample_products[1].price * 3)
        
        assert cart_data["total_items"] == expected_total_items
        assert abs(cart_data["total_price"] - expected_total_price) < 0.01


class TestCORSMiddleware:
    """Test cases for CORS middleware"""
    
    @pytest.mark.asyncio
    async def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses"""
        response = await client.get("/")
        
        # CORS headers should be present
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.mark.asyncio
    async def test_product_with_very_long_name(self, client):
        """Test creating a product with a very long name"""
        long_name = "A" * 1000
        product_data = {
            "name": long_name,
            "price": 29.99,
            "stock": 10
        }
        response = await client.post("/products/", json=product_data)
        
        # Should succeed or handle gracefully
        assert response.status_code in [200, 422]
    
    @pytest.mark.asyncio
    async def test_product_with_empty_name(self, client):
        """Test creating a product with empty name"""
        product_data = {
            "name": "",
            "price": 29.99,
            "stock": 10
        }
        response = await client.post("/products/", json=product_data)
        
        # Empty string is technically valid unless validated
        assert response.status_code in [200, 422]
    
    @pytest.mark.asyncio
    async def test_cart_with_unicode_session_id(self, client):
        """Test cart with unicode characters in session ID"""
        session_id = "session-测试-🛒"
        response = await client.get(f"/cart/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
    
    @pytest.mark.asyncio
    async def test_multiple_concurrent_cart_operations(self, client, sample_products):
        """Test handling multiple cart operations for same session"""
        session_id = "test-concurrent"
        
        # Add items rapidly
        responses = []
        for _i in range(5):
            response = await client.post(f"/cart/{session_id}/items", json={
                "product_id": sample_products[0].id,
                "quantity": 1
            })
            responses.append(response)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
        
        # Final cart should have accumulated quantity
        cart_response = await client.get(f"/cart/{session_id}")
        cart_data = cart_response.json()
        assert cart_data["items"][0]["quantity"] == 5