import EditUserForm from './edit-form';
import { notFound } from 'next/navigation';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await prisma.user.findUnique({
        where: { id },
    });

    if (!user) {
        notFound();
    }

    // Pass necessary non-sensitive fields to the client component
    const plainUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    return <EditUserForm user={plainUser} />;
}
