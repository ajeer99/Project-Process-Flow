const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        include: { bugs: true }
    });
    
    if (!project) {
        console.log("No project found.");
        return;
    }
    
    console.log(`Project: ${project.name}, Total bugs: ${project.bugs.length}`);
    
    if (project.bugs.length > 0) {
        const bug = project.bugs[0];
        console.log(`Sample Bug Created At: ${bug.createdAt.toISOString()}`);
        
        // Let's create a tight filter around this bug
        const cDate = bug.createdAt;
        const start = `${cDate.getUTCFullYear()}-${String(cDate.getUTCMonth() + 1).padStart(2, '0')}-${String(cDate.getUTCDate()).padStart(2, '0')}`;
        console.log(`Using filter start/end: ${start}`);
        
        const dateFilter = {
            createdAt: {
                gte: new Date(`${start}T00:00:00.000Z`),
                lte: new Date(`${start}T23:59:59.999Z`)
            }
        };
        
        const filteredProject = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                bugs: {
                    where: dateFilter
                }
            }
        });
        
        console.log(`Filtered Project Bugs Length: ${filteredProject?.bugs?.length}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
