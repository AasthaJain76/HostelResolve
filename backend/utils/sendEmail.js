import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // port 587 uses STARTTLS (secure upgrade)
    // Force IPv4 to prevent connection timeouts on cloud routing (like Koyeb/Render)
    family: 4, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, html) => {
    try {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailUser || !emailPass) {
            console.error("Gmail credentials are missing from environment variables");
            return;
        }

        await transporter.sendMail({
            from: `"ResolveHub" <${emailUser}>`,
            to,
            subject,
            html,
        });

        console.log(`Email successfully sent to ${to} via Gmail SMTP`);
    } catch (error) {
        console.error("Email sending failed via Gmail SMTP:", error);
    }
};