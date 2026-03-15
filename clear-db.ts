import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database activities and projects...');
  
  // Delete in order to respect foreign key constraints
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.bug.deleteMany();
  
  await prisma.subModule.deleteMany();
  await prisma.module.deleteMany();
  await prisma.build.deleteMany();
  await prisma.assignmentFlow.deleteMany();
  await prisma.project.deleteMany();
  
  await prisma.directMessage.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.systemActionLog.deleteMany();

  console.log('Database cleared successfully! Enjoy your testing.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
