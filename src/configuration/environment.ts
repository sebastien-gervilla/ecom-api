import { Interfaces } from '../interfaces';
import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV;
if (!nodeEnv) throw new Error('NODE_ENV must be defined.');

const environments: Interfaces.API.Environment['nodeEnv'][] = ['test', 'development', 'staging', 'production'];
const nodeEnvironment = environments.find((variable) => variable === nodeEnv.trim());
if (!nodeEnvironment) throw new Error(`NODE_ENV must be in ${environments}.`);

const environmentVariables = [
    'PORT',
    'ALLOWED_ORIGIN',
    'JWT_SECRET',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASS',
] as const;

for (const variable of environmentVariables)
    if (!process.env[variable])
        throw new Error(`Environment variable '${variable}' must be defined.`);

const environment: Interfaces.API.Environment = {
    nodeEnv: nodeEnvironment,
    port: parseInt(process.env.PORT!),
    allowedOrigin: process.env.ALLOWED_ORIGIN!,
    jwtSecret: process.env.JWT_SECRET!,

    databaseHost: process.env.DATABASE_HOST!,
    databaseName: process.env.DATABASE_NAME!,
    databasePort: parseInt(process.env.DATABASE_PORT!),
    databaseUser: process.env.DATABASE_USER!,
    databasePass: process.env.DATABASE_PASS!,
};

export { environment };