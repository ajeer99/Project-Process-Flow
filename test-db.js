const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const groups = await prisma.group.findMany();
  console.log(groups);
}
main().catch(console.error).finally(() => prisma.$disconnect());
