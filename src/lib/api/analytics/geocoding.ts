// src/lib/clientGeocodingService.api.ts
import axios from 'axios';
import { GeocodingResult } from '../../../services/serverGeocodingService';

export const clientGeocodingApi = {
  async getGeocodingResult(countryNameOrCode: string): Promise<GeocodingResult | null> {
    const response = await axios.get(`/api/geocoding?query=${encodeURIComponent(countryNameOrCode)}`);
    return response.data;
  },

  async getCurrentLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  },

  async getSalinityData(coordinates: [number, number]): Promise<number> {
    const response = await axios.get(`/api/ocean-data/salinity?lat=${coordinates[0]}&lon=${coordinates[1]}`);
    return response.data.salinity;
  },

  // Other client-side methods...
};