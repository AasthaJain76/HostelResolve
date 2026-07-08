import { sendEmail } from "../utils/sendEmail.js";

export const testMail = async (req, res) => {
    await sendEmail(
        req.user.email,
        "Complaint Registered",
        `
        <h2>Complaint Registered Successfully</h2>
        <p>Your complaint has been received.</p>
        `
    );

    res.status(200).json({
        success: true,
        message: "Email sent",
    });
};