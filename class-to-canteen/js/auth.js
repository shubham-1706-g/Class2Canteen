// This script depends on the global `db` object created in database.js

function registerUser(name, email, password, phone, role = 'student') {
    if (!window.db) {
        console.error("Database not initialized!");
        alert("Registration failed. Please try again later.");
        return false;
    }

    try {
        // Check if user already exists
        const checkStmt = db.prepare("SELECT id FROM users WHERE email = ?");
        checkStmt.bind([email]);
        const userExists = checkStmt.step();
        checkStmt.free();

        if (userExists) {
            alert("An account with this email already exists.");
            return false;
        }

        // Insert new user
        const stmt = db.prepare("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)");
        stmt.run([name, email, password, phone, role]);
        stmt.free();

        alert("Registration successful! Please log in.");
        return true;
    } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred during registration. Please try again.");
        return false;
    }
}

function authenticateUser(email, password) {
    if (!window.db) {
        console.error("Database not initialized!");
        alert("Login failed. Please try again later.");
        return null;
    }

    try {
        const stmt = db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?");
        stmt.bind([email, password]);

        if (stmt.step()) {
            const user = stmt.getAsObject();
            localStorage.setItem('currentUser', JSON.stringify(user));
            stmt.free();
            return user;
        } else {
            stmt.free();
            return null;
        }
    } catch (error) {
        console.error("Authentication error:", error);
        alert("An error occurred during login. Please try again.");
        return null;
    }
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    // Adjust path for GitHub Pages deployment
    window.location.href = '/class-to-canteen/index.html';
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function protectRoute() {
    const user = getCurrentUser();
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/class-to-canteen/');

    if (!user && !isLoginPage) {
        // If on a protected page and not logged in, redirect to login
        window.location.href = '/class-to-canteen/index.html';
    } else if (user && isLoginPage) {
        // If on the login page but already logged in, redirect to the appropriate dashboard
        if (user.role === 'student') {
            window.location.href = '/class-to-canteen/student/home.html';
        } else if (user.role === 'owner') {
            window.location.href = '/class-to-canteen/shop/dashboard.html';
        }
    }
}

// Make functions globally available
window.registerUser = registerUser;
window.authenticateUser = authenticateUser;
window.logoutUser = logoutUser;
window.getCurrentUser = getCurrentUser;
window.protectRoute = protectRoute;

// It's better to call protectRoute() on each page after ensuring the DOM is loaded
// and the DB is available if needed. For now, we'll call it from the main script of each page.
