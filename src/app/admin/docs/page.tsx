import { Metadata } from 'next';
import { BookOpen, Target, Bug, Sparkles, Waypoints, Users } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Documentation & Guide - QA Portal',
};

export default function DocsPage() {
    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-slate-800 dark:to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                        <BookOpen className="w-8 h-8 text-indigo-200" />
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Process Flow Application Guide</h1>
                        <p className="text-indigo-100/80 text-lg max-w-2xl">
                            Welcome to the Process Flow Application! This guide provides the necessary training for Project Managers, Developers, and Testers to effectively use the platform to seamlessly track projects, manage complex modules, and automate bug lifecycles.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="space-y-16">
                
                {/* 1. Understanding the System Hierarchy */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <Target className="w-6 h-6 text-indigo-500" /> 1. Understanding the System Hierarchy
                    </h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300 space-y-6">
                        <p className="text-lg">
                            To keep your work organized, the application uses a strict three-tier hierarchy. By breaking work down to the Sub-Module level, the system can automatically route bugs directly to the team members responsible for that specific code.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">1</span> Projects
                                </h3>
                                <p className="text-sm">The top-level container for a specific application or major initiative. <strong>Every Project must have a designated Project Manager</strong> assigned to oversee its lifecycle.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">2</span> Modules
                                </h3>
                                <p className="text-sm">Major feature sets or sections within a Project (e.g., "Authentication", "Checkout Flow").</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">3</span> Sub-Modules
                                </h3>
                                <p className="text-sm">Specific, granular components within a Module (e.g., "Login Screen", "Credit Card Form").</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Reporting a Bug */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <Bug className="w-6 h-6 text-rose-500" /> 2. Reporting a Bug
                    </h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 space-y-6 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">How to submit a Bug:</h3>
                            <ol className="list-decimal pl-5 space-y-3 font-medium">
                                <li>Navigate to the <strong>"Report Bug"</strong> or <strong>"New Issue"</strong> screen.</li>
                                <li>Select the relevant <strong>Project</strong>, followed by the specific <strong>Module</strong> and <strong>Sub-Module</strong> where the issue occurred.</li>
                                <li>Provide a clear, descriptive <strong>Title</strong>.</li>
                                <li>Detail the <strong>Steps to Reproduce</strong>, <strong>Expected Behavior</strong>, and <strong>Actual Behavior</strong> in the description.</li>
                                <li>Set the appropriate <strong>Severity</strong> (e.g., Blocked, High, Medium, Low).</li>
                            </ol>
                        </div>
                        <div className="p-6 md:p-8 bg-indigo-50/50 dark:bg-indigo-900/10">
                            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" /> ✨ AI Assistance Features
                            </h3>
                            <p className="mb-6 text-indigo-800/80 dark:text-indigo-200/80">To make reporting effortless, the application includes powerful built-in AI Functions:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Smart Description Generation</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Input a rough draft or just a few unformatted notes, and the AI will analyze your text to automatically structure it into professional "Steps to Reproduce", "Expected Results", and "Actual Results" fields.</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Severity Prediction</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">The AI can analyze the crash logs or descriptions you provide and suggest the most appropriate Severity rating based on the context.</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Duplicate Detection</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">The AI can scan existing open bugs within the project to warn you if a similar issue has already been reported, saving your team from redundant work.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Auto-Assignment Setup & Workflow */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <Waypoints className="w-6 h-6 text-blue-500" /> 3. Auto-Assignment Setup & Workflow
                    </h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-600 dark:text-slate-300">
                        <div>
                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
                                You do not need to manually figure out who should fix a bug! The system relies on an Automated Assignment Flow.
                            </p>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-3 mt-6 text-lg">How Routing Works:</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Groups:</strong> Developers and Testers are organized into specific Groups (e.g., "Frontend Core Team", "QA Automation").</li>
                                <li>When a Project Manager or Team Lead sets up a Project, they map these Groups directly to specific Modules and Sub-Modules.</li>
                                <li><strong>The Result:</strong> When you report a bug and select its Sub-Module, the system instantly identifies the exact Developer (or Developer Group) responsible for that code and places the bug directly into their queue.</li>
                                <li>Once the Developer finishes fixing it, the system automatically forwards it to the designated Tester (or Tester Group) for that exact feature.</li>
                            </ul>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-6 text-lg">The Standard Lifecycle</h3>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-600 before:to-transparent">
                                
                                {/* Step 1 */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
                                        1
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 ml-4 md:ml-0 md:group-odd:text-right">
                                        <div className="flex items-center gap-2 mb-2 md:group-odd:justify-end">
                                            <span className="px-2.5 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-md font-bold text-xs">OPEN / IN_PROGRESS</span>
                                        </div>
                                        <p className="text-sm">The bug is with the Developer. They investigate, write code, and resolve the issue.</p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
                                        2
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 ml-4 md:ml-0 md:group-odd:text-right">
                                        <div className="flex items-center gap-2 mb-2 md:group-odd:justify-end">
                                            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 rounded-md font-bold text-xs">READY_FOR_RETEST</span>
                                        </div>
                                        <p className="text-sm">The Developer marks the bug as "Fixed". It instantly leaves their queue and appears in the Tester's queue.</p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
                                        3
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 ml-4 md:ml-0 md:group-odd:text-right">
                                        <div className="flex items-center gap-2 mb-2 md:group-odd:justify-end">
                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md font-bold text-xs">VERIFIED</span>
                                        </div>
                                        <p className="text-sm">The Tester confirms the fix works. The bug is closed.</p>
                                    </div>
                                </div>

                                {/* Alternative Step */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mt-8">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto -ml-[1.4rem] md:ml-auto">
                                        !
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800/50 ml-4 md:ml-0 md:group-odd:text-right">
                                        <div className="flex items-center gap-2 mb-2 md:group-odd:justify-end">
                                            <span className="px-2.5 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 rounded-md font-bold text-xs">REOPENED</span>
                                        </div>
                                        <p className="text-sm text-orange-900/80 dark:text-orange-200/80">If the Tester finds the bug is still occurring. It is immediately returned to the Developer's queue with a penalty added to their "Reopened Count" metric.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Role-Specific Instructions */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <Users className="w-6 h-6 text-emerald-500" /> 4. Role-Specific Instructions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-600 dark:text-slate-300">
                        {/* PM */}
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border-t-8 border-indigo-500 shadow-sm border-l border-r border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Project Managers (PMs)</h3>
                            <p className="mb-4">As a PM, you oversee the health of your assigned Projects.</p>
                            <ul className="list-disc pl-5 space-y-3 text-sm">
                                <li><strong>Triage Queue:</strong> If a bug is reported without a specific Sub-Module (or if lacking an assigned Developer), it falls to you to manually assign team members to resolve it.</li>
                                <li><strong>Performance Dashboards:</strong> Access Analytics and Time Tracking reports specifically for your Projects. Monitor bug resolution times and track verify-to-fail ratios.</li>
                            </ul>
                        </div>
                        
                        {/* Developer */}
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border-t-8 border-blue-500 shadow-sm border-l border-r border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Developers</h3>
                            <p className="mb-4">Your primary workspace is your <strong>Developer Dashboard</strong>.</p>
                            <ul className="list-disc pl-5 space-y-3 text-sm">
                                <li>Focus solely on the bugs assigned to you, categorized by Priority and Severity.</li>
                                <li>When you begin working on a bug, the system tracks your active lead time.</li>
                                <li>Once you resolve the code, change status to <code>READY_FOR_RETEST</code>. The system hands it off to QA and pauses your time clock.</li>
                            </ul>
                        </div>

                        {/* Tester */}
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border-t-8 border-emerald-500 shadow-sm border-l border-r border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Testers</h3>
                            <p className="mb-4">Your primary workspace is your <strong>Tester Dashboard</strong>.</p>
                            <ul className="list-disc pl-5 space-y-3 text-sm">
                                <li>You will only see bugs marked as <code>READY_FOR_RETEST</code>.</li>
                                <li>Carefully review the developer's notes.</li>
                                <li>If fixed, mark it <code>VERIFIED</code>.</li>
                                <li>If it persists, mark it <code>REOPENED</code> and leave a clear comment detailing how it failed.</li>
                            </ul>
                        </div>
                    </div>
                </section>
                
            </div>
            
            <div className="mt-16 text-center text-slate-500 text-sm bg-slate-50 dark:bg-slate-900/50 py-6 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <em>Note: Administrative functions such as creating new users, editing root system permissions, or configuring global SMTP settings are restricted to System Administrators and are not accessible from standard workspaces.</em>
            </div>
        </div>
    );
}
