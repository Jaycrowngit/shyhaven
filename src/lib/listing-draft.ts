import type { ListingType, OwnershipDocKind } from './types';

/** Listing wizard values as typed. Numbers stay strings until validation so inputs can be cleared. */
export interface WizardValues {
  title: string;
  type: ListingType;
  bedrooms: string;
  bathrooms: string;
  furnished: boolean;
  description: string;
  amenities: string[];
  city: string;
  area: string;
  address: string;
  rent: string;
  serviceCharge: string;
  cautionDeposit: string;
  legalFee: string;
  availableFrom: string;
  photoKeys: string[];
  documents: { kind: OwnershipDocKind; fileName: string }[];
}

export const emptyWizardValues = (today: string): WizardValues => ({
  title: '',
  type: 'apartment',
  bedrooms: '2',
  bathrooms: '2',
  furnished: false,
  description: '',
  amenities: [],
  city: 'Lagos',
  area: '',
  address: '',
  rent: '',
  serviceCharge: '0',
  cautionDeposit: '0',
  legalFee: '0',
  availableFrom: today,
  photoKeys: [],
  documents: [],
});
