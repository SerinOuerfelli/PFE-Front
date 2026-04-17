import { Decision } from './Decision';

export interface Recommendation {
    recommendationId?: number;
    predictionId?: number;
    description?: string;
    priority?: string; 
    decisions?: Decision[];
    [key: string]: any; 
}
