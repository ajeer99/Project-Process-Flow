const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const builds = await prisma.build.count();
    const modules = await prisma.module.count();
    const projects = await prisma.project.count();
    console.log({ projects, builds, modules });
}

check().finally(() => prisma.$disconnect());
