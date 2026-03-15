const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const group = await prisma.group.findFirst();
  if (group) {
    console.log('Got group:', group);
    await prisma.group.delete({ where: { id: group.id } });
    console.log('Successfully deleted group with ID:', group.id);
  } else {
    console.log('No groups found in the database to delete.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
