// --- Cart Management ---

const CART_KEY = 'canteenCart';

function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId, quantity = 1) {
    if (!window.db) {
        alert("Database not ready. Please wait a moment and try again.");
        return;
    }

    let cart = getCart();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        try {
            const stmt = db.prepare("SELECT id, name, price, image_url FROM products WHERE id = ?");
            stmt.bind([productId]);
            if (stmt.step()) {
                const product = stmt.getAsObject();
                cart.push({ ...product, quantity: quantity });
            }
            stmt.free();
        } catch (error) {
            console.error("Error fetching product to add to cart:", error);
            alert("Could not add item to cart.");
            return;
        }
    }

    saveCart(cart);
    updateCartCounter(); // from main.js
    alert("Item added to cart!");
}

function updateCartItemQuantity(productId, newQuantity) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
        if (newQuantity > 0) {
            cart[itemIndex].quantity = newQuantity;
        } else {
            // Remove item if quantity is 0 or less
            cart.splice(itemIndex, 1);
        }
    }

    saveCart(cart);
    // These functions are on the cart page
    if (typeof displayCartItems === 'function') {
        displayCartItems();
        displayCartTotal();
    }
    updateCartCounter();
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);

    if (typeof displayCartItems === 'function') {
        displayCartItems();
        displayCartTotal();
    }
    updateCartCounter();
}

function getCartTotal() {
    const cart = getCart();
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = 2.00; // example fee
    const discount = 0; // example discount
    const total = subtotal + deliveryFee - discount;

    return {
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: discount,
        total: total
    };
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartCounter();
    if (typeof displayCartItems === 'function') {
        displayCartItems();
        displayCartTotal();
    }
}

// Make functions globally available as they are called from HTML
window.getCart = getCart;
window.addToCart = addToCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeFromCart = removeFromCart;
window.getCartTotal = getCartTotal;
window.clearCart = clearCart;
