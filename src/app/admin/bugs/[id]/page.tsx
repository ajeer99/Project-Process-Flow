import Link from 'next/link';
import { ArrowLeft, User, Calendar, ExternalLink, Activity } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { cn } from '../../../lib/utils';
import StatusUpdater from './status-updater';
import BugAssignmentDropdown from './bug-assignment-dropdown';
import TesterAssignmentDropdown from './tester-assignment-dropdown';
import BugComments from './bug-comments';
import ScheduleMeeting from './schedule-meeting';
import LogTime from './log-time';
import { BugPinButton } from '../../../components/bug-pin-button';
import { UserAvatar } from '../../components/user-avatar';
import { MediaPreview } from '../../components/media-preview';
import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';

const statusColors = {
    OPEN: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    NEED_MORE_INFO: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    FIXED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    READY_FOR_RETEST: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20",
    VERIFIED: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
    REOPENED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
};
const severityColors = {
    CRITICAL: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
    HIGH: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
    MEDIUM: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
    LOW: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10",
};
type Props = {
    params: Promise<{ id: string }>
}
export default async function BugDetailsPage({ params }: Props) {
    const session = await auth();
    if (!session?.user) redirect('/login');
    const { id } = await params;
    const [bug, developers, testers, groups] = await Promise.all([
        prisma.bug.findUnique({
            where: { id },
            include: {
                module: { select: { name: true, project: { select: { name: true } } } },
                build: { select: { version: true } },
                tester: { select: { name: true, email: true, avatarUrl: true } },
                developer: { select: { name: true, email: true, avatarUrl: true } },
                testerGroup: { select: { name: true } },
                developerGroup: { select: { name: true } },

                comments: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'asc' } },
            }
        }),
        prisma.user.findMany({
            where: { role: { in: ['DEVELOPER', 'PROJECT_MANAGER'] } },
            select: { id: true, name: true, email: true }
        }),
        prisma.user.findMany({
            where: { role: { in: ['TESTER', 'PROJECT_MANAGER'] } },
            select: { id: true, name: true, email: true }
        }),
        prisma.group.findMany({
            select: { id: true, name: true, type: true }
        })
    ]);
    if (!bug) {
        notFound();
    }
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header / Breadcrumb navigation */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/bugs"
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{bug.module.project.name}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{bug.module.name}</span>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title and Badges */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={cn(
                                "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset uppercase tracking-wide",
                                statusColors[bug.status as keyof typeof statusColors] || "bg-slate-50 text-slate-600 ring-slate-500/10"
                            )}>
                                {bug.status.replace(/_/g, ' ')}
                            </span>
                            <span className={cn(
                                "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                                severityColors[bug.severity as keyof typeof severityColors] || "bg-slate-50 text-slate-600"
                            )}>
                                {bug.severity} PRIORITY
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                                {bug.title}
                            </h1>
                            <div className="flex items-center gap-2">
                                <BugPinButton bugId={bug.id} initialPinned={bug.isPinned} />
                                <ScheduleMeeting 
                                    bugId={bug.id} 
                                    bugTitle={bug.title} 
                                    projectName={bug.module.project.name}
                                    testerEmail={bug.tester?.email || ''}
                                    developerEmail={bug.developer?.email}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="flex items-center gap-2">
                                {bug.tester ? (
                                    <>
                                        <UserAvatar src={(bug.tester as any).avatarUrl} name={bug.tester.name} email={bug.tester.email} size={18} />
                                        Reported by <strong className="text-slate-700 dark:text-slate-300">{bug.tester.name || bug.tester.email.split('@')[0]}</strong>
                                    </>
                                ) : (
                                    <>
                                        <div><span className="text-emerald-500 font-bold">Group:</span> {bug.testerGroup?.name}</div>
                                    </>
                                )}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(bug.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    {/* Detailed Descriptions */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                Description
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                                <p className="whitespace-pre-wrap">{bug.description}</p>
                            </div>
                        </section>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Expected Result</h3>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{bug.expectedResult}</p>
                            </section>
                            <section>
                                <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3">Actual Result</h3>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{bug.actualResult}</p>
                            </section>
                        </div>
                        {bug.stepsToRepro && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Steps to Reproduce</h3>
                                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                                    {bug.stepsToRepro}
                                </div>
                            </section>
                        )}
                    </div>
                    {/* Chat and Note Pinning */}
                    <BugComments 
                        bugId={bug.id} 
                        comments={bug.comments as any} 
                        currentUserId={session.user.id!} 
                        currentUserRole={(session.user as any).role} 
                    />
                </div>
                {/* Sidebar Attributes */}
                <div className="space-y-6">
                    {/* Workflow Actions */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            Workflow Actions
                        </h3>
                        <StatusUpdater 
                            bugId={bug.id} 
                            currentStatus={bug.status} 
                            userRole={(session.user as any).role} 
                            currentUserId={session.user.id!} 
                            developerId={bug.developerId} 
                            testerId={bug.testerId} 
                        />
                    </div>
                    
                    {/* Time Tracking Input */}
                    <LogTime 
                        bugId={bug.id} 
                        currentTotalMins={bug.timeSpent} 
                        pmTimeSpent={bug.pmTimeSpent}
                        devTimeSpent={bug.devTimeSpent}
                        testerTimeSpent={bug.testerTimeSpent}
                        userRole={(session.user as any).role} 
                    />

                    {/* Details Sidebar */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            Properties
                        </h3>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="text-slate-500 dark:text-slate-400 font-medium">Target Build</dt>
                                <dd className="mt-1 font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-base">v{bug.build.version}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 dark:text-slate-400 font-medium mb-1.5">Assigned Developer</dt>
                                <dd>
                                    <BugAssignmentDropdown 
                                        bugId={bug.id} 
                                        currentAssigneeId={bug.developerId}
                                        currentGroupId={bug.developerGroupId}
                                        developers={developers}
                                        groups={groups}
                                        userRole={(session.user as any).role}
                                    />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 dark:text-slate-400 font-medium mb-1.5">Assigned QA Tester</dt>
                                <dd>
                                    <TesterAssignmentDropdown 
                                        bugId={bug.id} 
                                        currentTesterId={bug.testerId}
                                        currentGroupId={bug.testerGroupId}
                                        testers={testers}
                                        groups={groups}
                                        userRole={(session.user as any).role}
                                    />
                                </dd>
                            </div>
                            {bug.environment && (
                                <div>
                                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Environment</dt>
                                    <dd className="mt-1 text-slate-700 dark:text-slate-300 break-words">{bug.environment}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                    {/* Attachments */}
                    {(bug.screenshotUrl || bug.videoUrl || bug.logs) && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                Attachments
                            </h3>
                            <ul className="space-y-3 whitespace-nowrap overflow-hidden text-ellipsis">
                                {bug.screenshotUrl && (
                                    <li>
                                        <MediaPreview 
                                            url={bug.screenshotUrl} 
                                            type="image" 
                                            label="Screenshot Attachment" 
                                        />
                                    </li>
                                )}
                                {bug.videoUrl && (
                                    <li>
                                        <MediaPreview 
                                            url={bug.videoUrl} 
                                            type="video" 
                                            label="Video Recording" 
                                        />
                                    </li>
                                )}
                                {bug.logs && (
                                    <li>
                                        <a href={bug.logs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                                            <ExternalLink className="w-4 h-4 shrink-0" />
                                            <span className="truncate max-w-[200px]">Console/Error Logs</span>
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
