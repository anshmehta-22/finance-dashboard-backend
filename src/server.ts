import { createApp } from './app';
import { env } from './config/env';
import { initializeDatabase } from './config/db-init';

const app = createApp();

async function startServer() {
  try {
    // Initialize database on first run
    await initializeDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log(
        `API docs available at http://localhost:${env.PORT}/api/docs`,
      );
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `Port ${env.PORT} is already in use. Try a different port in .env`,
        );
        process.exit(1);
      }
    });

    const gracefulShutdown = () => {
      server.close(() => {
        process.exit(0);
      });

      setTimeout(() => {
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
