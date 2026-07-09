export const sendEmail = async (to, subject, html) => {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error("Resend API Key is missing");
            return;
        }

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: "ResolveHub <onboarding@resend.dev>",
                to: [to],
                subject: subject,
                html: html
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("Email sent successfully via Resend API:", data.id);
        } else {
            console.error("Resend API error:", data);
        }
    } catch (error) {
        console.error("Email sending failed via Resend API:", error);
    }
};