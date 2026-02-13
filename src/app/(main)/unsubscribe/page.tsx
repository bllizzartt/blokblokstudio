import type { Metadata } from 'next';
import { UnsubscribeContent } from '@/components/UnsubscribeContent';

export const metadata: Metadata = {
  title: 'Unsubscribe | Blok Blok Studio',
  description: 'Unsubscribe from our emails',
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <div className="page-transition">
      <UnsubscribeContent />
    </div>
  );
}
