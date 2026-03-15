const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bugs = await prisma.bug.findMany({
    select: {
      id: true,
      timeSpent: true,
      pmTimeSpent: true,
      devTimeSpent: true,
      testerTimeSpent: true
    }
  });

  let count = 0;
  for (const bug of bugs) {
    const bucketTotal = (bug.pmTimeSpent || 0) + (bug.devTimeSpent || 0) + (bug.testerTimeSpent || 0);

    // timeSpent currently holds the overlapping total, so subtract the buckets
    // to find the true pure legacy "unbucketed" time
    const trueLegacyTime = Math.max(0, bug.timeSpent - bucketTotal);

    if (trueLegacyTime !== bug.timeSpent) {
        await prisma.bug.update({
            where: { id: bug.id },
            data: { timeSpent: trueLegacyTime }
        });
        count++;
    }
  }

  console.log(`Reset legacy unbucketed time tracking on ${count} bugs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
