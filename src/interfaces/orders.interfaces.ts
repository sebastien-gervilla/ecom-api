export interface Get {
    body: {

    };
}

export interface Create {
    body: {
        id: number;
        quantity: number;
    }[];
}

export enum Status {
    IN_PROGRESS = 'in_progress',
    SHIPPED = 'shipped',
    CANCELED = 'canceled'
}