export interface Create {
    body: {
        name: string;
        description: string;
        price: number;
        stock: number;
        url: string;
    };
}