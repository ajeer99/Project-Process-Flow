const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotifs() {
    try {
        console.log("Looking for users...");
        
        // Find ADMIN and TESTER users
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        const tester = await prisma.user.findFirst({ where: { role: 'TESTER' } });

        console.log(`Found Admin: ${admin?.email}`);
        console.log(`Found Tester: ${tester?.email}`);

        if (!admin || !tester) {
            console.log("Could not find both users to test.");
            return;
        }

        // Test Notification Creation
        console.log(`\nAttempting to create notification for Tester (${tester.email})...`);
        const notification = await prisma.notification.create({
            data: {
                title: "Manual Test Notification",
                message: "This is a direct database injection test.",
                linkUrl: "/admin/dashboard",
                userId: tester.id
            }
        });

        console.log("Success! Notification created:", notification);

        // Fetch unread notifications for tester
        const unread = await prisma.notification.findMany({
            where: { userId: tester.id, isRead: false },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`\nFound ${unread.length} unread notifications for Tester:`);
        unread.forEach(n => console.log(`- [${n.createdAt}] ${n.title}: ${n.message}`));

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testNotifs();
