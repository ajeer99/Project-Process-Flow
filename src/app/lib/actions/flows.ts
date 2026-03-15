'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';

export async function createAssignmentFlow(prevState: any, formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { message: 'Unauthorized' };

    const projectId = formData.get('projectId') as string;
    const devRaw = formData.get('developerId') as string;
    const testerRaw = formData.get('testerId') as string;

    const developerId = devRaw?.startsWith('user:') ? devRaw.split(':')[1] : (devRaw?.startsWith('group:') ? null : devRaw);
    const developerGroupId = devRaw?.startsWith('group:') ? devRaw.split(':')[1] : (formData.get('developerGroupId') as string);
    
    const testerId = testerRaw?.startsWith('user:') ? testerRaw.split(':')[1] : (testerRaw?.startsWith('group:') ? null : testerRaw);
    const testerGroupId = testerRaw?.startsWith('group:') ? testerRaw.split(':')[1] : (formData.get('testerGroupId') as string);

    if (!projectId) {
        return { message: 'Project ID is required.' };
    }

    try {
        await prisma.assignmentFlow.upsert({
            where: { projectId },
            update: { 
                developerId: developerId || null, 
                testerId: testerId || null, 
                developerGroupId: developerGroupId || null, 
                testerGroupId: testerGroupId || null 
            },
            create: { 
                projectId, 
                developerId: developerId || null, 
                testerId: testerId || null, 
                developerGroupId: developerGroupId || null, 
                testerGroupId: testerGroupId || null 
            }
        });

        // Update existing active bugs in this project to reflect the new workflow
        await prisma.bug.updateMany({
            where: {
                projectId,
                status: {
                    in: ['OPEN', 'REOPENED', 'IN_PROGRESS', 'NEED_MORE_INFO', 'READY_FOR_RETEST']
                }
            },
            data: {
                developerId: developerId || null,
                testerId: testerId || null,
                developerGroupId: developerGroupId || null,
                testerGroupId: testerGroupId || null
            }
        });
        
        revalidatePath('/admin/settings');
        return { success: true, message: 'Assignment Flow saved successfully.' };
    } catch (e) {
        return { message: 'Failed to create Assignment Flow.' };
    }
}

export async function deleteAssignmentFlow(flowId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        await prisma.assignmentFlow.delete({ where: { id: flowId } });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        return { message: 'Failed to delete flow.' };
    }
}

export async function manageProjectAssignmentFlow(projectId: string, developerId: string | null, testerId: string | null, developerGroupId: string | null = null, testerGroupId: string | null = null) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { managerId: true }
    });

    if (!project) return { error: 'Project not found' };

    const isAdmin = (session.user as any).role === 'ADMIN';
    const isManager = (session.user as any).role === 'PROJECT_MANAGER' && project.managerId === session.user.id;

    if (!isAdmin && !isManager) {
        return { error: 'You do not have permission to modify this projects assignment setup.' };
    }

    try {
        if (!developerId && !testerId && !developerGroupId && !testerGroupId) {
            // If all are missing, we clear the flow and stop auto-routing
            await prisma.assignmentFlow.deleteMany({ where: { projectId } });
            revalidatePath(`/admin/projects/${projectId}`);
            return { success: true, message: 'Auto-assignment disabled' };
        }

        // Set the active flow
        await prisma.assignmentFlow.upsert({
            where: { projectId },
            update: { developerId, testerId, developerGroupId, testerGroupId },
            create: { projectId, developerId, testerId, developerGroupId, testerGroupId }
        });

        // Update active bugs
        await prisma.bug.updateMany({
            where: {
                projectId,
                status: {
                    in: ['OPEN', 'REOPENED', 'IN_PROGRESS', 'NEED_MORE_INFO', 'READY_FOR_RETEST']
                }
            },
            data: {
                developerId,
                testerId,
                developerGroupId,
                testerGroupId
            }
        });

        revalidatePath(`/admin/projects/${projectId}`);
        return { success: true, message: 'Auto-assignment flow configured' };

    } catch (e) {
        return { error: 'Operation failed' };
    }
}
