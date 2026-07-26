import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def send_order_notification(order_data):
    smtp_email = os.getenv("SMTP_EMAIL", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    notify_email = os.getenv("NOTIFY_EMAIL", "shaikhnasir9320843@gmail.com")

    if not smtp_email or not smtp_password:
        print("[EMAIL] SMTP credentials not configured. Order saved but email not sent.")
        print(f"[EMAIL] Would notify {notify_email} about order from {order_data.get('customer_name')}")
        return False

    subject = f"🛍️ New Order - AZ Enterprises | {order_data['product_name']}"

    body = f"""
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1a5f4a; color: white; padding: 20px; text-align: center;">
        <h1>AZ Enterprises</h1>
        <p>New Order Received!</p>
    </div>
    <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #1a5f4a;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Product:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{order_data['product_name']}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Price:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹{order_data['product_price']}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Quantity:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{order_data['quantity']}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #e65100; font-weight: bold;">₹{order_data['total_amount']}</td></tr>
        </table>

        <h2 style="color: #1a5f4a; margin-top: 20px;">Customer Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{order_data['customer_name']}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{order_data['customer_phone']}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{order_data.get('customer_email', 'N/A')}</td></tr>
        </table>

        <h2 style="color: #1a5f4a; margin-top: 20px;">📍 Delivery Location</h2>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #e65100;">
            <p><strong>Address:</strong> {order_data['address']}</p>
            <p><strong>City:</strong> {order_data['city']}</p>
            <p><strong>State:</strong> {order_data['state']}</p>
            <p><strong>Pincode:</strong> {order_data['pincode']}</p>
            <p><strong>Full Location:</strong> {order_data['address']}, {order_data['city']}, {order_data['state']} - {order_data['pincode']}</p>
        </div>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Order placed at: {datetime.now().strftime('%d/%m/%Y %I:%M %p')}
        </p>
    </div>
    <div style="background: #1a5f4a; color: white; padding: 10px; text-align: center; font-size: 12px;">
        AZ Enterprises - Premium Bags Store
    </div>
</body>
</html>
"""

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_email
        msg["To"] = notify_email
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, notify_email, msg.as_string())

        print(f"[EMAIL] Order notification sent to {notify_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send email: {e}")
        return False
