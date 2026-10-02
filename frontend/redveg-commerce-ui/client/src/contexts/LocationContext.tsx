import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { deliveryLocationApi } from '@/lib/deliveryLocationApi';

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
        const parsed = JSON.parse(savedLocation);
        // Validate the saved location against the API
        deliveryLocationApi.search(parsed.pincode, false).then(results => {
          const found = results.find(loc => loc.pincode === parsed.pincode);
          if (found) {
            // Location exists, update with fresh data (optional)
            setLocation({
              pincode: found.pincode,
              area: found.area,
              city: found.city,
              state: found.state,
              isServiceable: found.isServiceable,
              latitude: found.latitude,
              longitude: found.longitude
            });
          } else {
            // Location not found (maybe removed), clear it
            localStorage.removeItem('redveg_delivery_location');
            setLocation(null);
          }
        }).catch(err => {
          // If validation fails, we keep the saved location but log error
          console.warn('Failed to validate saved location:', err);
          setLocation(parsed);
        });
      } catch (error) {
        console.error('Error parsing location from localStorage:', error);
        localStorage.removeItem('redveg_delivery_location');
        setLocation(null);
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