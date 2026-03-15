'use server';

import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';
import { auth } from '../../../../auth';
import prisma from '@/app/lib/prisma';

export async function getSmtpSettings() {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        const settings = await prisma.smtpSettings.findFirst();
        return { success: true, settings };
    } catch (e) {
        return { success: false, error: "Failed to fetch settings" };
    }
}

export async function saveSmtpSettings(data: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
}) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        const existing = await prisma.smtpSettings.findFirst();
        if (existing) {
            await prisma.smtpSettings.update({
                where: { id: existing.id },
                data: {
                    host: data.host,
                    port: data.port,
                    user: data.user,
                    password: data.pass,
                    fromEmail: data.fromEmail,
                }
            });
        } else {
            await prisma.smtpSettings.create({
                data: {
                    host: data.host,
                    port: data.port,
                    user: data.user,
                    password: data.pass,
                    fromEmail: data.fromEmail,
                }
            });
        }
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Database error saving settings" };
    }
}

export async function testSmtpConnection(testEmailAddress: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        const settings = await prisma.smtpSettings.findFirst();
        if (!settings) return { success: false, error: "SMTP settings not configured." };

        const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.port === 465,
            auth: {
                user: settings.user,
                pass: settings.password,
            },
        });

        // Verify connection configuration
        await transporter.verify();

        // Send test email
        await transporter.sendMail({
            from: `"${settings.fromEmail}" <${settings.fromEmail}>`,
            to: testEmailAddress,
            subject: "Platform Test Email",
            text: "If you are receiving this, your SMTP settings are working correctly.",
            html: "<b>If you are receiving this, your SMTP settings are working correctly.</b>",
        });

        return { success: true };
    } catch (e: any) {
        console.error("SMTP Test Failed:", e);
        return { success: false, error: e.message || "Failed to send test email." };
    }
}
