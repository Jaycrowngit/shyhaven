import type { Metadata } from 'next';
import { ResetFlow } from '@/components/auth/reset-flow';

export const metadata: Metadata = { title: 'Reset your password', robots: { index: false } };

/** Works whether or not the visitor is signed in, so a forgotten password can be changed from anywhere. */
export default function ForgotPasswordPage() {
  return <ResetFlow />;
}
