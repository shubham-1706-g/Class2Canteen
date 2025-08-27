import sqlite3
import os
import hashlib

# --- Configuration ---
DATABASE_FILE = 'database.db'

# --- Helper Functions ---
def hash_password(password):
    """Hashes a password for storing."""
    return hashlib.sha256(password.encode()).hexdigest()

# --- Main Functions ---
def create_connection():
    """Create a database connection to the SQLite database."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        return conn
    except sqlite3.Error as e:
        print(e)
    return None

def create_tables(conn):
    """Create the database tables."""
    try:
        cursor = conn.cursor()
        
        # User table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                shop_id INTEGER,
                FOREIGN KEY (shop_id) REFERENCES shops(id)
            )
        ''')
        
        # Master table for categories
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        ''')
        # Master table for shops
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        ''')
        # Master table for products
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT,
                image_url TEXT,
                category_id INTEGER,
                shop_id INTEGER,
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (shop_id) REFERENCES shops (id)
            )
        ''')
        
        # Orders table - Represents a single checkout event
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                shop_id INTEGER NOT NULL,
                total_price REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (shop_id) REFERENCES shops (id)
            )
        ''')

        # Order items table - Links products to an order
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price_per_item REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        ''')

        conn.commit()
        print("Tables created successfully.")
    except sqlite3.Error as e:
        print(f"Error creating tables: {e}")

def seed_data(conn):
    """Seed the database with initial sample data."""
    try:
        cursor = conn.cursor()

        # --- Sample Data ---
        shops = ['Canteen 1', 'Canteen 2', 'Cafe Corner']
        cursor.executemany('INSERT OR IGNORE INTO shops (name) VALUES (?)', [(shop,) for shop in shops])
        
        users = [
            ('student@example.com', hash_password('student123'), 'student', 'Janny', 'Doe', None),
            ('owner@example.com', hash_password('owner123'), 'owner', 'Sophia', 'Clark', 1)
        ]
        
        # Updated Categories for a more realistic scenario
        categories = ['South Indian', 'Hot Drinks', 'Sandwiches', 'Chinese', 'Desserts', 'Salads']
        cursor.executemany('INSERT OR IGNORE INTO categories (name) VALUES (?)', [(cat,) for cat in categories])
        
        # Products with updated category IDs to match the new list
        # Canteen 1 (Shop ID 1)
        # Categories: 1:South Indian, 2:Hot Drinks, 3:Sandwiches, 4:Chinese, 5:Desserts, 6:Salads
        products = [
            # Canteen 1
            ('Masala Dosa', 5.50, 'Classic South Indian crepe with a spiced potato filling.', '/images/veggie-burger.jpg', 1, 1),
            ('Idli Sambar', 8.00, 'Steamed rice cakes served with lentil-based vegetable stew.', '/images/pasta.jpg', 1, 1),
            ('Chicken Caesar Salad', 7.25, 'Grilled chicken, romaine lettuce, croutons, and Caesar dressing.', '/images/salad.jpg', 6, 1),
            # Canteen 2
            ('Veg Hakka Noodles', 6.75, 'A popular Indo-Chinese dish of stir-fried noodles.', '/images/stir-fry.jpg', 4, 2),
            ('Paneer Chilli', 9.50, 'Fried paneer cubes tossed in a spicy, sweet, and sour sauce.', '/images/salmon.jpg', 4, 2),
            ('Chicken Sandwich', 6.00, 'Classic chicken sandwich with lettuce, tomato, and mayo.', '/images/sandwich.jpg', 3, 2),
            # Cafe Corner
            ('Espresso', 2.50, 'A strong shot of coffee.', '/images/espresso.jpg', 2, 3),
            ('Iced Coffee', 3.50, 'Chilled coffee served over ice.', '/images/iced-coffee.jpg', 2, 3),
            ('Chocolate Cake', 4.00, 'A rich and decadent slice of chocolate cake.', '/images/cake.jpg', 5, 3)
        ]

        # --- Insert Data ---
        cursor.executemany('INSERT OR IGNORE INTO users (email, password, role, first_name, last_name, shop_id) VALUES (?, ?, ?, ?, ?, ?)', users)
        cursor.executemany('INSERT OR IGNORE INTO products (name, price, description, image_url, category_id, shop_id) VALUES (?, ?, ?, ?, ?, ?)', products)

        conn.commit()
        print("Database seeded successfully.")
    except sqlite3.Error as e:
        print(f"Error seeding data: {e}")


def main():
    """Main function to set up the database."""
    if os.path.exists(DATABASE_FILE):
        os.remove(DATABASE_FILE)
        print(f"Removed existing database file: {DATABASE_FILE}")
        
    conn = create_connection()
    if conn is not None:
        create_tables(conn)
        seed_data(conn)
        conn.close()
        print("Database setup complete.")
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()