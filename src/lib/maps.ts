/** Google Maps — workshop yard; keep in sync with businessConfig */
import { businessConfig, googleMapsDirectionsUrl } from "@/lib/businessConfig";

export const WORKSHOP_MAP_QUERY = businessConfig.addressLine;

export const WORKSHOP_MAP_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(
  businessConfig.addressLine
)}&hl=pl&z=16&output=embed`;

export const WORKSHOP_DIRECTIONS_URL = googleMapsDirectionsUrl(businessConfig);
