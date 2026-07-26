let products = [];
let cart = JSON.parse(localStorage.getItem("az_cart") || "[]");
let currentCategory = "";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadProducts();
    updateCartCount();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById("searchBtn").addEventListener("click", handleSearch);
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });

    document.getElementById("closeOrderModal").addEventListener("click", () => {
        document.getElementById("orderModal").classList.remove("active");
    });

    document.getElementById("closeCartModal").addEventListener("click", () => {
        document.getElementById("cartModal").classList.remove("active");
    });

    document.getElementById("cartBtn").addEventListener("click", showCart);

    document.getElementById("orderForm").addEventListener("submit", handleOrder);

    document.querySelectorAll(".footer-links a[data-category]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            filterByCategory(link.dataset.category);
            document.getElementById("products").scrollIntoView({ behavior: "smooth" });
        });
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("active");
        });
    });
}

async function loadCategories() {
    try {
        const res = await fetch("/api/categories");
        const categories = await res.json();
        const bar = document.getElementById("categoryBar");

        categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = "cat-btn";
            btn.textContent = cat;
            btn.dataset.category = cat;
            btn.addEventListener("click", () => filterByCategory(cat));
            bar.appendChild(btn);
        });

        bar.querySelector('[data-category=""]').addEventListener("click", () => filterByCategory(""));
    } catch (err) {
        console.error("Failed to load categories:", err);
    }
}

async function loadProducts() {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = '<div class="loading">Loading products...</div>';

    try {
        let url = "/api/products?";
        if (currentCategory) url += `category=${encodeURIComponent(currentCategory)}&`;
        if (currentSearch) url += `search=${encodeURIComponent(currentSearch)}`;

        const res = await fetch(url);
        products = await res.json();
        renderProducts(products);
    } catch (err) {
        grid.innerHTML = '<div class="no-products">Failed to load products. Please refresh.</div>';
    }
}

function renderProducts(items) {
    const grid = document.getElementById("productsGrid");
    document.getElementById("productCount").textContent = `${items.length} products found`;

    if (items.length === 0) {
        grid.innerHTML = '<div class="no-products">No products found. Try a different search.</div>';
        return;
    }

    grid.innerHTML = items.map(p => `
        <div class="product-card">
            <img class="product-image" src="${p.image_url || 'https://via.placeholder.com/400x300?text=Bag'}"
                 alt="${p.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Bag'">
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.description || ''}</p>
                <div class="product-price-row">
                    <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
                </div>
                <div class="product-actions">
                    <button class="btn-cart" onclick="addToCart(${p.id})">Add to Cart</button>
                    <button class="btn-order" onclick="openOrderModal(${p.id})">Buy Now</button>
                </div>
            </div>
        </div>
    `).join("");
}

function filterByCategory(category) {
    currentCategory = category;
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.category === category);
    });
    loadProducts();
}

function handleSearch() {
    currentSearch = document.getElementById("searchInput").value.trim();
    loadProducts();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("az_cart", JSON.stringify(cart));
    updateCartCount();
    showToast(`${product.name} added to cart!`, "success");
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cartCount").textContent = count;
}

function showCart() {
    const modal = document.getElementById("cartModal");
    const container = document.getElementById("cartItems");

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:20px;color:#757575;">Your cart is empty</p>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="order-product-info" style="margin-bottom:12px;">
                <img src="${item.image_url || 'https://via.placeholder.com/60'}" alt="${item.name}">
                <div style="flex:1;">
                    <strong>${item.name}</strong>
                    <p>₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</p>
                </div>
                <button class="btn-order btn-sm" onclick="openOrderModal(${item.id}); document.getElementById('cartModal').classList.remove('active');">
                    Order
                </button>
            </div>
        `).join("");
    }

    modal.classList.add("active");
}

function openOrderModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById("orderProductId").value = product.id;
    document.getElementById("orderProductInfo").innerHTML = `
        <img src="${product.image_url || 'https://via.placeholder.com/60'}" alt="${product.name}">
        <div>
            <strong>${product.name}</strong>
            <p style="color:#e65100;font-weight:700;">₹${product.price.toLocaleString('en-IN')}</p>
        </div>
    `;

    document.getElementById("orderForm").reset();
    document.getElementById("orderProductId").value = product.id;
    document.getElementById("orderModal").classList.add("active");
}

async function handleOrder(e) {
    e.preventDefault();

    const productId = parseInt(document.getElementById("orderProductId").value);
    const orderData = {
        product_id: productId,
        customer_name: document.getElementById("customerName").value.trim(),
        customer_phone: document.getElementById("customerPhone").value.trim(),
        customer_email: document.getElementById("customerEmail").value.trim(),
        address: document.getElementById("customerAddress").value.trim(),
        city: document.getElementById("customerCity").value.trim(),
        state: document.getElementById("customerState").value.trim(),
        pincode: document.getElementById("customerPincode").value.trim(),
        quantity: parseInt(document.getElementById("orderQuantity").value) || 1,
    };

    const submitBtn = e.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Order...";

    try {
        const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
        });

        const data = await res.json();

        if (res.ok) {
            cart = cart.filter(item => item.id !== productId);
            localStorage.setItem("az_cart", JSON.stringify(cart));
            updateCartCount();
            document.getElementById("orderModal").classList.remove("active");

            const emailStatus = data.email_sent
                ? "Owner has been notified by email."
                : "Order placed, but email notification failed. Check SMTP settings.";

            showToast(`Order #${data.order_id} placed successfully! ${emailStatus}`, "success");
        } else {
            showToast(data.error || "Order failed. Please try again.", "error");
        }
    } catch (err) {
        showToast("Network error. Please try again.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Order 🛍️";
    }
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove("show"), 4000);
}
