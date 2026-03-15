const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAssignment() {
    try {
        console.log("Fetching a random bug...");
        const bug = await prisma.bug.findFirst();
        if (!bug) {
            console.log("No bugs found in the database. Exiting.");
            return;
        }
        console.log(`Initial Bug state: Tester ID = ${bug.testerId}`);

        console.log("\nFetching the TESTER user...");
        const tester = await prisma.user.findFirst({ where: { role: 'TESTER' } });
        if (!tester) {
            console.log("No TESTER role users found. Exiting.");
            return;
        }

        console.log(`Got Tester: ${tester.email} (ID: ${tester.id})`);

        console.log("\nSimulating assignment action...");
        
        // Emulating assignTester from lib/actions/bug.ts
        // 1. Update the bug
        await prisma.bug.update({
            where: { id: bug.id },
            data: { testerId: tester.id }
        });

        console.log("Bug updated successfully.");

        // 2. Create notification
        const users = await prisma.user.findMany({
            where: { id: { in: [tester.id] }, notificationsEnabled: true },
            select: { id: true }
        });

        if (users.length > 0) {
            await prisma.notification.createMany({
                data: users.map(u => ({
                    userId: u.id,
                    title: "Bug Assigned for Testing",
                    message: `You were assigned to test: ${bug.title}`,
                    linkUrl: `/admin/bugs/${bug.id}`,
                    isRead: false
                }))
            });
            console.log("Notification created successfully.");
        } else {
            console.log("Failed to create notification. Target user has notifications disabled.");
        }

        console.log("\nVerifying bug state...");
        const verifiedBug = await prisma.bug.findUnique({ where: { id: bug.id } });
        console.log(`Final Bug state: Tester ID = ${verifiedBug.testerId} (Matches target: ${verifiedBug.testerId === tester.id})`);

        console.log("\nVerifying notification state...");
        const unread = await prisma.notification.findMany({ where: { userId: tester.id, isRead: false }, orderBy: { createdAt: 'desc' } });
        console.log(`Found ${unread.length} total unread notifications for Tester.`);

    } catch (e) {
        console.error("Test execution failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testAssignment();
