'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '../../../../auth';
import { createNotification } from './notification';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '@/app/lib/prisma';
// @ts-ignore - The new @google/genai SDK doesn't have official types published yet
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const execAsync = promisify(exec);

async function getClientDetails(requestHeaders: Headers): Promise<{ ip: string, mac: string }> {
    let ip = requestHeaders.get('x-real-ip') || 
             requestHeaders.get('x-forwarded-for')?.split(',')[0].trim() || 
             requestHeaders.get('cf-connecting-ip') ||
             requestHeaders.get('x-forwarded') ||
             '127.0.0.1';
    
    // Clean up IPv4 mapped IPv6 address
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    } else if (ip === '::1') {
        ip = '127.0.0.1';
    }

    let mac = 'N/A';
    if (ip !== '127.0.0.1' && ip !== '::1') {
        try {
            const { stdout } = await execAsync(`arp -a ${ip}`);
            const macMatch = stdout.match(/([a-fA-F0-9]{2}[:-]){5}([a-fA-F0-9]{2})/);
            if (macMatch) {
                mac = macMatch[0].replace(/-/g, ':').toUpperCase();
            } else {
                mac = 'Public Route';
            }
        } catch (e) {
            mac = 'Unknown/Public';
        }
    } else {
        mac = 'Localhost';
    }

    return { ip, mac };
}

const BugSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().nullable(),
    expectedResult: z.string().min(1, "Expected Result is required"),
    actualResult: z.string().min(1, "Actual Result is required"),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    status: z.enum(["OPEN", "IN_PROGRESS", "NEED_MORE_INFO", "FIXED", "READY_FOR_RETEST", "VERIFIED", "REOPENED"]),
    videoUrl: z.string().optional().nullable(),
    screenshotUrl: z.string().optional().nullable(),
    stepsToRepro: z.string().optional().nullable(),
    logs: z.string().optional().nullable(),
    environment: z.string().optional().nullable(),
    buildId: z.string().min(1, "Build is required"),
    moduleId: z.string().min(1, "Module is required"),
    subModuleId: z.string().optional().nullable(),
    assignTo: z.string().optional().nullable(), // Formatted as "type:id" e.g., "group:123" or "dev:456"
});
export async function createBug(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Unauthorized.' };
    }
    let screenshotUrl = formData.get('screenshotUrl') as string | null;
    const screenshotFile = formData.get('screenshot') as File | null;
    if (screenshotFile && screenshotFile.size > 0) {
        const buffer = Buffer.from(await screenshotFile.arrayBuffer());
        const fileName = `${Date.now()}-${screenshotFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        screenshotUrl = `/uploads/${fileName}`;
    }
    let videoUrl = formData.get('videoUrl') as string | null;
    const videoFile = formData.get('video') as File | null;
    if (videoFile && videoFile.size > 0) {
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const fileName = `${Date.now()}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        videoUrl = `/uploads/${fileName}`;
    }
        const validatedFields = BugSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description') || null,
        expectedResult: formData.get('expectedResult'),
        actualResult: formData.get('actualResult'),
        severity: formData.get('severity') || 'MEDIUM',
        status: 'OPEN', // Always open implicitly on creation
        videoUrl: videoUrl,
        screenshotUrl: screenshotUrl,
        stepsToRepro: formData.get('stepsToRepro') || null,
        logs: formData.get('logs') || null,
        environment: formData.get('environment') || null,
        buildId: formData.get('buildId'),
        moduleId: formData.get('moduleId'),
        subModuleId: formData.get('subModuleId') || null,
        assignTo: formData.get('assignTo') || null,
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Report Bug.',
        };
    }
    const data = validatedFields.data;
    
    // Parse assignment
    let manualDeveloperId = null;
    let manualDeveloperGroupId = null;

    if (data.assignTo) {
        const [type, id] = data.assignTo.split(':');
        if (type === 'dev') manualDeveloperId = id;
        if (type === 'group') manualDeveloperGroupId = id;
    }

    try {
        const module = await prisma.module.findUnique({
            where: { id: data.moduleId },
            select: { projectId: true }
        });
        if (!module) return { message: 'Invalid module ID' };

        // Auto-Routing: Check for active AssignmentFlow
        const flow = await prisma.assignmentFlow.findUnique({
            where: { projectId: module.projectId }
        });

        const assignedTesterGroupId = flow?.testerGroupId ?? null;
        // If there's a group, default testerId to null. Otherwise use flow testerId or reporter.
        const assignedTesterId = assignedTesterGroupId ? null : (flow?.testerId ?? session.user.id); 
        
        // Manual assignment overrides the flow
        const assignedDeveloperGroupId = manualDeveloperGroupId || flow?.developerGroupId || null;
        const assignedDeveloperId = manualDeveloperGroupId ? null : (manualDeveloperId || flow?.developerId || null);
        
        // Extract IP & MAC address
        const headersList = await headers();
        const clientIdentity = await getClientDetails(headersList);

        const newBug = await prisma.bug.create({
            data: {
                title: data.title,
                expectedResult: data.expectedResult,
                actualResult: data.actualResult,
                severity: data.severity,
                status: 'OPEN',
                videoUrl: data.videoUrl,
                screenshotUrl: data.screenshotUrl,
                stepsToRepro: data.stepsToRepro,
                logs: data.logs,
                environment: data.environment,
                buildId: data.buildId,
                moduleId: data.moduleId,
                subModuleId: data.subModuleId,
                projectId: module.projectId,
                description: data.description || null,
                creatorId: session.user.id,
                creatorIp: clientIdentity.ip,
                creatorMac: clientIdentity.mac,
                testerId: assignedTesterId,
                testerGroupId: assignedTesterGroupId,
                developerId: assignedDeveloperId,
                developerGroupId: assignedDeveloperGroupId,
            },
        });

        // Fire Notifications to Assigned Users automatically
        const notifyUsers = new Set<string>();
        if (assignedTesterId && assignedTesterId !== session.user.id) notifyUsers.add(assignedTesterId);
        if (assignedDeveloperId && assignedDeveloperId !== session.user.id) notifyUsers.add(assignedDeveloperId);

        if (assignedTesterGroupId || assignedDeveloperGroupId) {
            const groups = await prisma.group.findMany({
                where: { id: { in: [assignedTesterGroupId, assignedDeveloperGroupId].filter(Boolean) as string[] } },
                include: { users: true }
            });
            groups.forEach(g => g.users.forEach(u => {
                if (u.id !== session.user.id) notifyUsers.add(u.id);
            }));
        }

        if (notifyUsers.size > 0) {
            await createNotification(
                Array.from(notifyUsers), 
                "New Bug Assignment", 
                `You have been assigned to a new bug: "${data.title}"`, 
                `/admin/bugs/${newBug.id}`
            );
        }

    } catch (error) {
        console.error(error);
        return {
            message: 'Database Error: Failed to Report Bug.',
        };
    }
    revalidatePath('/admin/bugs');
    redirect('/admin/bugs');
}
export async function updateBugStatus(id: string, newStatus: string) {
    try {
        const oldBug = await prisma.bug.findUnique({ 
            where: { id }, 
            select: { status: true, resolvedAt: true, reopenCount: true, assignedAt: true, timeSpent: true, pmTimeSpent: true, devTimeSpent: true, testerTimeSpent: true, lastStatusUpdateAt: true } 
        });
        if (!oldBug) return { message: 'Bug not found.' };

        const session = await auth();
        if (!session?.user?.id) return { message: 'Unauthorized' };

        const dataToUpdate: any = { status: newStatus as any };
        const now = new Date();
        dataToUpdate.lastStatusUpdateAt = now;

        // Calculate time elapsed since last status update down to fractional minute precision
        const diffMs = now.getTime() - new Date(oldBug.lastStatusUpdateAt).getTime();
        const diffMins = diffMs / 1000 / 60;

        if (diffMins > 0) {
            let bucketed = false;
            // Bucket time based on the *old* status we are transitioning away from
            if (['OPEN', 'REOPENED', 'IN_PROGRESS', 'TESTING'].includes(oldBug.status)) {
                dataToUpdate.devTimeSpent = (oldBug.devTimeSpent || 0) + diffMins;
                bucketed = true;
            } else if (oldBug.status === 'READY_FOR_RETEST') {
                dataToUpdate.testerTimeSpent = (oldBug.testerTimeSpent || 0) + diffMins;
                bucketed = true;
            } else if (oldBug.status === 'NEED_MORE_INFO') {
                dataToUpdate.pmTimeSpent = (oldBug.pmTimeSpent || 0) + diffMins;
                bucketed = true;
            }

            if (!bucketed) {
                // Log legacy overall time spent if no bucket caught it
                dataToUpdate.timeSpent = (oldBug.timeSpent || 0) + diffMins;
            }
        }

        // Extract IP & MAC Address
        const headersList = await headers();
        const clientIdentity = await getClientDetails(headersList);

        // Handle Resolution and Completion Action Tracking
        if (['FIXED', 'READY_FOR_RETEST', 'VERIFIED'].includes(newStatus) && !['FIXED', 'READY_FOR_RETEST', 'VERIFIED'].includes(oldBug.status)) {
            dataToUpdate.resolvedAt = oldBug.resolvedAt || now;
            dataToUpdate.resolvedById = session.user.id;
            dataToUpdate.resolverIp = clientIdentity.ip;
            dataToUpdate.resolverMac = clientIdentity.mac;
        }
        if (newStatus === 'VERIFIED' && oldBug.status !== 'VERIFIED') {
            dataToUpdate.resolvedAt = oldBug.resolvedAt || now; // Make sure it has a resolved date as fallback
            dataToUpdate.verifiedById = session.user.id;
            dataToUpdate.verifierIp = clientIdentity.ip;
            dataToUpdate.verifierMac = clientIdentity.mac;
        }

        // Handle Reopen Count and Tracking Reset
        if (newStatus === 'REOPENED' && (oldBug.status === 'FIXED' || oldBug.status === 'VERIFIED')) {
            dataToUpdate.reopenCount = oldBug.reopenCount + 1;
            dataToUpdate.assignedAt = now; // optional legacy reset
        }

        await prisma.bug.update({
            where: { id },
            data: dataToUpdate,
        });
        // Trigger Notification
        const bug = await prisma.bug.findUnique({ 
            where: { id }, 
            select: { 
                title: true, 
                testerId: true, 
                developerId: true,
                testerGroup: { select: { users: { select: { id: true } } } },
                developerGroup: { select: { users: { select: { id: true } } } }
            } 
        });
        if (bug) {
            const notifyUsers: string[] = [];
            if (bug.testerId) notifyUsers.push(bug.testerId);
            if (bug.developerId) notifyUsers.push(bug.developerId);
            if (bug.testerGroup) bug.testerGroup.users.forEach((u: any) => notifyUsers.push(u.id));
            if (bug.developerGroup) bug.developerGroup.users.forEach((u: any) => notifyUsers.push(u.id));
            
            const session = await auth();
            const filteredUsers = Array.from(new Set(notifyUsers)).filter(uid => uid !== session?.user?.id);
            if (filteredUsers.length > 0) {
                await createNotification(filteredUsers, "Bug Status Changed", `Bug "${bug.title}" is now ${newStatus.replace(/_/g, ' ')}`, `/admin/bugs/${id}`);
            }
        }
        revalidatePath(`/admin/bugs/${id}`);
        revalidatePath(`/admin/bugs`);
        return { message: 'Status Updated.' };
    } catch (error) {
        console.error("updateBugStatus Error:", error);
        return { message: 'Database Error: Failed to update bug status.' };
    }
}
export async function assignBug(id: string, developerId: string | null, developerGroupId: string | null = null) {
    try {
        await prisma.bug.update({
            where: { id },
            data: {
                developerId: developerGroupId ? null : developerId,
                developerGroupId,
                assignedAt: (developerId || developerGroupId) ? new Date() : null, 
            },
        });
        
        const notifyUsers = new Set<string>();
        if (developerId) notifyUsers.add(developerId);
        if (developerGroupId) {
            const group = await prisma.group.findUnique({ where: { id: developerGroupId }, include: { users: true } });
            if (group) group.users.forEach(u => notifyUsers.add(u.id));
        }

        if (notifyUsers.size > 0) {
            const bug = await prisma.bug.findUnique({ where: { id }, select: { title: true } });
            if (bug) {
                await createNotification(Array.from(notifyUsers), "New Bug Assigned", `You were assigned to evaluate: ${bug.title}`, `/admin/bugs/${id}`);
            }
        }
        revalidatePath(`/admin/bugs/${id}`);
        revalidatePath(`/admin/bugs`);
        return { message: 'Bug Assigned.' };
    } catch (error) {
        console.error("Failed to assign bug", error);
        return { message: 'Database Error: Failed to assign bug.' };
    }
}
export async function assignTester(id: string, testerId: string | null, testerGroupId: string | null = null) {
    try {
        await prisma.bug.update({
            where: { id },
            data: { 
                testerId: testerGroupId ? null : testerId,
                testerGroupId
            },
        });
        
        const notifyUsers = new Set<string>();
        if (testerId) notifyUsers.add(testerId);
        if (testerGroupId) {
            const group = await prisma.group.findUnique({ where: { id: testerGroupId }, include: { users: true } });
            if (group) group.users.forEach(u => notifyUsers.add(u.id));
        }

        if (notifyUsers.size > 0) {
            const bug = await prisma.bug.findUnique({ where: { id }, select: { title: true } });
            if (bug) {
                await createNotification(Array.from(notifyUsers), "Bug Assigned for Testing", `You were assigned to test: ${bug.title}`, `/admin/bugs/${id}`);
            }
        }
        
        revalidatePath(`/admin/bugs/${id}`);
        revalidatePath(`/admin/bugs`);
        return { message: 'Tester Assigned.' };
    } catch (error) {
        console.error("Failed to assign tester", error);
        return { message: 'Database Error: Failed to assign tester.' };
    }
}
export async function toggleBugPin(id: string, currentPinStatus: boolean) {
    try {
        await prisma.bug.update({
            where: { id },
            data: { isPinned: !currentPinStatus }
        });
        revalidatePath(`/admin/bugs/${id}`);
        revalidatePath(`/admin/bugs`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Database Error' };
    }
}
export async function addComment(bugId: string, text: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    try {
        await prisma.comment.create({
            data: {
                text,
                bugId,
                userId: session.user.id
            }
        });
        const bug = await prisma.bug.findUnique({ 
            where: { id: bugId }, 
            select: { 
                title: true, 
                testerId: true, 
                developerId: true,
                testerGroup: { select: { users: { select: { id: true } } } },
                developerGroup: { select: { users: { select: { id: true } } } }
            } 
        });
        if (bug) {
            const notifyUsers: string[] = [];
            if (bug.testerId) notifyUsers.push(bug.testerId);
            if (bug.developerId) notifyUsers.push(bug.developerId);
            if (bug.testerGroup) bug.testerGroup.users.forEach((u: any) => notifyUsers.push(u.id));
            if (bug.developerGroup) bug.developerGroup.users.forEach((u: any) => notifyUsers.push(u.id));
            
            const filteredUsers = Array.from(new Set(notifyUsers)).filter(uid => uid !== session.user!.id);
            if (filteredUsers.length > 0) {
                await createNotification(filteredUsers, "New Comment", `New response on bug: ${bug.title}`, `/admin/bugs/${bugId}`);
            }
        }
        revalidatePath(`/admin/bugs/${bugId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to add comment", e);
        return { error: "Failed to add comment" };
    }
}
export async function togglePinComment(commentId: string, bugId: string, isPinned: boolean) {
    try {
        await prisma.comment.update({
            where: { id: commentId },
            data: { isPinned }
        });
        revalidatePath(`/admin/bugs/${bugId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to pin comment", e);
        return { error: "Failed to pin comment" };
    }
}

export async function findSimilarBugs(title: string, description: string, moduleId: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: 'AI integration is not configured (missing API Key).' };
    }

    try {
        // Fetch recent open bugs for this module
        const existingBugs = await prisma.bug.findMany({
            where: {
                moduleId: moduleId,
                status: { notIn: ['FIXED', 'VERIFIED'] }
            },
            select: {
                id: true,
                title: true,
                description: true
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        if (existingBugs.length === 0) {
            return { success: true, similarBugs: [] };
        }

        const prompt = `
        You are an AI assistant helping to detect duplicate software bugs.
        I am about to report a new bug. Here are the details:

        New Bug Title: "${title}"
        New Bug Description: "${description}"

        Here is a list of currently open bugs in this module:
        ${JSON.stringify(existingBugs.map(b => ({ id: b.id, title: b.title, desc: b.description })))}

        Analyze the newly proposed bug against the existing ones. Determine if any of the existing bugs are highly likely to be duplicates or addressing the exact same underlying issue.
        Return ONLY a JSON array of string IDs representing the existing bugs that are highly similar. If none are similar, return an empty array "[]". Do not include any other text or markdown block formatting.
        `;

        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const textResponse = response.text || "[]";
        
        let similarIds: string[] = [];
        try {
            similarIds = JSON.parse(textResponse.trim().replace(/^```json/, '').replace(/```$/, ''));
            if (!Array.isArray(similarIds)) similarIds = [];
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", textResponse);
        }

        if (similarIds.length > 0) {
            const similarBugDocs = existingBugs.filter(b => similarIds.includes(b.id));
            return { success: true, similarBugs: similarBugDocs };
        }

        return { success: true, similarBugs: [] };

    } catch (e: any) {
        console.error("Failed to find similar bugs with AI:", e);
        return { success: false, error: 'AI analysis failed.' };
    }
}

export async function logBugTime(bugId: string, minutesToAdd: number, bucket: 'pm' | 'dev' | 'tester' | 'total' = 'total') {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    if (!minutesToAdd || minutesToAdd <= 0) {
        return { error: "Invalid duration" };
    }

    try {
        const bug = await prisma.bug.findUnique({
            where: { id: bugId },
            select: { timeSpent: true, pmTimeSpent: true, devTimeSpent: true, testerTimeSpent: true }
        });

        if (!bug) return { error: "Bug not found" };

        const dataToUpdate: any = {};
        if (bucket === 'pm') {
            dataToUpdate.pmTimeSpent = (bug.pmTimeSpent || 0) + minutesToAdd;
        } else if (bucket === 'dev') {
            dataToUpdate.devTimeSpent = (bug.devTimeSpent || 0) + minutesToAdd;
        } else if (bucket === 'tester') {
            dataToUpdate.testerTimeSpent = (bug.testerTimeSpent || 0) + minutesToAdd;
        } else {
            // legacy catchall
            dataToUpdate.timeSpent = (bug.timeSpent || 0) + minutesToAdd;
        }

        await prisma.bug.update({
            where: { id: bugId },
            data: dataToUpdate
        });

        revalidatePath(`/admin/bugs/${bugId}`);
        revalidatePath(`/admin/reports/time-tracking`);
        revalidatePath(`/admin/reports/audit-log`);
        
        return { success: true };
    } catch (e) {
        console.error("Failed to log time:", e);
        return { error: "Database error occurred while logging time." };
    }
}
