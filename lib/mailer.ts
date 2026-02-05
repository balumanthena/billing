// lib/mailer.ts
import nodemailer from "nodemailer";

interface EmailProps {
    to: string;
    subject: string;
    body: string;
    filename?: string;
    pdfBuffer?: Buffer;
}

export async function sendEmail({
    to,
    subject,
    body,
    filename,
    pdfBuffer,
}: EmailProps) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.BACKUP_EMAIL, // Using same sender credentials
            pass: process.env.BACKUP_EMAIL_PASSWORD,
        },
    });

    const mailOptions: any = {
        from: `"Citrux Billing" <${process.env.BACKUP_EMAIL}>`,
        to,
        subject,
        text: body,
    };

    if (filename && pdfBuffer) {
        mailOptions.attachments = [
            {
                filename,
                content: pdfBuffer,
            },
        ];
    }

    await transporter.sendMail(mailOptions);
}

// Deprecated wrapper for backward compatibility if needed, or just update usages. 
// I will keep it for now but redirect logic.
export async function sendBackupEmail(props: Omit<EmailProps, 'to'>) {
    return sendEmail({ ...props, to: process.env.BACKUP_EMAIL! })
}
