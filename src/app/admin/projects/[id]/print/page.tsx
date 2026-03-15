import prisma from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintableReport } from './printable-report';

export default async function PrintProjectReport({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Fetch project with rich bug relations
    const project = await prisma.project.findUnique({
        where: { id: id },
        include: {
            bugs: {
                include: {
                    developer: true,
                    tester: true,
                    creator: true,
                    resolvedBy: true,
                    verifiedBy: true,
                },
                orderBy: { updatedAt: 'desc' }
            },
            _count: {
                select: { modules: true, builds: true }
            }
        }
    });

    if (!project) {
        notFound();
    }

    return <PrintableReport project={project} />;
}
