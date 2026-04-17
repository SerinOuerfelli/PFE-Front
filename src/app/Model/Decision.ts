import { User } from './User';

export interface Decision {
    decisionId: number;
    description: string;
    decisionDate: string;
    user: User;
    [key: string]: any;
}
