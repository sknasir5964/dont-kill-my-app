import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "az_enterprises.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT DEFAULT 'General',
            image_url TEXT DEFAULT '',
            stock INTEGER DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            product_price REAL NOT NULL,
            quantity INTEGER DEFAULT 1,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_email TEXT,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pincode TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    count = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        sample_products = [
            ("Premium Leather Laptop Bag", "Stylish leather laptop bag with padded compartment for 15.6 inch laptop. Multiple pockets for accessories.", 1499, "Laptop Bags", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"),
            ("School Backpack Pro", "Durable school bag with water bottle holder, rain cover and ergonomic straps. Perfect for students.", 899, "School Bags", "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400"),
            ("Travel Duffle Bag", "Spacious travel duffle with wheels. Ideal for weekend trips and gym. Water resistant material.", 2199, "Travel Bags", "https://images.unsplash.com/photo-1547949003-9792fbf0c497?w=400"),
            ("Women's Handbag Classic", "Elegant handbag with gold chain strap. Premium PU leather finish with inner zip pocket.", 1299, "Handbags", "https://images.unsplash.com/photo-1584917865442-de89df76aedb?w=400"),
            ("Office Messenger Bag", "Professional messenger bag for office use. Fits laptop, documents and daily essentials.", 1799, "Office Bags", "https://images.unsplash.com/photo-1594223274512-ad480373942b?w=400"),
            ("Kids Cartoon Backpack", "Colorful cartoon themed backpack for kids. Lightweight and fun design with safety reflectors.", 599, "School Bags", "https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=400"),
        ]
        cursor.executemany(
            "INSERT INTO products (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)",
            sample_products,
        )

    conn.commit()
    conn.close()


def row_to_dict(row):
    if row is None:
        return None
    return dict(row)
