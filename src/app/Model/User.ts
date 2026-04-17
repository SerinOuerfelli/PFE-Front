export interface User {
    userId: number;
    username: string;
    email: string;
    role: string;
    active: boolean;
    [key: string]: any;
}
