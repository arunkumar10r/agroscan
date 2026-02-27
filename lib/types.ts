export interface ScanResult {
  id: string;
  timestamp: number;
  imageUri: string;
  diseaseName: string;
  plantType: string;
  confidence: number;
  description: string;
  biologicalTreatment: string[];
  chemicalTreatment: string[];
  preventionTips: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
