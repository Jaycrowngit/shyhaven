import type { LandlordProfile } from './types';

/** The three things a landlord needs before they can submit a listing (Blueprint 04, submit guard). */
export function setupSteps(p: LandlordProfile) {
  return [
    { key: 'kyc', label: 'Verify your identity', done: p.kycStatus === 'verified' },
    { key: 'payout', label: 'Add the bank account for your rent', done: p.payoutAccount !== null },
    { key: 'policy', label: 'Accept the landlord policy', done: p.acceptedPolicyVersionId === p.currentPolicy.id },
  ] as const;
}

export const isSetupComplete = (p: LandlordProfile) => setupSteps(p).every((s) => s.done);
