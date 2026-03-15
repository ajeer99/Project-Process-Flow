const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dev = await prisma.user.findFirst({
    where: { role: 'DEVELOPER' }
  });

  if (!dev) return console.log("No dev found");

  const bugs = await prisma.bug.findMany({
    where: { status: { in: ['VERIFIED', 'READY_FOR_RETEST', 'FIXED'] } }
  });

  let count = 0;
  for (const bug of bugs) {
    if (!bug.resolvedById) {
      await prisma.bug.update({
        where: { id: bug.id },
        data: { resolvedById: dev.id }
      });
      count++;
    }
  }
  console.log('Updated ' + count + ' bugs retroactively to ' + dev.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
