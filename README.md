# AZ Enterprises - Premium Bags Store

Flipkart-style e-commerce website for bags with product management and email order notifications.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python (Flask)
- **Database:** SQLite (SQL)
- **Email:** Gmail SMTP

## Quick Start

### 1. Install Python dependencies

```bash
cd C:\Users\Admin\Projects\az-enterprises
pip install -r requirements.txt
```

### 2. Setup Email (Important!)

Order notifications ke liye Gmail App Password chahiye:

1. Google Account → Security → 2-Step Verification ON karein
2. App Passwords → "Mail" select karein → Password generate karein
3. `.env` file mein `SMTP_PASSWORD` mein woh password paste karein

### 3. Run the website locally

```bash
python app.py
```

Browser mein open karein: **http://localhost:5000**

## Hosting on GitHub + Render

GitHub par code bhej sakte ho, lekin Flask app run karne ke liye GitHub Pages nahi chalega. Uske liye ek Python host chahiye, jaise **Render**, **Railway**, ya **PythonAnywhere**.

### Publish source to GitHub

```bash
cd C:\Users\Admin\Projects\az-enterprises
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### Deploy with Render

1. Render.com par account banao
2. New Web Service select karo
3. GitHub repository connect karo
4. Build command: `pip install -r requirements.txt`
5. Start command: `python app.py`
6. Environment variables add karo:
   - `SMTP_EMAIL`
   - `SMTP_PASSWORD`
   - `NOTIFY_EMAIL`
   - `ADMIN_PASSWORD`
   - `SECRET_KEY`

Render ek public URL dogi, jise tum kisi ko bhi bhej sakte ho.

> Agar GitHub repo nahi bana hai, pehle `git init` aur push kar lo. Phir Render ya kisi aur host par deploy kar sakte ho.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Main store - bags browse & order |
| `/admin` | Admin panel - products add/edit/delete |

## Admin Login

- **URL:** http://localhost:5000/admin
- **Password:** `azadmin123` (`.env` se change kar sakte hain)

## Features

- Flipkart-style layout (bags theme)
- Product search & category filter
- Add to cart & Buy Now
- Order form with full address/location
- Email notification on every order to `shaikhnasir9320843@gmail.com`
- Admin panel to add products (name, price, description, image, category)

## Order Email Includes

- Product name, price, quantity, total
- Customer name, phone, email
- Full delivery location (address, city, state, pincode)
