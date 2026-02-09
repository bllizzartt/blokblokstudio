'use client';

import dynamic from 'next/dynamic';

const StarField = dynamic(
  () => import('./StarField').then((m) => ({ default: m.StarField })),
  { ssr: false }
);

export function StarFieldWrapper() {
  return <StarField />;
}
