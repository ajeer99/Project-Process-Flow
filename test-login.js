const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findFirst();
    console.log(user);
    if(user) {
        const bcrypt = require('bcryptjs');
        const match = await bcrypt.compare('password123', user.password);
        console.log('Password match:', match);
    }
}

check().finally(() => prisma.$disconnect());
