export interface Recommendation {
    recommendationId?: number;
    description?: string;
    priority?: string;
    decisions?: any[];
}

export interface Transaction {
    idTransaction?: number;
    date?: string;
    amount?: number;
    transactionStatus?: string;
    transactionChannel?: string;
}

export interface Prediction {
    predictionId?: number;
    predictionDate?: string;
    predictionType?: string;
    predictionResult?: string;
    probability?: number;
    recommendations?: Recommendation[];
    transactions?: Transaction[];
    [key: string]: any; // Allows mapping of any backend fields not explicitly defined
}
