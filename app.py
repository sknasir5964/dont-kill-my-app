import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from database import init_db, get_db, row_to_dict
from email_service import send_order_notification

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "az-enterprises-secret")
CORS(app)

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "azadmin123")

init_db()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/admin")
def admin():
    return render_template("admin.html")


@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category", "")
    search = request.args.get("search", "")

    conn = get_db()
    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)
    if search:
        query += " AND (name LIKE ? OR description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    return jsonify([row_to_dict(r) for r in rows])


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    product = row_to_dict(row)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product)


@app.route("/api/products", methods=["POST"])
def add_product():
    data = request.json
    password = data.get("admin_password", "")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Invalid admin password"}), 403

    name = data.get("name", "").strip()
    price = data.get("price", 0)
    description = data.get("description", "").strip()
    category = data.get("category", "General").strip()
    image_url = data.get("image_url", "").strip()
    stock = data.get("stock", 10)

    if not name or not price:
        return jsonify({"error": "Name and price are required"}), 400

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)",
        (name, description, float(price), category, image_url, int(stock)),
    )
    product_id = cursor.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()

    return jsonify(row_to_dict(row)), 201


@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.json
    if data.get("admin_password", "") != ADMIN_PASSWORD:
        return jsonify({"error": "Invalid admin password"}), 403

    conn = get_db()
    existing = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    conn.execute(
        """UPDATE products SET name=?, description=?, price=?, category=?, image_url=?, stock=?
           WHERE id=?""",
        (
            data.get("name", existing["name"]),
            data.get("description", existing["description"]),
            float(data.get("price", existing["price"])),
            data.get("category", existing["category"]),
            data.get("image_url", existing["image_url"]),
            int(data.get("stock", existing["stock"])),
            product_id,
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row))


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    password = request.args.get("admin_password", "")
    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Invalid admin password"}), 403

    conn = get_db()
    conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Product deleted"})


@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db()
    rows = conn.execute("SELECT DISTINCT category FROM products ORDER BY category").fetchall()
    conn.close()
    return jsonify([r["category"] for r in rows])


@app.route("/api/orders", methods=["POST"])
def place_order():
    data = request.json

    required = ["product_id", "customer_name", "customer_phone", "address", "city", "state", "pincode"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    conn = get_db()
    product = conn.execute("SELECT * FROM products WHERE id = ?", (data["product_id"],)).fetchone()
    if not product:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    quantity = int(data.get("quantity", 1))
    total = product["price"] * quantity

    cursor = conn.execute(
        """INSERT INTO orders
           (product_id, product_name, product_price, quantity, customer_name, customer_phone,
            customer_email, address, city, state, pincode, total_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            product["id"],
            product["name"],
            product["price"],
            quantity,
            data["customer_name"],
            data["customer_phone"],
            data.get("customer_email", ""),
            data["address"],
            data["city"],
            data["state"],
            data["pincode"],
            total,
        ),
    )
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()

    order_data = {
        "order_id": order_id,
        "product_name": product["name"],
        "product_price": product["price"],
        "quantity": quantity,
        "total_amount": total,
        "customer_name": data["customer_name"],
        "customer_phone": data["customer_phone"],
        "customer_email": data.get("customer_email", ""),
        "address": data["address"],
        "city": data["city"],
        "state": data["state"],
        "pincode": data["pincode"],
    }

    email_sent = send_order_notification(order_data)

    return jsonify({
        "message": "Order placed successfully!",
        "order_id": order_id,
        "email_sent": email_sent,
    }), 201


@app.route("/api/orders", methods=["GET"])
def get_orders():
    password = request.args.get("admin_password", "")
    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Invalid admin password"}), 403

    conn = get_db()
    rows = conn.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


if __name__ == "__main__":
    app.run(debug=True, port=5000)
