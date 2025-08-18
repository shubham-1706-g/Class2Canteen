// This script depends on the global `db` object and functions from auth.js, cart.js

// --- Home Page Functions ---

function loadPopularFood() {
    if (!window.db) return;
    const popularFoodGrid = document.getElementById('popular-food-grid');
    if (!popularFoodGrid) return;

    try {
        const stmt = db.prepare("SELECT * FROM products ORDER BY rating DESC LIMIT 4");
        let productsHtml = '';
        while(stmt.step()) {
            const product = stmt.getAsObject();
            productsHtml += `
                <div class="food-card">
                    <img src="../${product.image_url}" alt="${product.name}" class="food-image">
                    <div class="food-info">
                        <h4 class="food-title">${product.name}</h4>
                        <p class="food-rating">⭐ ${product.rating}</p>
                        <p class="food-price">$${product.price.toFixed(2)}</p>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            `;
        }
        stmt.free();
        popularFoodGrid.innerHTML = productsHtml;
    } catch (error) {
        console.error("Failed to load popular food:", error);
        popularFoodGrid.innerHTML = '<p>Could not load popular items at this time.</p>';
    }
}

function loadRestaurants() {
    if (!window.db) return;
    const restaurantsList = document.getElementById('restaurants-list');
    if (!restaurantsList) return;

    try {
        const stmt = db.prepare("SELECT * FROM shops WHERE is_active = 1");
        let shopsHtml = '';
        while(stmt.step()) {
            const shop = stmt.getAsObject();
            shopsHtml += `
                <div class="restaurant-card" onclick="viewMenu(${shop.id})">
                    <img src="../${shop.image_url}" alt="${shop.name}" class="restaurant-image">
                    <div class="restaurant-info">
                        <h4 class="restaurant-title">${shop.name}</h4>
                        <p class="restaurant-type">${shop.type}</p>
                    </div>
                </div>
            `;
        }
        stmt.free();
        restaurantsList.innerHTML = shopsHtml;
    } catch (error) {
        console.error("Failed to load restaurants:", error);
        restaurantsList.innerHTML = '<p>Could not load restaurants at this time.</p>';
    }
}

function viewMenu(shopId) {
    window.location.href = `menu.html?shopId=${shopId}`;
}

// --- Menu Page Functions ---

function loadMenuPage() {
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get('shopId');
    const category = sessionStorage.getItem('categoryFilter');
    const searchQuery = sessionStorage.getItem('searchQuery');

    // Set heading based on filter/search
    const menuTitle = document.getElementById('menu-title');
    if (menuTitle) {
        if (searchQuery) {
            menuTitle.textContent = `Search results for "${searchQuery}"`;
        } else if (category) {
            menuTitle.textContent = `${category} Items`;
        } else {
            menuTitle.textContent = 'All Menu Items';
        }
    }

    if (shopId) {
        loadShopDetails(shopId);
        loadProducts(shopId, null, null); // On a specific shop page, don't apply global filters
    } else {
        loadProducts(null, category, searchQuery); // On the general menu page, apply filters
    }
    // Clean up session storage so filters don't persist unintentionally
    sessionStorage.removeItem('categoryFilter');
    sessionStorage.removeItem('searchQuery');
}

function loadShopDetails(shopId) {
    if (!window.db) return;
    const shopNameEl = document.getElementById('shop-name');
    if (!shopNameEl) return;

    try {
        const stmt = db.prepare("SELECT name FROM shops WHERE id = ?");
        stmt.bind([shopId]);
        if (stmt.step()) {
            const shop = stmt.getAsObject();
            // Also update the main menu title
            const menuTitle = document.getElementById('menu-title');
            if(menuTitle) menuTitle.textContent = `Menu for ${shop.name}`;
        }
        stmt.free();
    } catch (error) {
        console.error(`Failed to load shop details for shopId ${shopId}:`, error);
    }
}

function loadProducts(shopId, category, searchQuery) {
    if (!window.db) return;
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    let query = "SELECT * FROM products WHERE is_available = 1";
    const params = [];

    if (shopId) {
        query += " AND shop_id = ?";
        params.push(shopId);
    }
    if (category && category !== 'All') {
        if(category === 'Vegetarian') {
            query += " AND is_vegetarian = 1";
        } else if (category === 'Health Food' || category === 'Fast Food' || category === 'South Indian' || category === 'Chinese') {
            query += " AND category = ?";
            params.push(category);
        }
    }
    if (searchQuery) {
        query += " AND name LIKE ?";
        params.push(`%${searchQuery}%`);
    }

    try {
        const stmt = db.prepare(query);
        stmt.bind(params);

        let productsHtml = '';
        while(stmt.step()) {
            const product = stmt.getAsObject();
            productsHtml += `
                <div class="food-card">
                    ${product.is_vegetarian ? '<span class="veg-indicator" title="Vegetarian"></span>' : ''}
                    <img src="../${product.image_url}" alt="${product.name}" class="food-image">
                    <div class="food-info">
                        <h4 class="food-title">${product.name}</h4>
                        <p class="food-description">${product.description}</p>
                        <div class="food-details">
                            <p class="food-rating">⭐ ${product.rating}</p>
                            <p class="food-price">$${product.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id}, 1)">Add to Cart</button>
                </div>
            `;
        }
        stmt.free();

        if(productsHtml === '') {
            productGrid.innerHTML = '<p class="not-found">No products found that match your criteria.</p>';
        } else {
            productGrid.innerHTML = productsHtml;
        }

    } catch (error) {
        console.error("Failed to load products:", error);
        productGrid.innerHTML = '<p class="error">Could not load products at this time.</p>';
    }
}


// --- General Functions ---

function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        const cart = getCart(); // from cart.js
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        counter.textContent = count;
        counter.style.display = count > 0 ? 'flex' : 'none';
    }
}
