import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: number;
  JWT_SECRET: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  SEED_ADMIN_PASSWORD?: string;
  SEED_ANALYST_PASSWORD?: string;
  SEED_VIEWER_PASSWORD?: string;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const hasInsecureJwtSecret = (secret: string): boolean => {
  const insecureSamples = new Set([
    "your_secret_here",
    "changeme",
    "default",
    "secret",
  ]);
  return secret.length < 32 || insecureSamples.has(secret.trim().toLowerCase());
};

const validateEnv = (): EnvConfig => {
  const NODE_ENV = getEnvVariable("NODE_ENV", "development");
  const JWT_SECRET = getEnvVariable("JWT_SECRET");

  if (NODE_ENV !== "test" && hasInsecureJwtSecret(JWT_SECRET)) {
    throw new Error(
      "JWT_SECRET is insecure. Use a random value with at least 32 characters (recommended: openssl rand -hex 32).",
    );
  }

  return {
    PORT: parseInt(getEnvVariable("PORT", "3000"), 10),
    JWT_SECRET,
    DATABASE_URL: getEnvVariable("DATABASE_URL"),
    NODE_ENV,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    SEED_ANALYST_PASSWORD: process.env.SEED_ANALYST_PASSWORD,
    SEED_VIEWER_PASSWORD: process.env.SEED_VIEWER_PASSWORD,
  };
};

export const env = validateEnv();
