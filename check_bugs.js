const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bugs = await prisma.bug.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      timeSpent: true,
      pmTimeSpent: true,
      devTimeSpent: true,
      testerTimeSpent: true,
      developerId: true,
      developerGroupId: true,
      resolvedById: true
    }
  });
  require('fs').writeFileSync('bugs.json', JSON.stringify(bugs, null,  2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
