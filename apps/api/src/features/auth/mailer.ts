import nodemailer from "nodemailer";

export async function sendAccountEmail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM,
    NODE_ENV,
  } = process.env;
  if (SMTP_HOST && SMTP_PORT && SMTP_FROM) {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({
      from: SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return;
  }
  if (NODE_ENV === "production")
    throw new Error("Email delivery is not configured");
  console.info(
    `[development email] to=${input.to} subject=${input.subject}\n${input.text}`,
  );
}
