declare class GlobeWC extends HTMLElement {
  width: number;
  height: number;
  rotate: number;
  autoRotate: boolean;
  
  addCountry(countryData: {
    name: string;
    color: number;
    lat: number;
    lng: number;
    size: number;
    data?: any;
  }): void;
  
  removeCountry(name: string): void;
  getCountries(): string[];
  rotateTo(lat: number, lng: number, duration?: number): void;
  reset(): void;
  
  addEventListener(type: 'globe-initialized', listener: (event: CustomEvent<{ countries: string[] }>) => void): void;
  addEventListener(type: 'country-added', listener: (event: CustomEvent<any>) => void): void;
  addEventListener(type: 'country-removed', listener: (event: CustomEvent<{ name: string }>) => void): void;
}

export default GlobeWC;
