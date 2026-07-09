export const sendEmail = async (to, subject, html) => {
    try {
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || "aasthajain7499@gmail.com";

        if (!apiKey) {
            console.error("Brevo API Key is missing");
            return;
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: "ResolveHub", email: senderEmail },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`Email successfully sent to ${to} via Brevo API:`, data.messageId);
        } else {
            console.error("Brevo API error:", data);
        }
    } catch (error) {
        console.error("Email sending failed via Brevo API:", error);
    }
};