import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, subject, html, user, pass } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields: to, subject, html" });
    }

    const gmailUser = user || process.env.GMAIL_USER;
    const gmailPass = pass || process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return res.status(400).json({
        error: "Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel environment variables, or provide them in the request.",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"ScoutFlow AI" <${gmailUser}>`,
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: error.message || "Failed to send email" });
  }
}
