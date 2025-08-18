// Note: This script assumes that sql.js has been loaded in the HTML file.
// For example: <script src="https://cdn.jsdelivr.net/npm/sql.js@1.4.0/dist/sql-wasm.js"></script>

let db;

async function initializeDatabase() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.4.0/dist/${file}`
        });
        db = new SQL.Database();
        createTables();
        populateData();
        console.log("Database initialized and populated.");
        // Make the database available globally
        window.db = db;
    } catch (error) {
        console.error("Database initialization failed:", error);
    }
}

function createTables() {
    const usersTable = `
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            password TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const shopsTable = `
        CREATE TABLE shops (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            description TEXT,
            image_url TEXT,
            is_active BOOLEAN DEFAULT 1
        );
    `;

    const productsTable = `
        CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            shop_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2),
            image_url TEXT,
            category TEXT,
            is_vegetarian BOOLEAN DEFAULT 0,
            rating DECIMAL(2,1) DEFAULT 0,
            is_available BOOLEAN DEFAULT 1,
            FOREIGN KEY (shop_id) REFERENCES shops (id)
        );
    `;

    const ordersTable = `
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            shop_id INTEGER,
            total_amount DECIMAL(10,2),
            status TEXT DEFAULT 'pending',
            order_token TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (shop_id) REFERENCES shops (id)
        );
    `;

    const orderItemsTable = `
        CREATE TABLE order_items (
            id INTEGER PRIMARY KEY,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price DECIMAL(10,2),
            customizations TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        );
    `;

    db.run(usersTable);
    db.run(shopsTable);
    db.run(productsTable);
    db.run(ordersTable);
    db.run(orderItemsTable);
}

function populateData() {
    // Sample Users
    db.run("INSERT INTO users (name, email, password, role) VALUES ('Student User', 'student@test.com', 'password123', 'student');");
    db.run("INSERT INTO users (name, email, password, role) VALUES ('Shop Owner', 'owner@test.com', 'password123', 'owner');");

    // Sample Shops
    db.run("INSERT INTO shops (id, name, type, description, image_url) VALUES (1, 'Chinese Fast Food', 'Chinese', 'Authentic Chinese fast food.', 'assets/images/shop1.jpg');");
    db.run("INSERT INTO shops (id, name, type, description, image_url) VALUES (2, 'Sandwich & South Indian', 'Mixed', 'Delicious sandwiches and South Indian dishes.', 'assets/images/shop2.jpg');");

    // Sample Products for Shop 1
    const products1 = [
        { name: 'Noodles', description: 'Classic stir-fried noodles.', price: 5.99, image_url: 'assets/images/noodles.jpg', category: 'Fast Food', is_vegetarian: 1, rating: 4.5 },
        { name: 'Fried Rice', description: 'Flavorful fried rice with vegetables.', price: 6.99, image_url: 'assets/images/fried_rice.jpg', category: 'Fast Food', is_vegetarian: 1, rating: 4.2 },
        { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls.', price: 3.99, image_url: 'assets/images/spring_rolls.jpg', category: 'Appetizer', is_vegetarian: 1, rating: 4.0 },
        { name: 'Manchurian', description: 'Spicy and tangy Manchurian balls.', price: 7.99, image_url: 'assets/images/manchurian.jpg', category: 'Fast Food', is_vegetarian: 1, rating: 4.6 },
        { name: 'Chilli Chicken', description: 'Spicy Chilli Chicken.', price: 8.99, image_url: 'assets/images/chilli_chicken.jpg', category: 'Fast Food', is_vegetarian: 0, rating: 4.8 },
        { name: 'Sweet Corn Soup', description: 'Warm and comforting sweet corn soup.', price: 2.99, image_url: 'assets/images/sweet_corn_soup.jpg', category: 'Soup', is_vegetarian: 1, rating: 4.1 },
        { name: 'Gobi Manchurian', description: 'Crispy cauliflower in a spicy sauce.', price: 7.49, image_url: 'assets/images/gobi_manchurian.jpg', category: 'Fast Food', is_vegetarian: 1, rating: 4.4 },
        { name: 'Hakka Noodles', description: 'Stir-fried noodles with a mix of sauces and vegetables.', price: 6.49, image_url: 'assets/images/hakka_noodles.jpg', category: 'Fast Food', is_vegetarian: 1, rating: 4.3 },
    ];

    products1.forEach(p => {
        db.run(`INSERT INTO products (shop_id, name, description, price, image_url, category, is_vegetarian, rating) VALUES (1, ?, ?, ?, ?, ?, ?, ?);`, [p.name, p.description, p.price, p.image_url, p.category, p.is_vegetarian, p.rating]);
    });

    // Sample Products for Shop 2
    const products2 = [
        { name: 'Masala Dosa', description: 'Crispy dosa with a savory potato filling.', price: 4.99, image_url: 'assets/images/masala_dosa.jpg', category: 'South Indian', is_vegetarian: 1, rating: 4.7 },
        { name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup.', price: 3.99, image_url: 'assets/images/idli_sambar.jpg', category: 'South Indian', is_vegetarian: 1, rating: 4.5 },
        { name: 'Veg Sandwich', description: 'Classic vegetable sandwich.', price: 3.49, image_url: 'assets/images/veg_sandwich.jpg', category: 'Sandwich', is_vegetarian: 1, rating: 4.2 },
        { name: 'Paneer Sandwich', description: 'Grilled sandwich with a paneer filling.', price: 4.49, image_url: 'assets/images/paneer_sandwich.jpg', category: 'Sandwich', is_vegetarian: 1, rating: 4.6 },
        { name: 'Uttapam', description: 'Thick pancake with toppings.', price: 5.49, image_url: 'assets/images/uttapam.jpg', category: 'South Indian', is_vegetarian: 1, rating: 4.3 },
        { name: 'Vada Pav', description: 'A popular Indian street food.', price: 2.99, image_url: 'assets/images/vada_pav.jpg', category: 'Fast Food', is_vegetarian: 1, rating: 4.8 },
        { name: 'Cheese Sandwich', description: 'A simple and classic cheese sandwich.', price: 3.99, image_url: 'assets/images/cheese_sandwich.jpg', category: 'Sandwich', is_vegetarian: 1, rating: 4.1 },
        { name: 'Rava Dosa', description: 'Crispy dosa made from semolina.', price: 5.99, image_url: 'assets/images/rava_dosa.jpg', category: 'South Indian', is_vegetarian: 1, rating: 4.4 },
    ];

    products2.forEach(p => {
        db.run(`INSERT INTO products (shop_id, name, description, price, image_url, category, is_vegetarian, rating) VALUES (2, ?, ?, ?, ?, ?, ?, ?);`, [p.name, p.description, p.price, p.image_url, p.category, p.is_vegetarian, p.rating]);
    });
}

// Initialize the database when the script is loaded
initializeDatabase();
