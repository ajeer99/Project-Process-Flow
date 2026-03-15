const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  if (user) {
    console.log("User found:", user.email, "ID:", user.id);
    console.log("Role:", user.role);
    console.log("IsActive:", user.isActive);
    console.log("Has password field:", !!user.password);
    console.log("Password hash:", user.password);
    console.log("Password matches 'password123':", bcrypt.compareSync('password123', user.password));
  } else {
    console.log("User not found in database!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
