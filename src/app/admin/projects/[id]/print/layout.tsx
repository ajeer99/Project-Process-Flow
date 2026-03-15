import { auth } from '../../../../../../auth';
import { notFound } from 'next/navigation';

export default async function PrintLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        notFound();
    }

    return (
        <div className="bg-white text-black min-h-screen font-sans print:bg-white print:text-black">
            {children}
        </div>
    );
}
