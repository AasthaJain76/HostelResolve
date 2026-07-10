const getAccessToken = async () => {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID,
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
            grant_type: "refresh_token",
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Failed to refresh access token: ${JSON.stringify(data)}`);
    }
    return data.access_token;
};

const makeBody = (to, subject, html) => {
    const sender = process.env.EMAIL_USER || "resolvehub7499@gmail.com";
    const str = [
        `From: "ResolveHub" <${sender}>`,
        `To: ${to}`,
        `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        `Content-Transfer-Encoding: base64`,
        ``,
        Buffer.from(html).toString("base64"),
    ].join("\n");

    return Buffer.from(str)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

export const sendEmail = async (to, subject, html) => {
    try {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            console.error("Gmail API OAuth2 credentials are missing from environment variables");
            return;
        }

        const accessToken = await getAccessToken();
        const rawMessage = makeBody(to, subject, html);

        const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                raw: rawMessage,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`Email successfully sent to ${to} via Gmail API:`, data.id);
        } else {
            console.error("Gmail API send error:", data);
        }
    } catch (error) {
        console.error("Email sending failed via Gmail API:", error);
    }
};