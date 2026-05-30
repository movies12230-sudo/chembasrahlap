export interface Ingredient {
  name: string;
  amount: number; // percentage or grams
}

export interface Formula {
  id?: string;
  userId: string;
  name: string;
  ingredients: Ingredient[];
  phLevel: number;
  createdAt: any; // Firestore timestamp
  status: 'Draft' | 'Review' | 'Approved' | 'Production'; // Workflow status
  safetyScore: number; // For analytics
  efficiencyScore: number; // For analytics
}

export interface UserProfile {
  uid: string;
  skinType: string;
  sensitivity: boolean;
  history: string[];
}

export interface Product {
  id: string;
  name: string;
  ingredients: Ingredient[];
  minPH: number;
  maxPH: number;
  type: string; // 'Cream' | 'Gel' | 'Wash' | 'Toner'
}

export enum SkinType {
  Oily = 'دهنية',
  Normal = 'عادية',
  Dry = 'جافة',
  Sensitive = 'حساسة'
}

export interface LabResult {
  activeMatter: number;
  viscosity: string; // 'High', 'Medium', 'Low'
  ph: number;
  notes: string;
  isUsCompliant: boolean;
  isUkCompliant: boolean;
}
