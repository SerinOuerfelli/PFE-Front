export interface Prediction {
    predictionId?: number;
    predictionDate?: string;
    predictionType?: string;
    predictionResult?: string;
    probability?: number;
    [key: string]: any; // Allows mapping of any backend fields not explicitly defined
}
