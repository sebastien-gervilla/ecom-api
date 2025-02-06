export interface Get {
    body: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: Role;
    }[];
}

export interface GetRequest {
    query: {
        page: number;
        pageSize: number;
    }
}

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
    firstName: string;
    lastName: string;
    role: Role;
}