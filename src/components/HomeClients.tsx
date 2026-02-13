/**
 * ============================================================================
 * HomeClients.tsx — "Trusted By" Client Logo Bar (Homepage)
 * ============================================================================
 *
 * PURPOSE:
 *   Displays a horizontal row of client/partner logos on the homepage to
 *   build trust and social proof. Shows placeholder boxes until real logos
 *   are added.
 *
 * TRANSLATIONS:
 *   Text comes from the "home" namespace:
 *     - home.clients_heading → section heading (e.g., "Trusted By")
 *
 * TO ADD REAL CLIENT LOGOS:
 *   1. Place logo images in /public/images/clients/ (e.g., client-1.svg)
 *   2. Update the `clients` array below — change `logo` from null to the path
 *   3. The component will render an <Image> instead of the placeholder box
 *
 * STYLING:
 *   - Uses Tailwind CSS utility classes.
 *   - Responsive: scrollable on mobile, grid on larger screens.
 *   - Logos have a grayscale filter + low opacity, brightening on hover.
 *
 * REFERENCED FILES / DEPENDENCIES:
 *   - ./AnimatedSection → scroll-triggered reveal animation wrapper
 *   - next-intl         → translations (useTranslations)
 *   - next/image        → optimized image rendering (when logos are added)
 *
 * ============================================================================
 */

'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';

/**
 * ---------------------------------------------------------------------------
 * Client Data Array
 * ---------------------------------------------------------------------------
 * Each client object has:
 *   - name: Company name (shown as alt text / placeholder text)
 *   - logo: Path to logo image in /public/, or null for placeholder
 *
 * TO ADD A CLIENT:
 *   Add { name: 'Company', logo: '/images/clients/company.svg' }
 *
 * TO REMOVE A CLIENT:
 *   Delete the object from the array.
 * ---------------------------------------------------------------------------
 */
const clients = [
  { name: 'Coach Kofi', logo: null },
  { name: 'Exotic Ripz', logo: null },
  { name: 'The New School', logo: null },
  { name: 'Public Affair', logo: null },
  { name: 'Nanny & Nest', logo: null },
];

export function HomeClients() {
  const t = useTranslations('home');

  return (
    /* Section wrapper — subtle top/bottom padding, centered */
    <section className="py-12 sm:py-16 lg:py-20 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Section heading — small, uppercase, centered */}
        <AnimatedSection className="text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500">
            {t('clients_heading')}
          </p>
        </AnimatedSection>

        {/* Logo grid — 3 cols on mobile, 6 on sm+ */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-8 items-center">
            {clients.map((client, i) => (
              /**
               * Individual client logo slot.
               * Currently renders a placeholder box with the company name.
               *
               * TO REPLACE WITH A REAL LOGO:
               *   Set `logo` in the clients array, then this will render:
               *   <Image src={client.logo} alt={client.name} ... />
               *   For now, it shows a text placeholder.
               */
              <div
                key={i}
                className="flex items-center justify-center h-12 sm:h-16 opacity-30 hover:opacity-60 transition-opacity duration-300"
              >
                {client.logo ? (
                  /* Real logo — uncomment and import Image from next/image when ready */
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">
                    {client.name}
                  </span>
                ) : (
                  /* Placeholder — shows company name in muted text */
                  <span className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">
                    {client.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
