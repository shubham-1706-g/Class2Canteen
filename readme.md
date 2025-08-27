### `README.md` (Updated)

```markdown
# Canteen Ordering System

This project is a modern, mobile-first web application for a college canteen ordering system. It features separate, user-friendly interfaces for both students and shop owners, powered by a single, robust FastAPI backend and a SQLite database.

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
  - [Student Application](#student-application)
  - [Shop Owner Application](#shop-owner-application)
  - [Backend & Technology](#backend--technology)
- [Live Demo & Screenshots](#live-demo--screenshots)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
- [How to Use](#how-to-use)
  - [Running the Application](#running-the-application)
  - [Default Login Credentials](#default-login-credentials)
- [API Endpoints](#api-endpoints)
- [Next Steps](#next-steps)

## Project Overview
The Canteen Ordering System is designed to streamline the food ordering process in a college environment. Students can browse menus from various canteens, place orders, and track their status. Shop owners have a dedicated dashboard to manage incoming orders, update their menu, and monitor their business performance.

The application is built with a focus on a clean, minimal, and aesthetic user interface, optimized for mobile devices, using vanilla JavaScript for a fast, SPA-like feel without a heavy framework.

## Key Features

### Student Application
- **Secure Login:** Role-based authentication for students.
- **Personalized Home Page:** A welcoming dashboard displaying popular food items.
- **Comprehensive Product Listings:** View all available products from all canteens on a single, scrollable page.
- **Dynamic Filtering:** Filter products by shop (e.g., "Canteen 1") or by food category (e.g., "South Indian").
- **Detailed Product View:** Click on any item to see more details and adjust the quantity.
- **Seamless Cart Management:** Add items, view the cart, and proceed to a streamlined checkout.
- **Order History:** A dedicated page to view the status of current orders and review past orders.
- **Profile Management:** Students can view and update their profile information (name, email) via a smooth, interactive form.

### Shop Owner Application
- **Role-Based Login:** Owners are redirected to a dedicated management dashboard upon login.
- **Unified Dashboard:** A home screen displaying key performance indicators like today's total orders and revenue, a weekly earnings breakdown chart, and a list of the most recent orders.
- **Live Order Management:** The primary screen for owners, showing new ("Pending") and in-progress ("Ready") orders in real-time with detailed item summaries.
- **One-Click Order Status Updates:** Owners can accept new orders (marking them as "Ready") and mark them as "Completed" with the press of a button.
- **Order History:** A separate screen to view all completed orders, with filters for "Last 7 Days," "Last 30 Days," and "All Time."
- **Full Product CRUD:**
    - View a list of all products belonging to the owner's shop.
    - Add new products via a clean, themed form.
    - Edit existing product details, including name, price, description, and category.
- **Profile & Settings Management:** A redesigned profile page to view and update personal information.

### Backend & Technology
- **FastAPI Backend:** A robust and modern Python framework for building the API.
- **SQLite Database:** A lightweight, file-based database perfect for this scale of application.
- **Pydantic Data Validation:** Ensures data integrity between the frontend and backend.
- **Unified API:** A single set of endpoints intelligently serves both the student and shop owner applications.

## Live Demo & Screenshots
*(This is a placeholder section. You can add GIFs or screenshots of your application in action here.)*

| Student - All Products & Filtering | Student - Product Details | Shop Owner - Live Orders | Shop Owner - Add Product |
| :---: | :---: | :---: | :---: |
| *(Screenshot)* | *(Screenshot)* | *(Screenshot)* | *(Screenshot)* |


## Technology Stack
- **Backend:** Python, FastAPI
- **Database:** SQLite
- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript
- **API Testing:** FastAPI's built-in Swagger UI at `/docs`

## Project Structure
```
.
├── static/                  # All frontend files (HTML, CSS, JS)
│   ├── home.html            # Student pages
│   ├── all_products.html
│   ├── product.html
│   ├── my_cart.html
│   ├── orders.html
│   ├── profile.html
│   ├── login.html
│   ├── shop_dashboard.html    # Owner pages
│   ├── shop_orders.html
│   ├── shop_order_history.html
│   ├── shop_products.html
│   ├── shop_add_product.html
│   ├── shop_edit_product.html
│   ├── shop_settings.html
│   └── shop_logic.js          # Shared JS for owner pages
├── database.py              # Script to create and seed the database
├── main.py                  # FastAPI application and API endpoints
├── database.db              # SQLite database file (generated)
└── README.md
```

## Setup and Installation

### Prerequisites
- Python 3.7+
- `pip` for package management

### Installation Steps

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Create a Virtual Environment (Recommended):**
    ```bash
    # For Windows
    python -m venv venv
    .\venv\Scripts\activate

    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies:**
    This project uses FastAPI and its standard server, Uvicorn.
    ```bash
    pip install "fastapi[all]"
    ```

4.  **Set Up the Database:**
    Run the `database.py` script. This will create a `database.db` file if it doesn't exist and seed it with tables and sample data, including users, products, and pre-made orders for testing.
    ```bash
    python database.py
    ```
    *Note: The script is designed to be safe to run multiple times; it will not duplicate existing master data. It only adds sample orders if the orders table is empty.*

## How to Use

### Running the Application
1.  **Start the Backend Server:**
    Run the following command in your terminal from the project's root directory:
    ```bash
    uvicorn main:app --reload
    ```
    The `--reload` flag automatically restarts the server when you make changes to the Python code.

2.  **Access the Application:**
    Open your web browser and navigate to:
    - **Application:** `http://127.0.0.1:8000/login.html`
    - **API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`

### Default Login Credentials
You can use these credentials to test both user roles:

-   **Student:**
    -   **Email:** `student@example.com`
    -   **Password:** `student123`

-   **Shop Owner:**
    -   **Email:** `owner@example.com`
    -   **Password:** `owner123`

## API Endpoints
A summary of the main API endpoints. Test them all at `http://127.0.0.1:8000/docs`.

| Method | Path                               | Description                                     |
|--------|------------------------------------|-------------------------------------------------|
| `POST` | `/login`                           | Authenticates a user (student or owner).        |
| `PUT`  | `/users/{user_id}`                 | Updates a user's profile information.           |
| `GET`  | `/products`                        | Get all products, with optional filters (Student).|
| `GET`  | `/products/shop/{shop_id}`         | Get all products for a specific shop (Owner).     |
| `POST` | `/products`                        | Creates a new product (Owner).                  |
| `PUT`  | `/products/{product_id}`           | Updates an existing product (Owner).            |
| `POST` | `/orders`                          | Creates a new order (Student).                  |
| `GET`  | `/orders/user/{user_id}`           | Gets the order history for a student.           |
| `GET`  | `/orders/shop/{shop_id}/summary`   | Gets categorized orders for a shop (Owner).     |
| `PUT`  | `/orders/{order_id}/status`        | Updates the status of an order (Owner).         |
| `GET`  | `/dashboard/shop/{shop_id}`        | Gets dashboard analytics for a shop (Owner).    |

## Next Steps
The core functionality for both students and shop owners is now in place. Future development can focus on:

-   **Real-time Notifications:** Use WebSockets to push live order updates to both students and owners.
-   **Payment Gateway Integration:** Integrate a payment system like Stripe for real transactions.
-   **Enhanced Analytics:** Expand the dashboard with more detailed charts and sales reports.
-   **Multi-Shop Cart:** Enhance the student's cart to handle items from different shops, creating separate orders on checkout.
-   **Deployment:** Plan for deploying the application to a cloud service (e.g., Heroku, AWS, DigitalOcean) so it can be accessed publicly.