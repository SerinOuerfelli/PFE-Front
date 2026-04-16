export interface Recommendation {
    recommendationId?: number;
    predictionId?: number;
    description?: string;
    priority?: string; 
    [key: string]: any; 
}
