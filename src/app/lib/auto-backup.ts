import prisma from '@/app/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function checkAndRunAutoBackup() {
    try {
        const settings = await prisma.appSettings.findFirst();
        if (!settings || !settings.autoBackupEnabled) return;

        const now = new Date();
        const lastBackup = settings.lastBackupDate;

        let shouldBackup = false;
        if (!lastBackup) {
            shouldBackup = true;
        } else {
            const hoursSinceLast = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);
            if (settings.backupFrequency === 'DAILY' && hoursSinceLast >= 24) shouldBackup = true;
            if (settings.backupFrequency === 'WEEKLY' && hoursSinceLast >= 168) shouldBackup = true;
            if (settings.backupFrequency === 'MONTHLY' && hoursSinceLast >= 720) shouldBackup = true;
        }

        if (!shouldBackup) return;

        // Perform full backup
        let exportData: any = { type: 'full_auto_backup', timestamp: now, version: '1.0' };
        exportData.appSettings = await prisma.appSettings.findMany();
        exportData.smtpSettings = await prisma.smtpSettings.findMany();
        exportData.users = await prisma.user.findMany();
        exportData.groups = await prisma.group.findMany();
        exportData.projects = await prisma.project.findMany();
        exportData.modules = await prisma.module.findMany();
        exportData.subModules = await prisma.subModule.findMany();
        exportData.builds = await prisma.build.findMany();
        exportData.assignmentFlows = await prisma.assignmentFlow.findMany();
        exportData.bugs = await prisma.bug.findMany();
        exportData.comments = await prisma.comment.findMany();

        const jsonString = JSON.stringify(exportData, null, 2);
        
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const fileName = `qa_portal_auto_backup_${now.toISOString().split('T')[0]}.json`;
        const filePath = path.join(backupDir, fileName);
        
        fs.writeFileSync(filePath, jsonString);

        // Update last backup date
        await prisma.appSettings.update({
            where: { id: settings.id },
            data: { lastBackupDate: now }
        });

        console.log(`[Auto-Backup] Successfully created ${fileName}`);

    } catch (e) {
        console.error("[Auto-Backup] Failed to run automated backup task:", e);
    }
}
