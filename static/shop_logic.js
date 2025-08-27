// This file contains shared logic for the Shop Owner pages.

// --- User Authentication & Redirect ---
const user = JSON.parse(localStorage.getItem('canteenUser'));
if (!user || user.role !== 'owner') {
    window.location.href = './login.html';
}

// --- Reusable HTML Component Functions ---

function createOrderItemHTML(item) {
    return `<div class="flex items-center gap-3">
                <div class="size-10 rounded-md bg-cover bg-center flex-shrink-0" style="background-image: url('${item.image_url}')"></div>
                <p class="text-sm text-[#1c1a0d] flex-1">${item.quantity}x ${item.product_name}</p>
            </div>`;
}

// In shop_logic.js, find and REPLACE this function:
function createLiveOrderCardHTML(order) {
    const firstItem = order.items && order.items[0];
    const firstItemImage = firstItem ? firstItem.image_url : 'https://placehold.co/128x128/f3f2e7/1c1a0d?text=Item';
    const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    let itemSummary = 'No items in order';

    if (firstItem) {
        const remainingItemsCount = totalQuantity - firstItem.quantity;
        itemSummary = `${firstItem.quantity}x ${firstItem.product_name || 'Product'}`;
        if (remainingItemsCount > 0) {
            itemSummary += ` + ${remainingItemsCount} more`;
        }
    }

    let actionButtons = '';
    let statusBadge = '';

    if (order.status === 'Pending') {
        statusBadge = `<div class="text-sm font-bold text-orange-600">New Order</div>`;
        actionButtons = `
            <button onclick="updateStatus(${order.order_id}, 'Ready')" class="press-effect flex-1 h-10 rounded-lg bg-[#f3dd39] text-[#1c1a0d] text-sm font-bold">Accept</button>
            <button onclick="updateStatus(${order.order_id}, 'Rejected')" class="press-effect flex-1 h-10 rounded-lg bg-[#f3f2e7] text-[#1c1a0d] text-sm font-bold">Reject</button>
        `;
    } else if (order.status === 'Ready') {
        statusBadge = `<div class="text-sm font-bold text-amber-700">Preparing</div>`;
        actionButtons = `<button onclick="updateStatus(${order.order_id}, 'Completed')" class="press-effect w-full h-10 rounded-lg bg-[#6b622c] text-white text-sm font-bold">Mark as Completed</button>`;
    }

    return `
        <div class="p-4">
            <div class="flex items-stretch justify-between gap-4 rounded-lg bg-white p-4 border border-[#e5e2d0] shadow-sm">
                <div class="flex flex-[2_2_0px] flex-col gap-3">
                    <div class="flex flex-col gap-1 min-w-0">
                        ${statusBadge}
                        <p class="text-[#1c1a0d] text-base font-bold leading-tight truncate">${order.first_name} ${order.last_name}</p>
                        <p class="text-[#9b924b] text-sm font-normal leading-normal truncate">${itemSummary}</p>
                    </div>
                    <div class="text-[#1c1a0d] text-lg font-bold mt-auto">$${order.total_price.toFixed(2)}</div>
                </div>
                <div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg flex-1" style="background-image: url('${firstItemImage}');"></div>
            </div>
            <div class="flex gap-3 pt-3">
                ${actionButtons}
            </div>
        </div>
    `;
}

// In shop_logic.js, find and REPLACE this function:
function createRecentOrderCardHTML(order) {
    const firstItem = order.items && order.items[0]; // Check if items exist
    const firstItemImage = firstItem ? firstItem.image_url : 'https://placehold.co/128x128/f3f2e7/1c1a0d?text=Item';
    const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    let itemSummary = 'No items in this order.';

    if (firstItem) {
        const remainingItemsCount = totalQuantity - firstItem.quantity;
        itemSummary = `${firstItem.quantity}x ${firstItem.product_name || 'Product'}`;
        if (remainingItemsCount > 0) {
            itemSummary += ` + ${remainingItemsCount} more`;
        }
    }

    return `
        <div class="flex items-center justify-between gap-4 rounded-lg bg-white p-3 border border-[#e5e2d0] shadow-sm">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-14 h-14 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0" style="background-image: url('${firstItemImage}');"></div>
                <div class="min-w-0">
                    <p class="text-[#1c1a0d] text-base font-bold truncate">Order from ${order.first_name}</p>
                    <p class="text-sm font-medium text-[#9b924b] truncate">${itemSummary}</p>
                </div>
            </div>
            <p class="text-lg font-bold text-[#1c1a0d] flex-shrink-0">$${order.total_price.toFixed(2)}</p>
        </div>`;
}


// In shop_logic.js, find and REPLACE this function:
function createHistoryCardHTML(order) {
    const orderDate = new Date(order.order_date);
    const formattedDate = orderDate.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    
    const firstItem = order.items && order.items[0]; // Check if items exist
    const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    let itemSummary = '';
    
    if (firstItem) {
        const remainingItemsCount = totalQuantity - firstItem.quantity;
        itemSummary = ` • ${firstItem.product_name || 'Product'}`;
        if (remainingItemsCount > 0) {
            itemSummary += ` + ${remainingItemsCount} more`;
        }
    }

    return `<div class="bg-white p-4 rounded-lg border border-[#e5e2d0] shadow-sm">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-sm font-semibold text-[#1c1a0d]">Order #${order.order_id}<span class="font-normal text-gray-600">${itemSummary}</span></p>
                        <p class="text-xs text-gray-500">${order.first_name} on ${formattedDate}</p>
                    </div>
                    <p class="text-right font-bold text-md text-[#1c1a0d]">$${order.total_price.toFixed(2)}</p>
                </div>
                <div class="border-t border-[#e5e2d0] pt-3 flex flex-col gap-3">
                    ${order.items.map(createOrderItemHTML).join('')}
                </div>
            </div>`;
}

// --- API Functions ---
// ... (rest of the file is unchanged) ...

async function updateStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error('Failed to update status');
        if(typeof fetchLiveOrders === 'function') {
            fetchLiveOrders();
        }
    } catch (error) {
        console.error("Error updating status:", error);
        alert('Could not update order status.');
    }
}


// --- Page-Specific Logic ---

// Logic for shop_dashboard.html
async function loadDashboard() {
    document.getElementById('welcome-message').textContent = `Welcome, ${user.first_name}`;

    // --- Populate Weekly Breakdown Chart (with REAL data) ---
    await populateWeeklyChart();

    if (!user.shop_id) return;
    try {
        const response = await fetch(`/dashboard/shop/${user.shop_id}`);
        const data = await response.json();
        document.getElementById('total-orders').textContent = data.total_orders_today;
        document.getElementById('total-revenue').textContent = `$${data.total_revenue_today.toFixed(2)}`;
        
        const recentOrdersContainer = document.getElementById('recent-orders-container');
        recentOrdersContainer.innerHTML = '';
        if(data.recent_orders.length > 0) {
            data.recent_orders.forEach(order => {
                recentOrdersContainer.innerHTML += createRecentOrderCardHTML(order);
            });
        } else {
            recentOrdersContainer.innerHTML = '<p class="text-center text-gray-500 py-4">No recent orders today.</p>';
        }
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

// In shop_logic.js, ADD this new helper function:
async function populateWeeklyChart() {
    const earningsContainer = document.getElementById('daily-earnings-container');
    const barsContainer = document.getElementById('daily-bars-container');
    earningsContainer.innerHTML = '';
    barsContainer.innerHTML = '';

    try {
        const response = await fetch(`/dashboard/shop/${user.shop_id}/weekly-summary`);
        const weeklyData = await response.json();

        const maxEarning = Math.max(...weeklyData.map(d => d.earnings), 1); // Avoid division by zero

        weeklyData.forEach(data => {
            const barHeight = (data.earnings / maxEarning) * 100;
            const barColor = data.is_today ? 'bg-[#f3dd39]' : 'bg-[#f3f2e7]';
            
            earningsContainer.innerHTML += `<p class="text-[10px] text-[#9b924b] font-bold">$${Math.round(data.earnings)}</p>`;
            barsContainer.innerHTML += `<div class="w-full ${barColor} rounded-t-md" style="height: ${barHeight}%;"></div>`;
        });

    } catch (error) {
        console.error("Failed to load weekly chart data:", error);
        barsContainer.innerHTML = '<p class="text-red-500 text-xs col-span-7">Could not load chart.</p>';
    }
}

// Logic for shop_orders.html
async function fetchLiveOrders() {
    if (!user.shop_id) return;
    try {
        const response = await fetch(`/orders/shop/${user.shop_id}/summary`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const summary = await response.json();
        const container = document.getElementById('live-orders-container');
        container.innerHTML = '';
        
        const liveOrders = [...summary.pending, ...summary.ready];
        
        if (liveOrders.length > 0) {
            liveOrders.forEach(order => container.innerHTML += createLiveOrderCardHTML(order));
        } else {
            container.innerHTML = '<p class="text-center text-gray-500 py-16">No active orders right now.</p>';
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
        document.getElementById('live-orders-container').innerHTML = '<p class="text-red-500 p-4">Could not load orders.</p>';
    }
}


// Logic for shop_order_history.html
let allCompletedOrders = [];

function renderHistory(ordersToRender) {
    const container = document.getElementById('completed-orders-container');
    container.innerHTML = '';
    if (ordersToRender.length > 0) {
        ordersToRender.forEach(order => container.innerHTML += createHistoryCardHTML(order));
    } else {
        container.innerHTML = '<p class="text-sm text-center text-gray-500 py-8">No orders found for this period.</p>';
    }
}

function filterOrdersByDays(days) {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - parseInt(days));
    
    if (days >= 9999) { // "All Time"
            renderHistory(allCompletedOrders);
            return;
    }

    const filtered = allCompletedOrders.filter(order => new Date(order.order_date) >= cutoffDate);
    renderHistory(filtered);
}

async function fetchHistory() {
    if (!user.shop_id) return;
    try {
        const response = await fetch(`/orders/shop/${user.shop_id}/summary`);
        const summary = await response.json();
        allCompletedOrders = summary.completed;
        filterOrdersByDays('7'); // Default to "Last 7 Days"
    } catch (e) {
        console.error(e);
        document.getElementById('completed-orders-container').innerHTML = '<p class="text-red-500">Could not load order history.</p>';
    }
}