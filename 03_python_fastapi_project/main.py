from contextlib import asynccontextmanager
from typing import List, Optional
import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from database import Product, Cart, CartItem, create_tables, get_db

class ProductCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    stock: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    stock: Optional[int] = None


class ProductDTO(BaseModel):
    id: int
    name: str
    price: float
    description: Optional[str] = None
    stock: int

    class Config:
        from_attributes = True


# Cart models
class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemDTO(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductDTO

    class Config:
        from_attributes = True


class CartDTO(BaseModel):
    id: int
    session_id: str
    items: List[CartItemDTO]
    total_items: int
    total_price: float

    class Config:
        from_attributes = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Template"}


# Product endpoints
@app.post("/products/", response_model=ProductDTO)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    db_product = Product(
        name=product.name,
        price=product.price,
        description=product.description,
        stock=product.stock
    )
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product


@app.get("/products/", response_model=List[ProductDTO])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    products = result.scalars().all()
    return products


@app.get("/products/{product_id}", response_model=ProductDTO)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product[0]


@app.put("/products/{product_id}", response_model=ProductDTO)
async def update_product(
    product_id: int, 
    product_update: ProductUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Product).filter(Product.id == product_id))
    db_product = result.first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product = db_product[0]
    
    # Update only provided fields
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    await db.commit()
    await db.refresh(db_product)
    return db_product


@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).filter(Product.id == product_id))
    db_product = result.first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.delete(db_product[0])
    await db.commit()
    return {"message": "Product deleted successfully"}


# Cart endpoints
@app.get("/cart/{session_id}")
async def get_cart(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get or create cart for a session"""
    result = await db.execute(
        select(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .filter(Cart.session_id == session_id)
    )
    cart = result.first()
    
    if not cart:
        # Create new cart if it doesn't exist
        cart = Cart(session_id=session_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
        
        # Reload with relationships
        result = await db.execute(
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .filter(Cart.id == cart.id)
        )
        cart = result.first()[0]
    else:
        cart = cart[0]
    
    # Calculate totals
    total_items = sum(item.quantity for item in cart.items)
    total_price = sum(item.quantity * item.product.price for item in cart.items)
    
    return {
        "id": cart.id,
        "session_id": cart.session_id,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "product": {
                    "id": item.product.id,
                    "name": item.product.name,
                    "price": item.product.price,
                    "description": item.product.description,
                    "stock": item.product.stock
                }
            }
            for item in cart.items
        ],
        "total_items": total_items,
        "total_price": total_price
    }


@app.post("/cart/{session_id}/items")
async def add_to_cart(
    session_id: str, 
    item_data: CartItemCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Add item to cart or update quantity if item exists"""
    # Get or create cart
    result = await db.execute(select(Cart).filter(Cart.session_id == session_id))
    cart = result.first()
    
    if not cart:
        cart = Cart(session_id=session_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
    else:
        cart = cart[0]
    
    # Check if product exists
    result = await db.execute(select(Product).filter(Product.id == item_data.product_id))
    product = result.first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in cart
    result = await db.execute(
        select(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_data.product_id
        )
    )
    existing_item = result.first()
    
    if existing_item:
        # Update existing item quantity
        existing_item[0].quantity += item_data.quantity
        await db.commit()
        cart_item = existing_item[0]
    else:
        # Create new cart item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(cart_item)
        await db.commit()
        await db.refresh(cart_item)
    
    return {"message": "Item added to cart", "cart_item_id": cart_item.id}


@app.put("/cart/{session_id}/items/{item_id}")
async def update_cart_item(
    session_id: str,
    item_id: int,
    item_data: CartItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update cart item quantity"""
    # Get cart
    result = await db.execute(select(Cart).filter(Cart.session_id == session_id))
    cart = result.first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Get cart item
    result = await db.execute(
        select(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart[0].id
        )
    )
    cart_item = result.first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if item_data.quantity <= 0:
        # Remove item if quantity is 0 or negative
        await db.delete(cart_item[0])
    else:
        # Update quantity
        cart_item[0].quantity = item_data.quantity
    
    await db.commit()
    return {"message": "Cart item updated"}


@app.delete("/cart/{session_id}/items/{item_id}")
async def remove_from_cart(
    session_id: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Remove item from cart"""
    # Get cart
    result = await db.execute(select(Cart).filter(Cart.session_id == session_id))
    cart = result.first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Get cart item
    result = await db.execute(
        select(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart[0].id
        )
    )
    cart_item = result.first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    await db.delete(cart_item[0])
    await db.commit()
    return {"message": "Item removed from cart"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
