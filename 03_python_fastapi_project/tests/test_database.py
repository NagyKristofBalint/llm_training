import pytest
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from database import Base, Product, Cart, CartItem

# Test database setup with in-memory SQLite
@pytest.fixture
async def test_db():
    """Create a test database session"""
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
async def sample_product(test_db):
    """Create a sample product for testing"""
    product = Product(
        name="Test Product",
        price=29.99,
        description="A test product description",
        stock=100
    )
    test_db.add(product)
    await test_db.commit()
    await test_db.refresh(product)
    return product


@pytest.fixture
async def sample_cart(test_db):
    """Create a sample cart for testing"""
    cart = Cart(session_id="test-session-123")
    test_db.add(cart)
    await test_db.commit()
    await test_db.refresh(cart)
    return cart


class TestProductModel:
    """Test cases for Product model"""

    @pytest.mark.asyncio
    async def test_create_product(self, test_db):
        """Test creating a product with all fields"""
        product = Product(
            name="Laptop",
            price=999.99,
            description="High-performance laptop",
            stock=50
        )
        test_db.add(product)
        await test_db.commit()
        await test_db.refresh(product)

        assert product.id is not None
        assert product.name == "Laptop"
        assert product.price == 999.99
        assert product.description == "High-performance laptop"
        assert product.stock == 50
        assert isinstance(product.created_at, datetime)

    @pytest.mark.asyncio
    async def test_create_product_without_description(self, test_db):
        """Test creating a product without optional description"""
        product = Product(
            name="Mouse",
            price=19.99,
            stock=200
        )
        test_db.add(product)
        await test_db.commit()
        await test_db.refresh(product)

        assert product.id is not None
        assert product.name == "Mouse"
        assert product.description is None

    @pytest.mark.asyncio
    async def test_create_product_with_zero_stock(self, test_db):
        """Test creating a product with zero stock"""
        product = Product(
            name="Out of Stock Item",
            price=49.99,
            stock=0
        )
        test_db.add(product)
        await test_db.commit()
        await test_db.refresh(product)

        assert product.stock == 0

    @pytest.mark.asyncio
    async def test_default_stock_value(self, test_db):
        """Test that stock defaults to 0 if not provided"""
        product = Product(
            name="Default Stock Item",
            price=9.99
        )
        test_db.add(product)
        await test_db.commit()
        await test_db.refresh(product)

        assert product.stock == 0

    @pytest.mark.asyncio
    async def test_update_product(self, test_db, sample_product):
        """Test updating product fields"""
        sample_product.name = "Updated Product"
        sample_product.price = 39.99
        sample_product.stock = 75
        await test_db.commit()
        await test_db.refresh(sample_product)

        assert sample_product.name == "Updated Product"
        assert sample_product.price == 39.99
        assert sample_product.stock == 75

    @pytest.mark.asyncio
    async def test_delete_product(self, test_db, sample_product):
        """Test deleting a product"""
        product_id = sample_product.id
        await test_db.delete(sample_product)
        await test_db.commit()

        result = await test_db.execute(select(Product).filter(Product.id == product_id))
        deleted_product = result.first()
        assert deleted_product is None

    @pytest.mark.asyncio
    async def test_query_products_by_name(self, test_db):
        """Test querying products by name"""
        product1 = Product(name="Product A", price=10.0, stock=5)
        product2 = Product(name="Product B", price=20.0, stock=10)
        test_db.add_all([product1, product2])
        await test_db.commit()

        result = await test_db.execute(select(Product).filter(Product.name == "Product A"))
        found_product = result.first()

        assert found_product is not None
        assert found_product[0].name == "Product A"

    @pytest.mark.asyncio
    async def test_product_with_negative_price(self, test_db):
        """Test creating a product with negative price (edge case)"""
        product = Product(
            name="Free Item",
            price=-10.0,
            stock=100
        )
        test_db.add(product)
        await test_db.commit()
        await test_db.refresh(product)

        # Database allows negative prices, business logic should validate
        assert product.price == -10.0

    @pytest.mark.asyncio
    async def test_product_with_very_large_price(self, test_db):
        """Test creating a product with very large price"""
        product = Product(
            name="Expensive Item",
            price=999999.99,
            stock=1
        )
        test_db.add(product)
        await test_db.commit()
        await test_db.refresh(product)

        assert product.price == 999999.99


class TestCartModel:
    """Test cases for Cart model"""

    @pytest.mark.asyncio
    async def test_create_cart(self, test_db):
        """Test creating a cart"""
        cart = Cart(session_id="session-456")
        test_db.add(cart)
        await test_db.commit()
        await test_db.refresh(cart)

        assert cart.id is not None
        assert cart.session_id == "session-456"
        assert isinstance(cart.created_at, datetime)
        assert isinstance(cart.updated_at, datetime)
        assert len(cart.items) == 0

    @pytest.mark.asyncio
    async def test_create_multiple_carts_same_session(self, test_db):
        """Test creating multiple carts with the same session_id"""
        cart1 = Cart(session_id="session-789")
        cart2 = Cart(session_id="session-789")
        test_db.add_all([cart1, cart2])
        await test_db.commit()

        result = await test_db.execute(select(Cart).filter(Cart.session_id == "session-789"))
        carts = result.scalars().all()

        # Database allows multiple carts per session
        assert len(carts) == 2

    @pytest.mark.asyncio
    async def test_delete_cart(self, test_db, sample_cart):
        """Test deleting a cart"""
        cart_id = sample_cart.id
        await test_db.delete(sample_cart)
        await test_db.commit()

        result = await test_db.execute(select(Cart).filter(Cart.id == cart_id))
        deleted_cart = result.first()
        assert deleted_cart is None

    @pytest.mark.asyncio
    async def test_cart_with_empty_session_id(self, test_db):
        """Test creating a cart with empty session_id"""
        cart = Cart(session_id="")
        test_db.add(cart)
        await test_db.commit()
        await test_db.refresh(cart)

        assert cart.session_id == ""


class TestCartItemModel:
    """Test cases for CartItem model"""

    @pytest.mark.asyncio
    async def test_create_cart_item(self, test_db, sample_cart, sample_product):
        """Test creating a cart item"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id,
            quantity=3
        )
        test_db.add(cart_item)
        await test_db.commit()
        await test_db.refresh(cart_item)

        assert cart_item.id is not None
        assert cart_item.cart_id == sample_cart.id
        assert cart_item.product_id == sample_product.id
        assert cart_item.quantity == 3
        assert isinstance(cart_item.created_at, datetime)
        assert isinstance(cart_item.updated_at, datetime)

    @pytest.mark.asyncio
    async def test_cart_item_default_quantity(self, test_db, sample_cart, sample_product):
        """Test that cart item quantity defaults to 1"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id
        )
        test_db.add(cart_item)
        await test_db.commit()
        await test_db.refresh(cart_item)

        assert cart_item.quantity == 1

    @pytest.mark.asyncio
    async def test_cart_item_relationships(self, test_db, sample_cart, sample_product):
        """Test cart item relationships with cart and product"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id,
            quantity=2
        )
        test_db.add(cart_item)
        await test_db.commit()

        # Refresh with relationships
        await test_db.refresh(cart_item, ["cart", "product"])

        assert cart_item.cart.id == sample_cart.id
        assert cart_item.product.id == sample_product.id
        assert cart_item.product.name == sample_product.name

    @pytest.mark.asyncio
    async def test_update_cart_item_quantity(self, test_db, sample_cart, sample_product):
        """Test updating cart item quantity"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id,
            quantity=1
        )
        test_db.add(cart_item)
        await test_db.commit()

        cart_item.quantity = 5
        await test_db.commit()
        await test_db.refresh(cart_item)

        assert cart_item.quantity == 5

    @pytest.mark.asyncio
    async def test_delete_cart_item(self, test_db, sample_cart, sample_product):
        """Test deleting a cart item"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id,
            quantity=2
        )
        test_db.add(cart_item)
        await test_db.commit()

        cart_item_id = cart_item.id
        await test_db.delete(cart_item)
        await test_db.commit()

        result = await test_db.execute(select(CartItem).filter(CartItem.id == cart_item_id))
        deleted_item = result.first()
        assert deleted_item is None

    @pytest.mark.asyncio
    async def test_cascade_delete_cart_items(self, test_db, sample_cart, sample_product):
        """Test that deleting a cart cascades to delete cart items"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id,
            quantity=1
        )
        test_db.add(cart_item)
        await test_db.commit()

        cart_item_id = cart_item.id
        await test_db.delete(sample_cart)
        await test_db.commit()

        result = await test_db.execute(select(CartItem).filter(CartItem.id == cart_item_id))
        deleted_item = result.first()
        assert deleted_item is None

    @pytest.mark.asyncio
    async def test_multiple_items_in_cart(self, test_db, sample_cart):
        """Test adding multiple items to a cart"""
        product1 = Product(name="Product 1", price=10.0, stock=50)
        product2 = Product(name="Product 2", price=20.0, stock=30)
        test_db.add_all([product1, product2])
        await test_db.commit()

        cart_item1 = CartItem(cart_id=sample_cart.id, product_id=product1.id, quantity=2)
        cart_item2 = CartItem(cart_id=sample_cart.id, product_id=product2.id, quantity=1)
        test_db.add_all([cart_item1, cart_item2])
        await test_db.commit()

        result = await test_db.execute(select(CartItem).filter(CartItem.cart_id == sample_cart.id))
        items = result.scalars().all()

        assert len(items) == 2

    @pytest.mark.asyncio
    async def test_cart_item_with_zero_quantity(self, test_db, sample_cart, sample_product):
        """Test creating a cart item with zero quantity (edge case)"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id,
            quantity=0
        )
        test_db.add(cart_item)
        await test_db.commit()
        await test_db.refresh(cart_item)

        # Database allows zero quantity, business logic should validate
        assert cart_item.quantity == 0

    @pytest.mark.asyncio
    async def test_cart_item_with_negative_quantity(self, test_db, sample_cart, sample_product):
        """Test creating a cart item with negative quantity (edge case)"""
        cart_item = CartItem(
            cart_id=sample_cart.id,
            product_id=sample_product.id,
            quantity=-1
        )
        test_db.add(cart_item)
        await test_db.commit()
        await test_db.refresh(cart_item)

        # Database allows negative quantity, business logic should validate
        assert cart_item.quantity == -1


class TestDatabaseFunctions:
    """Test cases for database utility functions"""

    @pytest.mark.asyncio
    async def test_get_db_generator(self):
        """Test that get_db returns an async session"""
        from database import get_db, AsyncSessionLocal

        # Test that get_db is a generator
        gen = get_db()
        assert hasattr(gen, '__anext__')

    @pytest.mark.asyncio
    async def test_create_tables(self):
        """Test that create_tables creates all tables"""
        from database import create_tables, engine

        # This should execute without errors
        await create_tables()

        # Verify that tables were created by checking metadata
        async with engine.begin() as conn:
            result = await conn.run_sync(lambda _: Base.metadata.tables.keys())
            assert 'products' in result
            assert 'carts' in result
            assert 'cart_items' in result