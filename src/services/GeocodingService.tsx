// src/services/GeocodingService.ts
import { feature } from 'topojson-client';
import { FeatureCollection, Geometry, Feature, Position } from 'geojson';
import countries from 'world-atlas/countries-110m.json';
import axios from 'axios';

interface CountryProperties {
  name: string;
  iso_a3: string;
}

interface GeocodingResult {
  coordinates: [number, number];
  countryCode: string;
  countryName: string;
  continent: string;
}

export class GeocodingService {
  private static countriesGeoJSON: FeatureCollection<Geometry, CountryProperties>;
  private static countryMap: Map<string, GeocodingResult> = new Map();
  private static continents: { [key: string]: string } = {
    'AF': 'Africa', 'AN': 'Antarctica', 'AS': 'Asia', 'EU': 'Europe',
    'NA': 'North America', 'OC': 'Oceania', 'SA': 'South America'
  };

  static async initialize() {
    if (this.countryMap.size > 0) return;

    this.countriesGeoJSON = feature(
      countries as unknown as TopoJSON.Topology,
      countries.objects.countries as TopoJSON.GeometryCollection
    ) as unknown as FeatureCollection<Geometry, CountryProperties>;

    for (const feature of this.countriesGeoJSON.features) {
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const name = feature.properties.name.toLowerCase();
        const iso = feature.properties.iso_a3.toLowerCase();
        const [longitude, latitude] = this.calculateCentroid(feature.geometry.coordinates as Position[][] | Position[][][]);
        const continent = await this.getContinent(iso);
        
        const result: GeocodingResult = {
          coordinates: [latitude, longitude],
          countryCode: iso,
          countryName: feature.properties.name,
          continent
        };

        this.countryMap.set(name, result);
        this.countryMap.set(iso, result);
      }
    }
  }

  private static calculateCentroid(coordinates: Position[][] | Position[][][]): [number, number] {
    let allPoints: Position[] = [];
    if (Array.isArray(coordinates[0][0])) {
      (coordinates as Position[][][]).forEach(polygon => {
        allPoints = allPoints.concat(polygon[0]);
      });
    } else {
      allPoints = coordinates[0] as Position[];
    }

    const sumLat = allPoints.reduce((sum, point) => sum + point[1], 0);
    const sumLon = allPoints.reduce((sum, point) => sum + point[0], 0);
    return [sumLon / allPoints.length, sumLat / allPoints.length];
  }

  public static async getGeocodingResult(countryNameOrCode: string): Promise<GeocodingResult | null> {
    await this.initialize();
    const key = countryNameOrCode.toLowerCase();
    return this.countryMap.get(key) || null;
  }

  public static async getCoordinates(countryNameOrCode: string): Promise<[number, number]> {
    const result = await this.getGeocodingResult(countryNameOrCode);
    return result ? result.coordinates : [0, 0];
  }

  public static async getCountryCode(countryName: string): Promise<string> {
    const result = await this.getGeocodingResult(countryName);
    return result ? result.countryCode : '';
  }

  public static async getContinent(countryCode: string): Promise<string> {
    const continentCode = countryCode.slice(0, 2).toUpperCase();
    return this.continents[continentCode] || 'Unknown';
  }

  public static async getSalinityData(coordinates: [number, number]): Promise<number> {
    try {
      // Using NOAA's World Ocean Database API
      const [lat, lon] = coordinates;
      const response = await axios.get(`https://www.ncei.noaa.gov/erddap/griddap/woa18_decav_s00_04.json?s_an[(0):1:(0)][(0.0):1:(0.0)][(${lat}):1:(${lat})][(${lon}):1:(${lon})]`);
      const salinity = response.data.table.rows[0][3];
      return parseFloat(salinity);
    } catch (error) {
      console.error('Error fetching salinity data:', error);
      return 35; // Default ocean salinity
    }
  }

  public static async getCurrentLocation(): Promise<[number, number]> {
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
  }

  public static async getOceanData(coordinates: [number, number]): Promise<any> {
    try {
      // Using NOAA's ERDDAP server for comprehensive ocean data
      const [lat, lon] = coordinates;
      const response = await axios.get(`https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdHadISST.json?sst[(last)][(${lat}):1:(${lat})][(${lon}):1:(${lon})]`);
      return response.data.table.rows[0][3];
    } catch (error) {
      console.error('Error fetching ocean data:', error);
      return null;
    }
  }
}