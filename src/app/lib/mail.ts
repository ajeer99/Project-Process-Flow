import nodemailer from 'nodemailer';
import prisma from './prisma';

export function getStandardEmailTemplate(appName: string, title: string, contentHtml: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background: #4f46e5; padding: 30px 40px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px; }
            .footer { background: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { color: #64748b; font-size: 13px; margin: 0; }
            .button { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${appName}</h1>
            </div>
            <div class="content">
                <h2 style="color: #1e293b; font-size: 20px; margin-top: 0;">${title}</h2>
                ${contentHtml}
            </div>
            <div class="footer">
                <p>This is an automated message from ${appName}. Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

export async function sendMail({ to, subject, html }: { to: string, subject: string, html: string }) {
    try {
        const settings = await prisma.smtpSettings.findFirst();
        if (!settings) {
            console.warn('Cannot send email: SMTP settings not configured.');
            return { success: false, error: 'SMTP settings not configured' };
        }

        const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.port === 465, // true for 465, false for other ports
            auth: {
                user: settings.user,
                pass: settings.password,
            },
        });

        // Verify connection before sending
        await transporter.verify();

        const appSettings = await prisma.appSettings.findFirst();
        const appName = appSettings?.appName || "QA Portal";

        const formattedHtml = getStandardEmailTemplate(appName, subject, html);

        const info = await transporter.sendMail({
            from: `"${appName}" <${settings.fromEmail}>`,
            to,
            subject,
            html: formattedHtml,
        });

        console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        
        await prisma.emailLog.create({
            data: {
                to,
                subject,
                body: html,
                status: 'SENT'
            }
        });

        return { success: true, messageId: info.messageId };

    } catch (error: any) {
        console.error('Error sending email:', error);
        
        try {
            await prisma.emailLog.create({
                data: {
                    to,
                    subject,
                    body: html,
                    status: 'FAILED',
                    error: error.message
                }
            });
        } catch (logError) {
            console.error('Also failed to log the email error', logError);
        }

        return { success: false, error: error.message };
    }
}
