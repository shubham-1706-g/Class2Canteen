import sqlite3
import hashlib
from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta

# ==============================================================================
# --- Pydantic Models for Data Validation ---
# ==============================================================================

class User(BaseModel):
    id: int
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    shop_id: Optional[int] = None
    class Config: from_attributes = True

# NEW: Model for student signup
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None

class Shop(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class Category(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class Product(BaseModel):
    id: int
    name: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: int
    shop_id: int
    class Config: from_attributes = True

class ProductCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: int
    shop_id: int

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class OrderItemCreate(BaseModel):
    id: int # product_id
    quantity: int

class OrderCreate(BaseModel):
    user_id: int
    shop_id: int
    total_price: float
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: str

class DashboardStats(BaseModel):
    total_orders_today: int
    total_revenue_today: float
    recent_orders: List[dict]

class OrderSummary(BaseModel):
    pending: List[dict]
    ready: List[dict]
    completed: List[dict]

class ShopUpdate(BaseModel):
    name: str

# ==============================================================================
# --- FastAPI App Initialization & Middleware ---
# ==============================================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# --- Database Setup & Helpers ---
# ==============================================================================

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ==============================================================================
# --- API Endpoints ---
# ==============================================================================

# --- User Authentication Endpoints ---

@app.post("/login", response_model=User)
def login(email: str = Body(...), password: str = Body(...)):
    """Authenticates both students and shop owners."""
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE email = ? AND password = ?', 
        (email, hash_password(password))
    ).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return dict(user)

# NEW: Endpoint for student registration
@app.post("/signup", status_code=201)
def signup(user_data: UserCreate):
    """Creates a new student user."""
    conn = get_db_connection()
    
    # Check if user already exists
    existing_user = conn.execute('SELECT id FROM users WHERE email = ?', (user_data.email,)).fetchone()
    if existing_user:
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    hashed_password = hash_password(user_data.password)
    
    try:
        conn.execute(
            'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            (user_data.email, hashed_password, user_data.first_name, user_data.last_name, 'student')
        )
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        conn.close()
        
    return {"message": "Account created successfully! Please log in."}


@app.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate):
    """Flexibly updates user details. Works for both student and owner profiles."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if not cursor.execute('SELECT 1 FROM users WHERE id = ?', (user_id,)).fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    if not update_data:
        conn.close()
        # If no data, just return the current user state
        current_user = cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        return dict(current_user)

    set_clause = ", ".join([f"{key} = ?" for key in update_data.keys()])
    params = list(update_data.values()) + [user_id]
    
    cursor.execute(f'UPDATE users SET {set_clause} WHERE id = ?', tuple(params))
    conn.commit()
    
    updated_user = cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return dict(updated_user)

# --- Other Endpoints (Unchanged) ---

@app.get("/shops", response_model=List[Shop])
def get_shops():
    conn = get_db_connection()
    shops = conn.execute('SELECT * FROM shops').fetchall()
    conn.close()
    return [dict(row) for row in shops]

@app.put("/shops/{shop_id}", response_model=Shop)
def update_shop(shop_id: int, shop_update: ShopUpdate):
    conn = get_db_connection()
    existing_shop = conn.execute('SELECT 1 FROM shops WHERE id = ?', (shop_id,)).fetchone()
    if not existing_shop:
        conn.close()
        raise HTTPException(status_code=404, detail="Shop not found")
    try:
        conn.execute('UPDATE shops SET name = ? WHERE id = ?', (shop_update.name, shop_id))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="A shop with this name already exists.")
    updated_shop = conn.execute('SELECT * FROM shops WHERE id = ?', (shop_id,)).fetchone()
    conn.close()
    return dict(updated_shop)

@app.get("/categories", response_model=List[Category])
def get_categories():
    conn = get_db_connection()
    categories = conn.execute('SELECT * FROM categories').fetchall()
    conn.close()
    return [dict(row) for row in categories]

@app.get("/products", response_model=List[Product])
def get_all_products(shop_id: Optional[int] = Query(None), category_id: Optional[int] = Query(None)):
    conn = get_db_connection()
    query = 'SELECT * FROM products'
    params = []
    conditions = []
    if shop_id:
        conditions.append('shop_id = ?')
        params.append(shop_id)
    if category_id:
        conditions.append('category_id = ?')
        params.append(category_id)
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    products = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in products]

@app.post("/orders", status_code=201)
def create_order(order: OrderCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO orders (user_id, shop_id, total_price, status) VALUES (?, ?, ?, ?)',
            (order.user_id, order.shop_id, order.total_price, 'Pending')
        )
        order_id = cursor.lastrowid
        items_data = []
        for item in order.items:
            product_price = cursor.execute('SELECT price FROM products WHERE id = ?', (item.id,)).fetchone()['price']
            items_data.append((order_id, item.id, item.quantity, product_price))
        
        cursor.executemany(
            'INSERT INTO order_items (order_id, product_id, quantity, price_per_item) VALUES (?, ?, ?, ?)',
            items_data
        )
        conn.commit()
    except (sqlite3.Error, TypeError) as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error creating order: {e}")
    finally:
        conn.close()
    return {"message": "Order created successfully", "order_id": order_id}

@app.get("/orders/user/{user_id}", response_model=List[dict])
def get_user_orders(user_id: int):
    conn = get_db_connection()
    orders_raw = conn.execute('''
        SELECT o.id as order_id, o.total_price, o.status, o.order_date, s.name as shop_name
        FROM orders o JOIN shops s ON o.shop_id = s.id
        WHERE o.user_id = ? ORDER BY o.order_date DESC
    ''', (user_id,)).fetchall()
    
    if not orders_raw:
        conn.close()
        return []

    orders_map = {row['order_id']: dict(row) for row in orders_raw}
    for order in orders_map.values(): order['items'] = []
    
    order_ids = list(orders_map.keys())
    items_raw = conn.execute(f'''
        SELECT oi.order_id, oi.quantity, oi.price_per_item, p.name as product_name, p.image_url
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id IN ({",".join("?"*len(order_ids))})
    ''', tuple(order_ids)).fetchall()
    
    for item in items_raw:
        orders_map[item['order_id']]['items'].append(dict(item))
        
    conn.close()
    return list(orders_map.values())

@app.get("/products/shop/{shop_id}", response_model=List[Product])
def get_products_by_shop(shop_id: int):
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products WHERE shop_id = ?', (shop_id,)).fetchall()
    conn.close()
    return [dict(row) for row in products]

@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    conn = get_db_connection()
    product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    conn.close()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(product)

@app.post("/products", response_model=Product, status_code=201)
def create_product(product: ProductCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO products (name, price, description, image_url, category_id, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
        (product.name, product.price, product.description, product.image_url, product.category_id, product.shop_id)
    )
    new_id = cursor.lastrowid
    conn.commit()
    new_product = conn.execute('SELECT * FROM products WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    return dict(new_product)

@app.put("/products/{product_id}", response_model=Product)
def update_product(product_id: int, product: ProductUpdate):
    conn = get_db_connection()
    update_data = product.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    set_clause = ", ".join([f"{key} = ?" for key in update_data.keys()])
    params = list(update_data.values()) + [product_id]
    
    conn.execute(f'UPDATE products SET {set_clause} WHERE id = ?', tuple(params))
    conn.commit()
    
    updated_product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    conn.close()
    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found after update")
    return dict(updated_product)

@app.get("/dashboard/shop/{shop_id}", response_model=DashboardStats)
def get_dashboard_stats(shop_id: int):
    conn = get_db_connection()
    stats = conn.execute("SELECT COUNT(id) as total_orders, SUM(total_price) as total_revenue FROM orders WHERE shop_id = ? AND DATE(order_date) = DATE('now')", (shop_id,)).fetchone()
    recent_orders_raw = conn.execute("SELECT o.id as order_id, o.total_price, o.status, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.shop_id = ? ORDER BY o.order_date DESC LIMIT 3", (shop_id,)).fetchall()
    
    recent_orders = [dict(row) for row in recent_orders_raw]
    if recent_orders:
        order_ids = [o['order_id'] for o in recent_orders]
        for order in recent_orders: order['items'] = []
        
        items_raw = conn.execute(f"SELECT oi.order_id, oi.quantity, p.name as product_name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id IN ({','.join('?'*len(order_ids))})", tuple(order_ids)).fetchall()
        
        items_map = {oid: [] for oid in order_ids}
        for item in items_raw: items_map[item['order_id']].append(dict(item))
        for order in recent_orders: order['items'] = items_map.get(order['order_id'], [])
    conn.close()
    return {"total_orders_today": stats['total_orders'] or 0, "total_revenue_today": stats['total_revenue'] or 0.0, "recent_orders": recent_orders}

@app.get("/dashboard/shop/{shop_id}/weekly-summary")
def get_weekly_summary(shop_id: int):
    conn = get_db_connection()
    today = datetime.now().date()
    days_summary = {(today - timedelta(days=i)): 0.0 for i in range(7)}
    start_date = today - timedelta(days=6)
    
    query = """
        SELECT DATE(order_date) as order_day, SUM(total_price) as daily_revenue
        FROM orders
        WHERE shop_id = ? AND DATE(order_date) >= ?
        GROUP BY DATE(order_date)
    """
    results = conn.execute(query, (shop_id, start_date)).fetchall()
    conn.close()

    for row in results:
        order_day = datetime.strptime(row['order_day'], '%Y-%m-%d').date()
        if order_day in days_summary:
            days_summary[order_day] = row['daily_revenue']
            
    sorted_days = sorted(days_summary.items())
    today_weekday = today.weekday()
    week_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    final_summary = []
    start_of_week = today - timedelta(days=today_weekday)

    for i in range(7):
        current_day_date = start_of_week + timedelta(days=i)
        final_summary.append({
            "day": week_days[i],
            "earnings": days_summary.get(current_day_date, 0.0),
            "is_today": current_day_date == today
        })
    return final_summary

@app.get("/orders/shop/{shop_id}/summary", response_model=OrderSummary)
def get_order_summary(shop_id: int):
    conn = get_db_connection()
    orders_raw = conn.execute("SELECT o.id as order_id, o.total_price, o.status, o.order_date, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.shop_id = ? AND o.status IN ('Pending', 'Ready') ORDER BY o.order_date DESC", (shop_id,)).fetchall()
    history_raw = conn.execute("SELECT o.id as order_id, o.total_price, o.status, o.order_date, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.shop_id = ? AND o.status NOT IN ('Pending', 'Ready') ORDER BY o.order_date DESC", (shop_id,)).fetchall()
    
    summary = {"pending": [], "ready": [], "completed": [dict(row) for row in history_raw]}
    for row in orders_raw:
        status = row['status'].lower()
        if status in summary: summary[status].append(dict(row))
    
    all_orders = summary['pending'] + summary['ready'] + summary['completed']
    if not all_orders:
        conn.close()
        return summary
    
    orders_map = {order['order_id']: order for order in all_orders}
    for order in orders_map.values(): order['items'] = []
    
    order_ids = list(orders_map.keys())
    items_raw = conn.execute(f"SELECT oi.order_id, oi.quantity, p.name as product_name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id IN ({','.join('?'*len(order_ids))})", tuple(order_ids)).fetchall()
    
    for item in items_raw:
        if item['order_id'] in orders_map:
            orders_map[item['order_id']]['items'].append(dict(item))
            
    conn.close()
    return summary
    
@app.put("/orders/{order_id}/status")
def update_order_status(order_id: int, status_update: OrderStatusUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (status_update.status, order_id))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    conn.close()
    return {"message": "Order status updated", "new_status": status_update.status}

# ==============================================================================
# --- Static Files Mount ---
# ==============================================================================

app.mount("/", StaticFiles(directory="static", html=True), name="static")
