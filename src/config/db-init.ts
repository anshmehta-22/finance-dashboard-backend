import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { env } from './env';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Checking database connection...');

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected successfully');

    // Check if we need to seed
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log('Database is empty, seeding initial data...');
      await seedDatabase();
    } else {
      console.log(`✓ Database already initialized (${userCount} users found)`);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't crash the app if seeding fails, just log it
    console.warn('⚠️  Database initialization failed, but app will continue');
  }
}

async function seedDatabase(): Promise<void> {
  try {
    const adminPassword = await bcrypt.hash(
      env.SEED_ADMIN_PASSWORD || 'admin123',
      10,
    );
    const analystPassword = await bcrypt.hash(
      env.SEED_ANALYST_PASSWORD || 'analyst123',
      10,
    );
    const viewerPassword = await bcrypt.hash(
      env.SEED_VIEWER_PASSWORD || 'viewer123',
      10,
    );

    // Create admin user
    await prisma.user.upsert({
      where: { email: 'admin@finance.com' },
      update: {
        passwordHash: adminPassword,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        email: 'admin@finance.com',
        passwordHash: adminPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✓ Admin user (admin@finance.com) created');

    // Create analyst user
    await prisma.user.upsert({
      where: { email: 'analyst@finance.com' },
      update: {
        passwordHash: analystPassword,
        role: 'ANALYST',
        isActive: true,
      },
      create: {
        email: 'analyst@finance.com',
        passwordHash: analystPassword,
        role: 'ANALYST',
        isActive: true,
      },
    });
    console.log('✓ Analyst user (analyst@finance.com) created');

    // Create viewer user
    await prisma.user.upsert({
      where: { email: 'viewer@finance.com' },
      update: {
        passwordHash: viewerPassword,
        role: 'VIEWER',
        isActive: true,
      },
      create: {
        email: 'viewer@finance.com',
        passwordHash: viewerPassword,
        role: 'VIEWER',
        isActive: true,
      },
    });
    console.log('✓ Viewer user (viewer@finance.com) created');

    console.log('✓ Database seeding completed successfully');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}
