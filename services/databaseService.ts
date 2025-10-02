/**
 * @fileoverview Database Service
 * 
 * This service abstracts the data persistence layer of the application.
 * It provides a simple key-value store interface (get/set).
 * 
 * NOTE: This is a MOCK implementation using browser localStorage.
 * In a production environment, this module would be replaced with API calls
 * to a secure backend server that connects to a persistent database like Redis.
 * 
 * Example of a Redis-backed implementation (via a backend API):
 * 
 * const API_BASE_URL = '/api/storage';
 * 
 * export const db = {
 *   get: async <T,>(key: string): Promise<T | null> => {
 *     try {
 *       const response = await fetch(`${API_BASE_URL}/${key}`);
 *       if (!response.ok) return null;
 *       const data = await response.json();
 *       return data.value;
 *     } catch (error) {
 *       console.error(`Failed to get key "${key}" from remote DB`, error);
 *       return null;
 *     }
 *   },
 *   set: async <T,>(key: string, value: T): Promise<void> => {
 *      try {
 *       await fetch(`${API_BASE_URL}/${key}`, {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ value }),
 *       });
 *     } catch (error) {
 *       console.error(`Failed to set key "${key}" in remote DB`, error);
 *     }
 *   },
 * };
 */

// Mock implementation using localStorage for demonstration purposes.
export const db = {
  get: <T,>(key: string): T | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to get key "${key}" from localStorage`, error);
      return null;
    }
  },
  set: <T,>(key: string, value: T): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set key "${key}" in localStorage`, error);
    }
  },
};
