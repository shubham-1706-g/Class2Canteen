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
    # This function remains the same as before, no changes needed here.
    # It just creates the table structures.
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
            role TEXT NOT NULL, first_name TEXT, last_name TEXT, shop_id INTEGER,
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    cursor.execute('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)')
    cursor.execute('CREATE TABLE IF NOT EXISTS shops (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL,
            description TEXT, image_url TEXT, category_id INTEGER, shop_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories (id), FOREIGN KEY (shop_id) REFERENCES shops (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, shop_id INTEGER NOT NULL,
            total_price REAL NOT NULL, status TEXT NOT NULL DEFAULT 'Pending',
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id), FOREIGN KEY (shop_id) REFERENCES shops (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL, price_per_item REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id), FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')
    conn.commit()
    print("Tables created successfully.")


def seed_data(conn):
    """Seed the database with updated shops, owners, and products."""
    try:
        cursor = conn.cursor()

        # --- New Shops ---
        shops = ['South Dhaba', 'Frankie Rolls', 'Gossip and Sip']
        cursor.executemany('INSERT OR IGNORE INTO shops (name) VALUES (?)', [(shop,) for shop in shops])
        
        # --- New Users: 1 Student, 3 Owners ---
        users = [
            # Student
            ('student@example.com', hash_password('student123'), 'student', 'Janny', 'Doe', None),
            # Owners
            ('dhaba@example.com', hash_password('owner123'), 'owner', 'Rajesh', 'Kumar', 1), # Owner of South Dhaba (shop_id=1)
            ('frankie@example.com', hash_password('owner123'), 'owner', 'Priya', 'Singh', 2), # Owner of Frankie Rolls (shop_id=2)
            ('sip@example.com', hash_password('owner123'), 'owner', 'Amit', 'Sharma', 3)   # Owner of Gossip and Sip (shop_id=3)
        ]
        
        # --- Categories ---
        categories = ['South Indian', 'Rolls & Wraps', 'Beverages', 'Chinese', 'Desserts', 'Sandwiches']
        cursor.executemany('INSERT OR IGNORE INTO categories (name) VALUES (?)', [(cat,) for cat in categories])
        
        # --- New Products mapped to the new shops ---
        # Category IDs: 1:South Indian, 2:Rolls & Wraps, 3:Beverages, 4:Chinese, 5:Desserts, 6:Sandwiches
        products = [
            # South Dhaba (shop_id=1)
            ('Masala Dosa', 5.50, 'Classic South Indian crepe with potato filling.', '/images/veggie-burger.jpg', 1, 1),
            ('Idli Sambar', 8.00, 'Steamed rice cakes with lentil stew.', '/images/pasta.jpg', 1, 1),
            ('Veg Hakka Noodles', 6.75, 'Indo-Chinese stir-fried noodles.', '/images/stir-fry.jpg', 4, 1),
            
            # Frankie Rolls (shop_id=2)
            ('Paneer Tikka Roll', 7.25, 'Grilled paneer wrapped in a soft flatbread.', '/images/salad.jpg', 2, 2),
            ('Chicken Shawarma Roll', 9.50, 'Classic Middle-Eastern style chicken wrap.', '/images/salmon.jpg', 2, 2),
            ('Veg Club Sandwich', 6.00, 'Triple-layered sandwich with fresh vegetables.', '/images/sandwich.jpg', 6, 2),

            # Gossip and Sip (shop_id=3)
            ('Espresso', 2.50, 'A strong shot of coffee.', '/images/espresso.jpg', 3, 3),
            ('Iced Coffee', 3.50, 'Chilled coffee served over ice.', '/images/iced-coffee.jpg', 3, 3),
            ('Chocolate Brownie', 4.00, 'A rich and fudgy chocolate brownie.', '/images/cake.jpg', 5, 3)
        ]

        # --- Insert Data ---
        cursor.executemany('INSERT OR IGNORE INTO users (email, password, role, first_name, last_name, shop_id) VALUES (?, ?, ?, ?, ?, ?)', users)
        cursor.executemany('INSERT OR IGNORE INTO products (name, price, description, image_url, category_id, shop_id) VALUES (?, ?, ?, ?, ?, ?)', products)

        # --- Add a sample completed order for testing history ---
        order_count = cursor.execute("SELECT COUNT(id) FROM orders").fetchone()[0]
        if order_count == 0:
            cursor.execute("INSERT INTO orders (user_id, shop_id, total_price, status, order_date) VALUES (?, ?, ?, ?, datetime('now', '-2 day'))", (1, 1, 5.50, 'Completed'))
            order1_id = cursor.lastrowid
            cursor.execute("INSERT INTO order_items (order_id, product_id, quantity, price_per_item) VALUES (?, ?, ?, ?)", (order1_id, 1, 1, 5.50))
            print("Added one sample completed order for history.")

        conn.commit()
        print("Database seeded successfully with new data.")
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