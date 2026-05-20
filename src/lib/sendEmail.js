import nodemailer from 'nodemailer';

// Generate SMTP Transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL, // Your Gmail address (e.g. your.email@gmail.com)
        pass: process.env.SMTP_PASSWORD // Your 16-digit App Password
    }
});

/**
 * Sends an Order Confirmation Email to the user
 * @param {string} userEmail - The customer's email address
 * @param {string} userName - The customer's name
 * @param {object} order - The created MongoDB order object
 */
export async function sendOrderConfirmationEmail(userEmail, userName, order) {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.warn("Email service is not configured. Missing SMTP_EMAIL and SMTP_PASSWORD in env.");
        return false;
    }

    try {
        const orderId = order._id.toString().slice(-6).toUpperCase();
        
        // Build items HTML table
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>${item.name}</strong><br>
                    <small>Qty: ${item.quantity}</small>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    ₹${(item.price * item.quantity).toLocaleString()}
                </td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"Shopable Store" <${process.env.SMTP_EMAIL}>`,
            to: userEmail,
            subject: `Order Confirmed! Your Order #${orderId} has been placed.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="text-align: center; padding: 20px 0; background-color: #0f766e; color: white;">
                        <h1 style="margin: 0;">Order Confirmed! 🎉</h1>
                    </div>
                    
                    <div style="padding: 20px;">
                        <p>Hi <strong>${userName}</strong>,</p>
                        <p>Thank you for shopping with Shopable! We've received your order and are getting it ready to be shipped.</p>
                        
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Summary (#${orderId})</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                ${itemsHtml}
                                <tr>
                                    <td style="padding: 10px; font-weight: bold;">Subtotal</td>
                                    <td style="padding: 10px; text-align: right;">₹${order.subtotal?.toLocaleString() || order.total.toLocaleString()}</td>
                                </tr>
                                ${order.discountAmount > 0 ? `
                                <tr>
                                    <td style="padding: 10px; color: #16a34a;">Discount</td>
                                    <td style="padding: 10px; text-align: right; color: #16a34a;">-₹${order.discountAmount.toLocaleString()}</td>
                                </tr> 
                                ` : ''}
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; font-size: 16px; border-top: 2px solid #ddd;">Total Paid</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #ddd;">
                                        ₹${order.total.toLocaleString()}
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin: 20px 0;">
                            <h3>Shipping Address</h3>
                            <p style="color: #555; background: #eee; padding: 10px; border-radius: 5px;">
                                ${order.shippingAddress.name}<br>
                                ${order.shippingAddress.street},<br>
                                ${order.shippingAddress.city} - ${order.shippingAddress.pincode}<br>
                                Phone: ${order.shippingAddress.phone}
                            </p>
                        </div>
                        
                        <p>You can track your order status in your <a href="https://${process.env.VERCEL_URL || 'my-dreem.vercel.app'}/account/orders" style="color: #0f766e; font-weight: bold;">Account Dashboard</a>.</p>
                        
                        <p>Best Regards,<br><strong>The Shopable Team</strong></p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("Order confirmation email sent successfully:", result.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send order confirmation email:", error);
        return false;
    }
}
