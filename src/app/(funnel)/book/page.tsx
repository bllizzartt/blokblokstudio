import type { Metadata } from 'next';
import { FunnelContent } from '@/components/FunnelContent';

export const metadata: Metadata = {
  title: 'Book a Call | Blok Blok Studio',
  description: 'Book a free 15-minute discovery call with Blok Blok Studio. Let\'s discuss how we can bring your digital vision to life.',
  robots: { index: false, follow: false },
};

export default function BookPage() {
  return <FunnelContent />;
}
