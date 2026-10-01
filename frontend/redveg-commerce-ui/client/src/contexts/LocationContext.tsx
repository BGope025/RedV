import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type DeliveryLocation = {
  pincode: string;
  area: string;
  city: string;
  state: string;
  isServiceable?: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

type LocationContextType = {
  location: DeliveryLocation | null;
  setLocation: (location: DeliveryLocation | null) => void;
  hasLocation: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null);

  useEffect(() => {
    // Load location from localStorage on initial load
    const savedLocation = localStorage.getItem('redveg_delivery_location');
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Error parsing location from localStorage:', error);
        localStorage.removeItem('redveg_delivery_location');
      }
    }
  }, []);

  const hasLocation = !!location;

  return (
    <LocationContext.Provider value={{ location, setLocation, hasLocation }}>
      {children}
    </LocationContext.Provider>
  );
}