// create-admin-user.js
const { PrismaClient, UserType } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if user with this name already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        firstName: 'Sumanth',
        lastName: 'Neerumalla'
      }
    });

    if (existingUser) {
      console.log('Admin user already exists:', existingUser);
      return;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        clerkUserId: 'admin_' + Date.now(), // Using timestamp to ensure uniqueness
        firstName: 'Sumanth',
        lastName: 'Neerumalla',
        email: 'admin@example.com',
        userType: UserType.ADMIN,
      }
    });

    console.log('Admin user created successfully:', adminUser);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
