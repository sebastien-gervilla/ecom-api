export interface Register {
    body: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }
}

export interface Login {
    body: {
        email: string;
        password: string;
    }
}

export enum Role {
    ADMINISTRATOR = 'administrator',
    CLIENT = 'client',
}

export interface JWTPayload {
    id: number;
    role: Role;
}