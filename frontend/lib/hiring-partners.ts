export type HiringPartner = {
  id: string;
  name: string;
  domain: string;
  color: string;
  location: string;
};

/** Shared partner registry — logo loaded from company domain favicon. */
export const HIRING_PARTNERS: Record<string, HiringPartner> = {
  welldev: {
    id: "welldev",
    name: "WellDev",
    domain: "welldev.io",
    color: "#f97316",
    location: "Switzerland",
  },
  rokomari: {
    id: "rokomari",
    name: "Rokomari",
    domain: "rokomari.com",
    color: "#16a34a",
    location: "Dhaka, Bangladesh",
  },
  vivasoft: {
    id: "vivasoft",
    name: "Vivasoft",
    domain: "vivasoftltd.com",
    color: "#7c3aed",
    location: "Dhaka, Bangladesh",
  },
  "truck-lagbe": {
    id: "truck-lagbe",
    name: "Truck Lagbe",
    domain: "trucklagbe.com",
    color: "#dc2626",
    location: "Dhaka, Bangladesh",
  },
  chaldal: {
    id: "chaldal",
    name: "Chaldal",
    domain: "chaldal.com",
    color: "#059669",
    location: "Dhaka, Bangladesh",
  },
  cholobd: {
    id: "cholobd",
    name: "CholoBD",
    domain: "cholobd.com",
    color: "#db2777",
    location: "Dhaka, Bangladesh",
  },
  "brain-station-23": {
    id: "brain-station-23",
    name: "Brain Station 23",
    domain: "brainstation-23.com",
    color: "#2563eb",
    location: "Dhaka, Bangladesh",
  },
  selise: {
    id: "selise",
    name: "SELISE",
    domain: "selisegroup.com",
    color: "#0ea5e9",
    location: "Switzerland",
  },
};

export type JobType = "remote" | "local" | "international";

function withLocation(partner: HiringPartner, location: string): HiringPartner {
  return { ...partner, location };
}

export const companiesByType: Record<JobType, HiringPartner[]> = {
  remote: [
    withLocation(HIRING_PARTNERS.welldev, "Switzerland · Remote"),
    withLocation(HIRING_PARTNERS.vivasoft, "Bangladesh · Remote"),
    withLocation(HIRING_PARTNERS.selise, "Global · Remote"),
    withLocation(HIRING_PARTNERS["brain-station-23"], "Bangladesh · Remote"),
    withLocation(HIRING_PARTNERS.cholobd, "Bangladesh · Remote"),
  ],
  local: [
    withLocation(HIRING_PARTNERS["brain-station-23"], "Dhaka, Bangladesh"),
    withLocation(HIRING_PARTNERS.rokomari, "Dhaka, Bangladesh"),
    withLocation(HIRING_PARTNERS["truck-lagbe"], "Dhaka, Bangladesh"),
    withLocation(HIRING_PARTNERS.chaldal, "Dhaka, Bangladesh"),
    withLocation(HIRING_PARTNERS.cholobd, "Dhaka, Bangladesh"),
    withLocation(HIRING_PARTNERS.vivasoft, "Dhaka, Bangladesh"),
  ],
  international: [
    withLocation(HIRING_PARTNERS.welldev, "Switzerland"),
    withLocation(HIRING_PARTNERS.selise, "Switzerland"),
    withLocation(HIRING_PARTNERS["brain-station-23"], "USA & Bangladesh"),
    withLocation(HIRING_PARTNERS.vivasoft, "Bangladesh & UK"),
    withLocation(HIRING_PARTNERS.rokomari, "Bangladesh"),
    withLocation(HIRING_PARTNERS.cholobd, "Bangladesh"),
  ],
};

export function partnerLogoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function partnerLogoFallbackUrl(domain: string) {
  return `https://logo.clearbit.com/${domain}`;
}
