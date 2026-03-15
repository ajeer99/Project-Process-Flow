import prisma from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { AnalyticsReport } from './analytics-report';

export const dynamic = 'force-dynamic';

export default async function PrintAnalyticsReport({ 
    params,
    searchParams
}: { 
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const start = typeof resolvedSearchParams.start === 'string' ? resolvedSearchParams.start : undefined;
    const end = typeof resolvedSearchParams.end === 'string' ? resolvedSearchParams.end : undefined;

    const dateFilter: any = {};
    if (start || end) {
        const safeStart = start || end;
        const safeEnd = end || start;

        dateFilter.createdAt = {
            gte: new Date(`${safeStart}T00:00:00.000`),
            lte: new Date(`${safeEnd}T23:59:59.999`)
        };
    }
    
    // Fetch project with rich bug relations
    const project = await prisma.project.findUnique({
        where: { id: id },
        include: {
            bugs: {
                where: dateFilter,
                include: {
                    developer: true,
                    tester: true,
                    creator: true,
                    resolvedBy: true,
                    verifiedBy: true,
                },
                orderBy: { updatedAt: 'desc' }
            },
            modules: {
                include: {
                    bugs: {
                        where: dateFilter
                    }
                }
            },
            _count: {
                select: { modules: true, builds: true }
            }
        }
    });

    if (!project) {
        notFound();
    }

    return <AnalyticsReport project={project} />;
}
