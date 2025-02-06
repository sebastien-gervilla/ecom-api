declare namespace NodeJS {
    interface ProcessEnv {
        PORT: string;
        ALLOWED_ORIGIN: string;
        JWT_SECRET: string;
        
        DATABASE_HOST: string;
        DATABASE_PORT: string;
        DATABASE_NAME: string;
        DATABASE_USER: string;
        DATABASE_PASS: string;
    }
}