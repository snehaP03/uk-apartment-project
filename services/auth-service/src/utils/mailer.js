const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendVerificationEmail(toEmail, code) {
    const mailOptions = {
        from: `"Apartment UK" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Verify Your Email - Apartment UK",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #1e293b; margin-bottom: 8px;">Verify Your Email</h2>
                <p style="color: #475569; font-size: 15px;">
                    Thank you for registering with Apartment UK. Use the code below to verify your email address:
                </p>
                <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2563eb;">${code}</span>
                </div>
                <p style="color: #475569; font-size: 13px;">
                    This code expires in <strong>15 minutes</strong>. If you did not create an account, please ignore this email.
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
