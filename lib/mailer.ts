// lib/mailer.ts
import nodemailer from "nodemailer";

interface BackupEmailProps {
    subject: string;
    body: string;
    filename?: string;
    pdfBuffer?: Buffer;
}

export async function sendBackupEmail({
    subject,
    body,
    filename,
    pdfBuffer,
}: BackupEmailProps) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.BACKUP_EMAIL,
            pass: process.env.BACKUP_EMAIL_PASSWORD,
        },
    });

    const mailOptions: any = {
        from: `"Citrux Billing Backup" <${process.env.BACKUP_EMAIL}>`,
        to: process.env.BACKUP_EMAIL,
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
