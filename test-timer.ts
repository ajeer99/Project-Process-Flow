import { updateBugStatus } from './src/app/lib/actions/bug';
import prisma from './src/app/lib/prisma';

async function testTimer() {
    const bugs = await prisma.bug.findMany({ take: 1, orderBy: { createdAt: 'desc'} });
    if(bugs.length === 0) { console.log('no bugs'); return; }

    const targetBug = bugs[0];
    
    // reset to OPEN 
    await prisma.bug.update({ where: { id: targetBug.id }, data: { status: 'OPEN', pmTimeSpent: 0, devTimeSpent: 0, testerTimeSpent: 0, timeSpent: 0, assignedAt: new Date() }});
    
    console.log("Bug is OPEN.");

    // wait 2 seconds
    await new Promise(res => setTimeout(res, 2000));

    // Force date directly so we get an artificial minute offset in DB to test the diff
    const manualBackdate = new Date(Date.now() - (65 * 1000));
    await prisma.bug.update({ where: { id: targetBug.id }, data: { lastStatusUpdateAt: manualBackdate }});

    console.log("Mocking 65 elapsed seconds... transitioning to IN_PROGRESS...");
    await updateBugStatus(targetBug.id, 'IN_PROGRESS');

    const updated1 = await prisma.bug.findUnique({ where: { id: targetBug.id }});
    console.log("PM Time Spent:", updated1?.pmTimeSpent); // should be 1

    console.log("Mocking another 125 seconds... transitioning to READY_FOR_RETEST...");
    const manualBackdate2 = new Date(Date.now() - (125 * 1000));
    await prisma.bug.update({ where: { id: targetBug.id }, data: { lastStatusUpdateAt: manualBackdate2 }});
    
    await updateBugStatus(targetBug.id, 'READY_FOR_RETEST');
    const updated2 = await prisma.bug.findUnique({ where: { id: targetBug.id }});
    
    console.log("DEV Time Spent:", updated2?.devTimeSpent); // should be 2

    console.log("Mocking 185 seconds... transitioning to FIXED...");
    const manualBackdate3 = new Date(Date.now() - (185 * 1000));
    await prisma.bug.update({ where: { id: targetBug.id }, data: { lastStatusUpdateAt: manualBackdate3 }});

    await updateBugStatus(targetBug.id, 'FIXED');
    const updated3 = await prisma.bug.findUnique({ where: { id: targetBug.id }});
    
    console.log("TESTER Time Spent:", updated3?.testerTimeSpent); // should be 3

    console.log("Final Legacies:", updated3?.timeSpent); // should be 6
}

testTimer()
