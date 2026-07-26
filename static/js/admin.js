let adminPassword = sessionStorage.getItem("az_admin_pass") || "";

document.addEventListener("DOMContentLoaded", () => {
    if (adminPassword) {
        showDashboard();
    }

    document.getElementById("loginForm").addEventListener("submit", handleLogin);
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
    document.getElementById("productForm").addEventListener("submit", handleProductSubmit);
    document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

    document.querySelectorAll(".sidebar-btn[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
});

function handleLogin(e) {
    e.preventDefault();
    adminPassword = document.getElementById("adminPassword").value;
    sessionStorage.setItem("az_admin_pass", adminPassword);
    showDashboard();
}

function handleLogout() {
    adminPassword = "";
    sessionStorage.removeItem("az_admin_pass");
    document.getElementById("adminDashboard").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("adminPassword").value = "";
}

function showDashboard() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
    loadProducts();
    loadOrders();
}

function switchTab(tab) {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".sidebar-btn[data-tab]").forEach(b => b.classList.remove("active"));

    document.getElementById(`tab-${tab}`).classList.add("active");
    document.querySelector(`[data-tab="${tab}"]`).classList.add("active");

    if (tab === "products") loadProducts();
    if (tab === "orders") loadOrders();
}

async function loadProducts() {
    const tbody = document.getElementById("productsTableBody");
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';

    try {
        const res = await fetch("/api/products");
        const products = await res.json();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">No products yet. Add your first product!</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td><img class="table-img" src="${p.image_url || 'https://via.placeholder.com/48'}" alt="${p.name}"></td>
                <td><strong>${p.name}</strong><br><small style="color:#757575;">${(p.description || '').substring(0, 50)}...</small></td>
                <td>${p.category}</td>
                <td><strong>₹${p.price.toLocaleString('en-IN')}</strong></td>
                <td>${p.stock}</td>
                <td class="table-actions">
                    <button class="btn-edit" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Failed to load products</td></tr>';
    }
}

async function loadOrders() {
    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';

    try {
        const res = await fetch(`/api/orders?admin_password=${encodeURIComponent(adminPassword)}`);
        const data = await res.json();

        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">${data.error}</td></tr>`;
            return;
        }

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No orders yet.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(o => `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td>${o.product_name}<br><small>Qty: ${o.quantity} × ₹${o.product_price}</small></td>
                <td>${o.customer_name}<br><small>${o.customer_phone}</small></td>
                <td><small>${o.city}, ${o.state}<br>${o.pincode}</small></td>
                <td><strong>₹${o.total_amount.toLocaleString('en-IN')}</strong></td>
                <td><small>${new Date(o.created_at).toLocaleDateString('en-IN')}</small></td>
                <td><span class="status-badge status-pending">${o.status}</span></td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Failed to load orders</td></tr>';
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById("editProductId").value;
    const productData = {
        admin_password: adminPassword,
        name: document.getElementById("productName").value.trim(),
        price: parseFloat(document.getElementById("productPrice").value),
        category: document.getElementById("productCategory").value,
        stock: parseInt(document.getElementById("productStock").value) || 10,
        image_url: document.getElementById("productImage").value.trim(),
        description: document.getElementById("productDescription").value.trim(),
    };

    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productData),
        });

        const data = await res.json();

        if (res.ok) {
            showToast(editId ? "Product updated!" : "Product added successfully!", "success");
            resetForm();
            switchTab("products");
        } else {
            showToast(data.error || "Failed to save product", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    }
}

async function editProduct(id) {
    try {
        const res = await fetch(`/api/products/${id}`);
        const product = await res.json();

        document.getElementById("editProductId").value = product.id;
        document.getElementById("productName").value = product.name;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productCategory").value = product.category;
        document.getElementById("productStock").value = product.stock;
        document.getElementById("productImage").value = product.image_url || "";
        document.getElementById("productDescription").value = product.description || "";

        document.getElementById("formTitle").textContent = "Edit Product";
        document.getElementById("submitBtn").textContent = "Update Product";
        document.getElementById("cancelEditBtn").style.display = "inline-block";

        switchTab("add-product");
    } catch (err) {
        showToast("Failed to load product", "error");
    }
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const res = await fetch(`/api/products/${id}?admin_password=${encodeURIComponent(adminPassword)}`, {
            method: "DELETE",
        });

        if (res.ok) {
            showToast("Product deleted", "success");
            loadProducts();
        } else {
            const data = await res.json();
            showToast(data.error || "Delete failed", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    }
}

function resetForm() {
    document.getElementById("productForm").reset();
    document.getElementById("editProductId").value = "";
    document.getElementById("formTitle").textContent = "Add New Product";
    document.getElementById("submitBtn").textContent = "Save Product";
    document.getElementById("cancelEditBtn").style.display = "none";
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove("show"), 3000);
}
