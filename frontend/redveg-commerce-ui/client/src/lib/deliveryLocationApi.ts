import { DeliveryLocation } from '@/types/commerce';

// Temporary fallback data for Kolkata pincodes
// In production, this would be replaced by backend API calls
const fallbackLocations: DeliveryLocation[] = [
  { pincode: "700001", area: "Kolkata GPO", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700002", area: "Park Circus", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700003", area: "Bowbazar", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700004", area: "Shyambazar", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700005", area: "Sovabazar", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700006", area: "Burtolla", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700007", area: "Colootola", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700008", area: "Taltala", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700009", area: "Bhawanipur", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700010", area: "Kalikapur", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700011", area: "Topsia", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700012", area: "Phoolbagan", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700013", area: "Manicktala", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700014", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700015", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700016", area: "Camac Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700017", area: "Chowringhee", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700018", area: "Park Lane", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700019", area: "Lord Sinha Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700020", area: "Russel Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700021", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700022", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700023", area: "Camac Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700024", area: "Chowringhee Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700025", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700026", area: "Lord Sinha Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700027", area: "Russel Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700028", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700029", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700030", area: "Camac Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700031", area: "Chowringhee", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700032", area: "Park Lane", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700033", area: "Lord Sinha Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700034", area: "Russel Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700035", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700036", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700037", area: "Camac Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700038", area: "Chowringhee", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700039", area: "Park Lane", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700040", area: "Lord Sinha Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700041", area: "Russel Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700042", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700043", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700044", area: "Camac Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700045", area: "Chowringhee", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700046", area: "Park Lane", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700047", area: "Lord Sinha Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700048", area: "Russel Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700049", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700050", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700051", area: "Camac Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700052", area: "Chowringhee", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700053", area: "Park Lane", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700054", area: "Lord Sinha Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700055", area: "Russel Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700056", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700057", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700058", area: "Camac Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700059", area: "Chowringhee", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700060", area: "Park Lane", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700061", area: "Lord Sinha Road", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700062", area: "Russel Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700063", area: "Shakespeare Sarani", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700064", area: "Park Street", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700065", area: "Dumdum", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700066", area: "Dumdum Cantonment", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700067", area: "Jorasanko", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700068", area: "Bagbazar", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700069", area: "Shyambazar", city: "Kolkata", state: "West Bengal", isServiceable: true },
  { pincode: "700070", area: "Cossipore", city: "Kolkata", state: "West Bengal", isServiceable: true },
];

export const deliveryLocationApi = {
  /**
   * Search for delivery locations by pincode or area name
   * @param query - Search query (pincode or area name)
   * @returns Promise resolving to array of matching DeliveryLocation objects
   */
  async search(query: string): Promise<DeliveryLocation[]> {
    try {
      // In production, this would be an API call:
      // const response = await fetch(`/api/delivery-locations/search?q=${encodeURIComponent(query)}`);
      // if (!response.ok) throw new Error('Unable to search delivery locations');
      // const data = await response.json();
      // return data.results;

      // For now, use temporary frontend fallback
      return this.searchFallbackLocations(query);
    } catch (error) {
      console.error('Error searching delivery locations:', error);
      // Return fallback data even on error to ensure UI works
      return this.searchFallbackLocations(query);
    }
  },

  /**
   * Reverse geocode latitude/longitude to get location details
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Promise resolving to DeliveryLocation object
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<DeliveryLocation> {
    try {
      // In production, this would be an API call:
      // const response = await fetch(`/api/delivery-locations/reverse-geocode`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ latitude, longitude })
      // });
      // if (!response.ok) throw new Error('Unable to reverse geocode location');
      // const data = await response.json();
      // return data;

      // For now, use temporary frontend fallback (simplified)
      // In reality, this would call a geocoding service
      return this.searchFallbackLocations('').find(loc =>
        loc.pincode === '700065' // Default to Dumdum for demo
      ) || fallbackLocations[0];
    } catch (error) {
      console.error('Error reverse geocoding location:', error);
      // Return a default location on error
      return fallbackLocations[0];
    }
  },

  /**
   * Temporary fallback search implementation
   */
  searchFallbackLocations(query: string): DeliveryLocation[] {
    if (!query.trim()) return [];

    const normalizedQuery = query.trim().toLowerCase();

    // If query is numeric and at least 3 digits, treat as pincode search
    if (/^\d{3,}$/.test(normalizedQuery)) {
      return fallbackLocations.filter(loc =>
        loc.pincode.startsWith(normalizedQuery)
      ).slice(0, 10); // Limit to 10 results
    }

    // Otherwise, treat as area/locality search
    return fallbackLocations.filter(loc =>
      loc.area.toLowerCase().includes(normalizedQuery) ||
      loc.city.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10); // Limit to 10 results
  }
};