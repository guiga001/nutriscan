import axios, { AxiosInstance } from 'axios';
import { useNutriTrackerStore } from './store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = useNutriTrackerStore.getState().authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      useNutriTrackerStore.getState().clearAuthToken();
    }
    return Promise.reject(error);
  },
);

// API Methods
export const NutriTrackerAPI = {
  // Macros Setup
  async setupMacros(biometrics: {
    email: string;
    password: string;
    gender: 'male' | 'female';
    weight_kg: number;
    height_cm: number;
    age_years: number;
    activity_factor: number;
    goal: 'deficit' | 'maintenance' | 'surplus';
  }) {
    const response = await apiClient.post('/api/v1/macros/setup', biometrics);
    return response.data;
  },

  // Get food by barcode
  async getFoodByBarcode(barcode: string) {
    const response = await apiClient.get(`/api/v1/foods/barcode/${barcode}`);
    return response.data;
  },

  // Log a meal
  async logMeal(
    userId: string,
    mealData: {
      food_id: string;
      quantity: number;
      meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    },
  ) {
    const response = await apiClient.post(`/api/v1/meals/log/${userId}`, mealData);
    return response.data;
  },

  // Scan menu
  async scanMenu(image_base64: string, restaurant_name?: string) {
    const response = await apiClient.post('/api/v1/scanner/menu', {
      image_base64,
      restaurant_name,
    });
    return response.data;
  },
};
