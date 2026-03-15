'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/app/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function getAppSettings() {
    try {
        let settings = await prisma.appSettings.findFirst();
        if (!settings) {
            settings = await prisma.appSettings.create({
                data: { appName: "QA Portal" }
            });
        }
        return { success: true, settings };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function uploadAppAsset(formData: FormData) {
    try {
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string; // 'logo' or 'icon'
        
        if (!file || file.size === 0) return { error: "No file provided" };
        if (type !== 'logo' && type !== 'icon') return { error: "Invalid type" };

        if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'].includes(file.type)) {
            return { error: "File must be an image (PNG, JPG, SVG, ICO)" };
        }

        if (file.size > 5 * 1024 * 1024) {
            return { error: "File size must be less than 5MB" };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split('.').pop();
        const fileName = `app-${type}-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'system');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const assetUrl = `/uploads/system/${fileName}`;

        let settings = await prisma.appSettings.findFirst();
        if (!settings) {
            settings = await prisma.appSettings.create({ data: { appName: "QA Portal" } });
        }

        await prisma.appSettings.update({
            where: { id: settings.id },
            data: type === 'logo' ? { logoUrl: assetUrl } : { iconUrl: assetUrl }
        });

        // Revalidate layout globally so any layout.tsx fetching it updates
        revalidatePath('/', 'layout');
        return { success: true, url: assetUrl };
    } catch (e: any) {
        console.error("Failed to upload app asset", e);
        return { error: "Failed to upload file." };
    }
}

export async function updateAppName(name: string) {
    try {
        let settings = await prisma.appSettings.findFirst();
        if (!settings) {
            settings = await prisma.appSettings.create({ data: { appName: name } });
        } else {
            await prisma.appSettings.update({
                where: { id: settings.id },
                data: { appName: name }
            });
        }
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateAutoBackup(enabled: boolean, frequency: string) {
    try {
        let settings = await prisma.appSettings.findFirst();
        if (!settings) {
            settings = await prisma.appSettings.create({ 
                data: { autoBackupEnabled: enabled, backupFrequency: frequency } 
            });
        } else {
            await prisma.appSettings.update({
                where: { id: settings.id },
                data: { autoBackupEnabled: enabled, backupFrequency: frequency }
            });
        }
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
