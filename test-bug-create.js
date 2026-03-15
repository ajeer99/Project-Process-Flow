const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const build = await prisma.build.findFirst();
        const module = await prisma.module.findFirst();
        const tester = await prisma.user.findFirst();
        console.log("Found:", { buildId: build?.id, moduleId: module?.id, testerId: tester?.id });
        if(build && module && tester) {
            const bug = await prisma.bug.create({
                data: {
                    title: "Test Bug",
                    description: "Test Description",
                    expectedResult: "Expected",
                    actualResult: "Actual",
                    severity: "LOW",
                    status: "OPEN",
                    buildId: build.id,
                    moduleId: module.id,
                    testerId: tester.id
                }
            });
            console.log("Bug created successfully", bug);
            
            // cleanup
            await prisma.bug.delete({ where: { id: bug.id } });
            console.log("Cleanup done");
        } else {
            console.log("Missing required entities for test.");
        }
    } catch(e) {
        console.error("Error creating bug:", e);
    }
}
check().finally(() => prisma.$disconnect());
