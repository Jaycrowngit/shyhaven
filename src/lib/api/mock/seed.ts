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
  'flats-lagos-01': 'Block of flats with terracotta balconies',
  'compound-ibadan-01': 'Fenced compound with a gate and a two-storey house',
  'flats-abuja-01': 'Colourful block of flats behind trees',
  'flats-render-01': 'Two-storey block of flats behind a fence',
  'house-oyo-01': 'Two-storey house with an upstairs balcony',
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
  estate: ['Prepaid meter', 'Borehole water', 'Gated estate', 'Security', 'Parking', 'Waste disposal'],
};

/**
 * Affordable homes only. Annual rent by size, depending on location:
 * 1 room (self-contain or mini flat) ₦250,000–₦350,000 · 2 rooms ₦300,000–₦600,000 · 3 rooms ₦500,000–₦1,000,000.
 * Every listing has its own cover photo; no two homes share one.
 */
export const SEED_LISTINGS: SeedListing[] = [
  {
    id: 'l_surulere',
    landlordId: 'u_owner5',
    title: 'Mini flat in Surulere',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    city: 'Lagos',
    area: 'Surulere',
    address: '3 Adeniran Ogunsanya Street, Surulere',
    rentNaira: 350_000,
    fees: { serviceCharge: 0, cautionDeposit: 35_000, legalFee: 17_500 },
    cover: 'apartment-01',
    amenities: AMENITIES.basic,
    description:
      'A one-bedroom mini flat with its own kitchen and toilet, close to Adeniran Ogunsanya shopping mall and the National Stadium. Freshly painted, with tiled floors. Suits a single professional or a couple.',
    status: 'published',
    ageDays: 30,
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
    rentNaira: 300_000,
    fees: { serviceCharge: 0, cautionDeposit: 30_000, legalFee: 15_000 },
    cover: 'bedroom-02',
    amenities: AMENITIES.basic,
    description:
      'A neat self-contain with a kitchenette and its own bathroom, in a quiet compound close to the Gbagada expressway. Suits one person.',
    status: 'published',
    ageDays: 3,
  },
  {
    id: 'l_lugbe',
    landlordId: 'u_owner2',
    title: 'Self-contain in Lugbe',
    type: 'studio',
    bedrooms: 0,
    bathrooms: 1,
    furnished: false,
    city: 'Abuja',
    area: 'Lugbe',
    address: '9 Federal Housing Road, Lugbe',
    rentNaira: 280_000,
    fees: { serviceCharge: 0, cautionDeposit: 28_000, legalFee: 14_000 },
    cover: 'bedroom-01',
    amenities: AMENITIES.basic,
    description:
      'A tidy self-contain in a fenced compound off the airport road, a short ride to the city centre. Own kitchenette and bathroom, prepaid meter and borehole water.',
    status: 'published',
    ageDays: 5,
  },
  {
    id: 'l_rumuokoro',
    landlordId: 'u_owner6',
    title: 'Mini flat in Rumuokoro',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    city: 'Port Harcourt',
    area: 'Rumuokoro',
    address: '4 Okporo Road, Rumuokoro',
    rentNaira: 300_000,
    fees: { serviceCharge: 0, cautionDeposit: 30_000, legalFee: 15_000 },
    cover: 'kitchen-01',
    amenities: AMENITIES.basic,
    description:
      'A one-bedroom mini flat in a compound of six units, close to Rumuokoro junction and the Ikwerre Road shops. Separate kitchen, tiled floors and a prepaid meter.',
    status: 'published',
    ageDays: 6,
  },
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
    rentNaira: 550_000,
    fees: { serviceCharge: 0, cautionDeposit: 55_000, legalFee: 27_500 },
    cover: 'apartment-03',
    amenities: AMENITIES.basic,
    description:
      'A bright second-floor flat in a quiet compound, ten minutes from the University of Lagos. Both bedrooms have their own toilet, the kitchen has new cabinets, and water comes from a treated borehole.',
    status: 'published',
    ageDays: 21,
  },
  {
    id: 'l_ogba',
    landlordId: 'u_owner1',
    title: '2-bedroom flat in Ogba',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: false,
    city: 'Lagos',
    area: 'Ogba',
    address: '11 Acme Road, Ogba',
    rentNaira: 600_000,
    fees: { serviceCharge: 0, cautionDeposit: 60_000, legalFee: 30_000 },
    cover: 'living-room-01',
    amenities: AMENITIES.basic,
    description:
      'A two-bedroom flat in a gated compound close to Ogba market and Ikeja. Spacious sitting room, a separate kitchen and parking for one car.',
    status: 'published',
    ageDays: 4,
  },
  {
    id: 'l_kubwa',
    landlordId: 'u_owner2',
    title: '2-bedroom flat in Kubwa',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: false,
    city: 'Abuja',
    area: 'Kubwa',
    address: '27 Gado Nasko Road, Kubwa',
    rentNaira: 500_000,
    fees: { serviceCharge: 30_000, cautionDeposit: 50_000, legalFee: 25_000 },
    cover: 'kitchen-02',
    amenities: AMENITIES.estate,
    description:
      'A two-bedroom flat in a small estate on Gado Nasko Road, close to the Kubwa market and the expressway. Both rooms have their own toilet, with a guest toilet by the sitting room.',
    status: 'published',
    ageDays: 8,
  },
  {
    id: 'l_enugu',
    landlordId: 'u_owner2',
    title: '2-bedroom flat in Independence Layout',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: false,
    city: 'Enugu',
    area: 'Independence Layout',
    address: '7 Nza Street, Independence Layout',
    rentNaira: 400_000,
    fees: { serviceCharge: 0, cautionDeposit: 40_000, legalFee: 20_000 },
    cover: 'house-01',
    amenities: AMENITIES.basic,
    description:
      'A neat two-bedroom flat in a gated two-storey block in Independence Layout, close to Polo Park Mall. Tiled floors, wardrobes in both rooms and a steady borehole supply.',
    status: 'published',
    ageDays: 4,
  },
  {
    id: 'l_ikorodu',
    landlordId: 'u_owner3',
    title: '3-bedroom bungalow in Ikorodu',
    type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    furnished: false,
    city: 'Lagos',
    area: 'Ikorodu',
    address: '5 Ebute Road, Ikorodu',
    rentNaira: 700_000,
    fees: { serviceCharge: 0, cautionDeposit: 70_000, legalFee: 35_000 },
    cover: 'house-08',
    amenities: AMENITIES.basic,
    description:
      'A three-bedroom bungalow in a fenced compound with space for two cars, close to Ikorodu garage and the BRT terminal. Large sitting room and a separate kitchen.',
    status: 'published',
    ageDays: 2,
  },
  {
    id: 'l_ajah',
    landlordId: 'u_owner3',
    title: '3-bedroom flat in Ajah',
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 3,
    furnished: false,
    city: 'Lagos',
    area: 'Ajah',
    address: '7 Thomas Estate Road, Ajah',
    rentNaira: 1_000_000,
    fees: { serviceCharge: 60_000, cautionDeposit: 100_000, legalFee: 50_000 },
    cover: 'apartment-02',
    amenities: AMENITIES.estate,
    description:
      'A three-bedroom flat in a gated estate with paved roads and good drainage, close to Ajah market and the Lekki–Epe Expressway. All rooms have their own toilet.',
    status: 'published',
    ageDays: 12,
  },
  {
    id: 'l_bodija',
    landlordId: 'u_owner6',
    title: '3-bedroom bungalow in Bodija',
    type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    furnished: false,
    city: 'Ibadan',
    area: 'Bodija',
    address: '14 Osuntokun Avenue, Bodija',
    rentNaira: 650_000,
    fees: { serviceCharge: 0, cautionDeposit: 65_000, legalFee: 32_500 },
    cover: 'house-04',
    amenities: AMENITIES.basic,
    description:
      'A three-bedroom bungalow on a tree-lined avenue in Bodija, a short drive from the University of Ibadan and UCH. Large compound with space for three cars.',
    status: 'published',
    ageDays: 10,
  },
  {
    id: 'l_akobo',
    landlordId: 'u_owner6',
    title: 'Mini flat in Akobo',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    city: 'Ibadan',
    area: 'Akobo',
    address: '6 Ojurin Road, Akobo',
    rentNaira: 250_000,
    fees: { serviceCharge: 0, cautionDeposit: 25_000, legalFee: 12_500 },
    cover: 'compound-ibadan-01',
    amenities: AMENITIES.basic,
    description:
      'A one-bedroom mini flat in a gated compound on a quiet street in Akobo, with a borehole and a security gate. Separate kitchen and a prepaid meter.',
    status: 'published',
    ageDays: 7,
  },
  {
    id: 'l_abakpa',
    landlordId: 'u_owner2',
    title: 'Self-contain in Abakpa Nike',
    type: 'studio',
    bedrooms: 0,
    bathrooms: 1,
    furnished: false,
    city: 'Enugu',
    area: 'Abakpa Nike',
    address: '21 Ugwogo Road, Abakpa Nike',
    rentNaira: 250_000,
    fees: { serviceCharge: 0, cautionDeposit: 25_000, legalFee: 12_500 },
    cover: 'house-oyo-01',
    amenities: AMENITIES.basic,
    description:
      'A self-contain on the upper floor of a two-storey house, with its own kitchenette and bathroom and a shared balcony. Close to Abakpa market.',
    status: 'published',
    ageDays: 9,
  },
  {
    id: 'l_dutse',
    landlordId: 'u_owner1',
    title: '2-bedroom flat in Dutse Alhaji',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnished: false,
    city: 'Abuja',
    area: 'Dutse Alhaji',
    address: '3 Dutse–Bwari Road, Dutse Alhaji',
    rentNaira: 450_000,
    fees: { serviceCharge: 0, cautionDeposit: 45_000, legalFee: 22_500 },
    cover: 'flats-abuja-01',
    amenities: AMENITIES.basic,
    description:
      'A two-bedroom flat on the second floor of a well-kept block, a short drive to Kubwa and the Bwari road. Both rooms have wardrobes, with a separate kitchen and a guest toilet.',
    status: 'published',
    ageDays: 11,
  },
  {
    id: 'l_ojodu',
    landlordId: 'u_owner4',
    title: '3-bedroom flat in Ojodu Berger',
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 3,
    furnished: false,
    city: 'Lagos',
    area: 'Ojodu',
    address: '15 Ogunnusi Road, Ojodu',
    rentNaira: 900_000,
    fees: { serviceCharge: 0, cautionDeposit: 90_000, legalFee: 45_000 },
    cover: 'flats-lagos-01',
    amenities: AMENITIES.basic,
    description:
      'A three-bedroom flat in a new block off Ogunnusi Road, close to Berger bus stop and the Lagos–Ibadan Expressway. All rooms have their own toilet, with a balcony off the sitting room.',
    status: 'published',
    ageDays: 1,
  },
  {
    id: 'l_eliozu',
    landlordId: 'u_owner6',
    title: '3-bedroom flat in Eliozu',
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 2,
    furnished: false,
    city: 'Port Harcourt',
    area: 'Eliozu',
    address: '8 Eliozu Road, Eliozu',
    rentNaira: 800_000,
    fees: { serviceCharge: 40_000, cautionDeposit: 80_000, legalFee: 40_000 },
    cover: 'flats-render-01',
    amenities: AMENITIES.estate,
    description:
      'A three-bedroom flat in a fenced two-storey block in Eliozu, close to the East–West Road. Large sitting room, a fitted kitchen and parking inside the compound.',
    status: 'published',
    ageDays: 14,
  },
];

/** Photo keys as stored on listings: the listing's own cover first, then interiors. The `sample/` prefix marks stock photos (see `isSample`). */
export function seedPhotos(cover: string): string[] {
  return [cover, ...INTERIORS.filter((k) => k !== cover)].slice(0, 5).map((k) => `sample/${k}`);
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
