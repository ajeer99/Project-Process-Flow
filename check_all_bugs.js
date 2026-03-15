const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const bugs = await prisma.bug.findMany({
        select: { id: true, title: true, creatorId: true, creator: { select: { role: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(bugs, null, 2));
}

main().finally(() => prisma.$disconnect());
