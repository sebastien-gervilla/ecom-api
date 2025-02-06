export interface Environment {
    nodeEnv: 'test' | 'development' | 'staging' | 'production';
    port: number;
    allowedOrigin: string;
    jwtSecret: string;

    databaseHost: string;
    databasePort: number;
    databaseName: string;
    databaseUser: string;
    databasePass: string;
}