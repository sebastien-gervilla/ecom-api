export interface Get {
    body: {
        id: number;
        status: Status;
        products: {
            id: number;
            name: string;
            reference: string;
            description: string;
            price: number;
            stock: number;
            url: string;
            quantity: number;
        }[];
        total: number;
    }[];
}

export interface Create {
    body: {
        id: number;
        quantity: number;
    }[];
}

export interface GetStatistics {
    body: {
        totalOrders: number;
        bestSelling: {
            name: string;
            quantity: number;
        }[];
        stockRemaining: {
            name: string;
            stock: number;
        }[];
    };
}

export enum Status {
    IN_PROGRESS = 'in_progress',
    SHIPPED = 'shipped',
    CANCELED = 'canceled'
}