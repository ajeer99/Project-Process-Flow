const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        console.log("No admin found");
        return;
    }
    const project = await prisma.project.findFirst();
    const moduleItem = await prisma.module.findFirst({ where: { projectId: project.id } });
    const build = await prisma.build.findFirst({ where: { projectId: project.id } });

    console.log("Admin ID:", admin.id);
    const newBug = await prisma.bug.create({
        data: {
            title: "Test Bug for Creator Id Check",
            expectedResult: "Should save creator id",
            actualResult: "None",
            severity: "LOW",
            status: "OPEN",
            projectId: project.id,
            moduleId: moduleItem.id,
            buildId: build.id,
            creatorId: admin.id
        }
    });

    console.log("Created Bug:", newBug.id, "creatorId:", newBug.creatorId);

    // cleanup
    await prisma.bug.delete({ where: { id: newBug.id } });
}

main().finally(() => prisma.$disconnect());
