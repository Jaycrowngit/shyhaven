/**
 * Sample data for the in-memory API. Every listing here uses Unsplash stock photos and is flagged `isSample`,
 * so the UI labels it as sample data (skyhaven-photos/README: never present these as real, rentable homes).
 */
import type { ListingStatus, Role } from '../../domain';
import type { KycStatus, ListingFees, ListingType, OwnershipDocKind, PolicyVersion } from '../../types';

export const SAMPLE_PHOTOS: Record<string, string> = {
  'apartment-01': 'Apartment block with glass balconies at sunset',
  'apartment-02': 'Apartment building with balconies and greenery',
  'apartment-03': 'Beige apartment block against a pale sky',
  'house-01': 'Two-storey modern house with balconies',
  'house-02': 'Modern white and wood house',
  'house-03': 'White house with a wood ceiling',
  'house-04': 'Stone and concrete house with a garden',
  'house-05-dusk': 'Modern house lit up at dusk',
  'house-06': 'White villa',
  'house-08': 'Single-storey house with a wood front',
  'living-room-01': 'Living room with a large window',
  'kitchen-01': 'Kitchen and dining area',
  'kitchen-02': 'White and wood kitchen',
  'bedroom-01': 'Bedroom with wood accents',
  'bedroom-02': 'Bright bedroom with a balcony',
};

export const photoUrl = (key: string) => `/images/sample/${key}.jpg`;

const INTERIORS = ['living-room-01', 'kitchen-02', 'bedroom-02', 'bedroom-01', 'kitchen-01'];

export interface SeedUser {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  roles: Role[];
  kyc: KycStatus;
  payout: { bankCode: string; bankName: string; accountLast4: string; accountName: string } | null;
  acceptedPolicyVersion: number | null;
}

/**
 * Owners of the Find a Home listings. They have no phone or email, so nobody can sign in as them;
 * they exist only so each listing has a verified landlord behind it.
 */
export const SEED_USERS: SeedUser[] = ['Chioma Eze', 'Ibrahim Musa', 'Funke Adeyemi', 'Emeka Nwosu', 'Tunde Bakare', 'Ngozi Okafor'].map((name, i) => ({
  id: `u_owner${i + 1}`,
  name,
  phone: null,
  email: null,
  roles: ['tenant', 'landlord'] as Role[],
  kyc: 'verified' as KycStatus,
  payout: { bankCode: '044', bankName: 'Access Bank', accountLast4: `100${i}`, accountName: name.toUpperCase() },
  acceptedPolicyVersion: 2,
}));

export interface SeedListing {
  id: string;
  landlordId: string;
  title: string;
  type: ListingType;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  city: string;
  area: string;
  address: string;
  /** Annual rent, whole naira. */
  rentNaira: number;
  fees: { serviceCharge: number; cautionDeposit: number; legalFee: number };
  cover: string;
  amenities: string[];
  description: string;
  status: ListingStatus;
  /** Days before seeding that the listing was created. */
  ageDays: number;
  reviewNote?: string;
  documents?: { kind: OwnershipDocKind; fileName: string }[];
}

const AMENITIES = {
  basic: ['Prepaid meter', 'Borehole water', 'Security', 'Parking'],
  estate: ['24h power', 'Borehole water', 'Gated estate', 'Security', 'Parking', 'Waste disposal'],
  luxury: ['24h power', 'Swimming pool', 'Gym', 'Fitted kitchen', 'Air conditioning', 'Gated estate', 'Parking'],
};

export const SEED_LISTINGS: SeedListing[] = [
  {
    id: 'l_yaba',
    landlordId: 'u_owner5',
    title: 'Bright 2-bedroom flat near Unilag',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: false,
    city: 'Lagos',
    area: 'Yaba',
    address: '14 Herbert Macaulay Way, Yaba',
    rentNaira: 2_800_000,
    fees: { serviceCharge: 250_000, cautionDeposit: 300_000, legalFee: 140_000 },
    cover: 'apartment-03',
    amenities: AMENITIES.basic,
    description:
      'A bright second-floor flat in a quiet compound, ten minutes from the University of Lagos and the Yaba tech hub. Both bedrooms are en suite, the kitchen has new cabinets, and there is space for one car. Water comes from a treated borehole and the building has a prepaid meter.',
    status: 'published',
    ageDays: 21,
  },
  {
    id: 'l_surulere',
    landlordId: 'u_owner5',
    title: 'Mini flat with balcony in Surulere',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    city: 'Lagos',
    area: 'Surulere',
    address: '3 Adeniran Ogunsanya Street, Surulere',
    rentNaira: 1_200_000,
    fees: { serviceCharge: 100_000, cautionDeposit: 120_000, legalFee: 60_000 },
    cover: 'apartment-01',
    amenities: AMENITIES.basic,
    description:
      'A compact one-bedroom flat with a private balcony, close to Adeniran Ogunsanya shopping mall and the National Stadium. Freshly painted, with tiled floors throughout and a separate kitchen. Ideal for a single professional or a couple.',
    status: 'published',
    ageDays: 30,
  },
  {
    id: 'l_ikeja',
    landlordId: 'u_owner5',
    title: '3-bedroom bungalow in Ikeja GRA',
    type: 'house',
    bedrooms: 3,
    bathrooms: 3,
    furnished: false,
    city: 'Lagos',
    area: 'Ikeja GRA',
    address: '9 Isaac John Street, Ikeja GRA',
    rentNaira: 5_500_000,
    fees: { serviceCharge: 400_000, cautionDeposit: 550_000, legalFee: 275_000 },
    cover: 'house-08',
    amenities: AMENITIES.estate,
    description:
      'Single-storey family home on a quiet, tree-lined street in Ikeja GRA, with a large garden, a boys quarters and parking for three cars. Close to the airport and Ikeja City Mall.',
    status: 'published',
    ageDays: 2,
  },
  {
    id: 'l_lekki_duplex',
    landlordId: 'u_owner5',
    title: 'Terrace duplex in Lekki Phase 1',
    type: 'duplex',
    bedrooms: 4,
    bathrooms: 4,
    furnished: false,
    city: 'Lagos',
    area: 'Lekki Phase 1',
    address: '22 Admiralty Road, Lekki Phase 1',
    rentNaira: 9_000_000,
    fees: { serviceCharge: 900_000, cautionDeposit: 900_000, legalFee: 450_000 },
    cover: 'house-01',
    amenities: AMENITIES.estate,
    description:
      'Four-bedroom terrace duplex in a serviced estate off Admiralty Way, with a family lounge upstairs, a fitted kitchen, and a room for a live-in help. Two parking spaces per unit.',
    status: 'published',
    ageDays: 6,
  },
  {
    id: 'l_lekki',
    landlordId: 'u_owner1',
    title: 'Serviced 3-bedroom apartment in Lekki',
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 3,
    furnished: true,
    city: 'Lagos',
    area: 'Lekki Phase 1',
    address: '5 Fola Osibo Road, Lekki Phase 1',
    rentNaira: 7_500_000,
    fees: { serviceCharge: 1_200_000, cautionDeposit: 750_000, legalFee: 375_000 },
    cover: 'apartment-02',
    amenities: AMENITIES.luxury,
    description:
      'A fully serviced and furnished apartment with 24-hour power, a residents’ gym and pool, and a lift. All three bedrooms are en suite with fitted wardrobes. Service charge covers power, cleaning of common areas and security.',
    status: 'published',
    ageDays: 9,
  },
  {
    id: 'l_vi',
    landlordId: 'u_owner1',
    title: 'Modern 2-bedroom on Victoria Island',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: true,
    city: 'Lagos',
    area: 'Victoria Island',
    address: '11 Ligali Ayorinde Street, Victoria Island',
    rentNaira: 10_500_000,
    fees: { serviceCharge: 1_500_000, cautionDeposit: 1_050_000, legalFee: 525_000 },
    cover: 'house-03',
    amenities: AMENITIES.luxury,
    description:
      'Furnished two-bedroom apartment a short walk from the VI business district, with floor-to-ceiling windows, a fitted kitchen, and a shared rooftop terrace. 24-hour power and water are included in the service charge.',
    status: 'published',
    ageDays: 4,
  },
  {
    id: 'l_ajah',
    landlordId: 'u_owner3',
    title: '3-bedroom semi-detached duplex in Ajah',
    type: 'duplex',
    bedrooms: 3,
    bathrooms: 4,
    furnished: false,
    city: 'Lagos',
    area: 'Ajah',
    address: '7 Thomas Estate Road, Ajah',
    rentNaira: 4_200_000,
    fees: { serviceCharge: 300_000, cautionDeposit: 420_000, legalFee: 210_000 },
    cover: 'house-04',
    amenities: AMENITIES.estate,
    description:
      'Semi-detached duplex in a gated estate with good drainage and paved roads, close to Ajah market and the Lekki–Epe Expressway. Three en suite bedrooms, a guest toilet, and a small garden at the back.',
    status: 'published',
    ageDays: 12,
  },
  {
    id: 'l_ikoyi',
    landlordId: 'u_owner3',
    title: '4-bedroom detached house with pool in Ikoyi',
    type: 'house',
    bedrooms: 4,
    bathrooms: 5,
    furnished: false,
    city: 'Lagos',
    area: 'Ikoyi',
    address: '2 Bourdillon Close, Ikoyi',
    rentNaira: 28_000_000,
    fees: { serviceCharge: 2_500_000, cautionDeposit: 2_800_000, legalFee: 1_400_000 },
    cover: 'house-06',
    amenities: AMENITIES.luxury,
    description:
      'A detached family house on a private close in Old Ikoyi, with a pool, a large garden, staff quarters and parking for four cars. Recently renovated, with a new kitchen and bathrooms.',
    status: 'published',
    ageDays: 15,
  },
  {
    id: 'l_gbagada',
    landlordId: 'u_owner4',
    title: 'Self-contain in Gbagada Phase 2',
    type: 'studio',
    bedrooms: 0,
    bathrooms: 1,
    furnished: false,
    city: 'Lagos',
    area: 'Gbagada',
    address: '18 Diya Street, Gbagada Phase 2',
    rentNaira: 850_000,
    fees: { serviceCharge: 60_000, cautionDeposit: 85_000, legalFee: 42_500 },
    cover: 'house-08',
    amenities: AMENITIES.basic,
    description:
      'A neat self-contain with its own kitchenette and bathroom, in a quiet compound close to the Gbagada expressway and the Third Mainland Bridge. Suits one person.',
    status: 'published',
    ageDays: 3,
  },
  {
    id: 'l_wuse',
    landlordId: 'u_owner2',
    title: '2-bedroom flat in Wuse 2',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: false,
    city: 'Abuja',
    area: 'Wuse 2',
    address: '41 Aminu Kano Crescent, Wuse 2',
    rentNaira: 5_000_000,
    fees: { serviceCharge: 500_000, cautionDeposit: 500_000, legalFee: 250_000 },
    cover: 'apartment-02',
    amenities: AMENITIES.estate,
    description:
      'Well-kept two-bedroom flat on a quiet street just off Aminu Kano Crescent, walking distance to Banex Plaza and restaurants. Both bedrooms are en suite, with a separate guest toilet.',
    status: 'published',
    ageDays: 8,
  },
  {
    id: 'l_gwarinpa',
    landlordId: 'u_owner2',
    title: '3-bedroom terrace in Gwarinpa',
    type: 'house',
    bedrooms: 3,
    bathrooms: 3,
    furnished: false,
    city: 'Abuja',
    area: 'Gwarinpa',
    address: '6 3rd Avenue, Gwarinpa Estate',
    rentNaira: 3_800_000,
    fees: { serviceCharge: 250_000, cautionDeposit: 380_000, legalFee: 190_000 },
    cover: 'house-02',
    amenities: AMENITIES.estate,
    description:
      'Three-bedroom terrace house in Gwarinpa Estate, close to schools and the 3rd Avenue shops. Spacious living room, fitted kitchen, and a fenced compound shared with two other units.',
    status: 'published',
    ageDays: 18,
  },
  {
    id: 'l_maitama',
    landlordId: 'u_owner4',
    title: '5-bedroom detached duplex in Maitama',
    type: 'duplex',
    bedrooms: 5,
    bathrooms: 6,
    furnished: false,
    city: 'Abuja',
    area: 'Maitama',
    address: '15 Amazon Street, Maitama',
    rentNaira: 25_000_000,
    fees: { serviceCharge: 2_000_000, cautionDeposit: 2_500_000, legalFee: 1_250_000 },
    cover: 'house-05-dusk',
    amenities: AMENITIES.luxury,
    description:
      'A large detached duplex in Maitama with a cinema room, a study, two living rooms, and a pool. Five en suite bedrooms, a two-room boys quarters, and parking for five cars behind an electric gate.',
    status: 'published',
    ageDays: 25,
  },
  {
    id: 'l_jabi',
    landlordId: 'u_owner2',
    title: 'Furnished self-contain near Jabi Lake',
    type: 'studio',
    bedrooms: 0,
    bathrooms: 1,
    furnished: true,
    city: 'Abuja',
    area: 'Jabi',
    address: '2 Obafemi Awolowo Way, Jabi',
    rentNaira: 1_800_000,
    fees: { serviceCharge: 200_000, cautionDeposit: 180_000, legalFee: 90_000 },
    cover: 'apartment-01',
    amenities: ['24h power', 'Air conditioning', 'Security', 'Parking'],
    description:
      'A furnished self-contain a few minutes from Jabi Lake Mall, with a queen bed, a work desk, a kitchenette and air conditioning. 24-hour power is included in the service charge.',
    status: 'published',
    ageDays: 5,
  },
  {
    id: 'l_ph_gra',
    landlordId: 'u_owner6',
    title: '3-bedroom flat in GRA Phase 2',
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 3,
    furnished: false,
    city: 'Port Harcourt',
    area: 'GRA Phase 2',
    address: '12 Tombia Street, GRA Phase 2',
    rentNaira: 4_500_000,
    fees: { serviceCharge: 400_000, cautionDeposit: 450_000, legalFee: 225_000 },
    cover: 'apartment-03',
    amenities: AMENITIES.estate,
    description:
      'A spacious three-bedroom flat in a quiet, well-secured compound off Tombia Street, close to restaurants and the Pleasure Park. All rooms are en suite, with a large sitting room, a fitted kitchen and parking for two cars.',
    status: 'published',
    ageDays: 6,
  },
  {
    id: 'l_ibadan_bodija',
    landlordId: 'u_owner6',
    title: '3-bedroom bungalow in Bodija',
    type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    furnished: false,
    city: 'Ibadan',
    area: 'Bodija',
    address: '14 Osuntokun Avenue, Bodija',
    rentNaira: 1_800_000,
    fees: { serviceCharge: 0, cautionDeposit: 180_000, legalFee: 90_000 },
    cover: 'house-04',
    amenities: ['Prepaid meter', 'Borehole water', 'Security', 'Parking', 'Boys quarters'],
    description:
      'A detached three-bedroom bungalow on a tree-lined avenue in Bodija, a short drive from the University of Ibadan and UCH. It has a large compound with space for three cars, a boys quarters and a separate kitchen store.',
    status: 'published',
    ageDays: 10,
  },
  {
    id: 'l_enugu_independence',
    landlordId: 'u_owner2',
    title: '2-bedroom flat in Independence Layout',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: false,
    city: 'Enugu',
    area: 'Independence Layout',
    address: '7 Nza Street, Independence Layout',
    rentNaira: 2_000_000,
    fees: { serviceCharge: 150_000, cautionDeposit: 200_000, legalFee: 100_000 },
    cover: 'apartment-01',
    amenities: AMENITIES.basic,
    description:
      'A neat two-bedroom flat in a gated compound in Independence Layout, close to Government House and the Polo Park Mall. Both rooms are en suite, with tiled floors, wardrobes and a steady borehole supply.',
    status: 'published',
    ageDays: 4,
  },
];

/** Photo keys as stored on listings. The `sample/` prefix marks stock photos (see `isSample`). */
export function seedPhotos(cover: string): string[] {
  return [cover, ...INTERIORS].map((k) => `sample/${k}`);
}

export const SAMPLE_PHOTO_OPTIONS = Object.entries(SAMPLE_PHOTOS).map(([name, alt]) => ({ key: `sample/${name}`, url: photoUrl(name), alt }));

export function seedFees(fees: SeedListing['fees']): ListingFees {
  return {
    serviceCharge: fees.serviceCharge * 100,
    cautionDeposit: fees.cautionDeposit * 100,
    legalFee: fees.legalFee * 100,
  };
}

export const POLICIES: Omit<PolicyVersion, 'publishedAt'>[] = [
  {
    id: 'pol_landlord_v2',
    kind: 'landlord',
    version: 2,
    title: 'Landlord listing policy',
    bodyMd: [
      'You list only homes you own, or homes you have a signed mandate to let.',
      'Photos, prices and fees are current and complete. Rent, service charge, caution deposit and legal fee are all shown on the listing.',
      'You do not put phone numbers, emails, links or social handles in a listing. Tenants get your contact details after they pay.',
      'All payments for a home found on SkyHaven go through SkyHaven. Taking payment off the platform for a listed home leads to delisting and account suspension.',
      'Rent is held by SkyHaven until the tenant confirms move-in, or until 72 hours after the agreed move-in date if no problem is reported. Payouts go to your verified bank account in daily batches.',
    ].join('\n\n'),
  },
  {
    id: 'pol_tenant_v1',
    kind: 'tenant',
    version: 1,
    title: 'Tenant terms',
    bodyMd:
      'Your rent is held until you confirm you have moved in. If the home is materially different from the listing, report it before you confirm and we will review it. Refund protection applies only to payments made through SkyHaven.',
  },
];
