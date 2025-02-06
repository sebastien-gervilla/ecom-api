export interface Get {
    body: {
        id: number;
        name: string;
        reference: string;
        description: string;
        price: number;
        stock: number;
        url: string;
    }[];
}

export interface Create {
    body: {
        name: string;
        reference: string;
        description: string;
        price: number;
        stock: number;
        url: string;
    };
}

export interface Update {
    body: {
        name: string;
        reference: string;
        description: string;
        price: number;
        stock: number;
        url: string;
    };
}