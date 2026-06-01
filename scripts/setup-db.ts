import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Run Prisma migrations
    console.log('Running database migrations...');
    await execAsync('npx prisma db push --skip-generate');

    // Run seed script
    console.log('Seeding database...');
    await execAsync('npx ts-node prisma/seed.ts');

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
