/**
 * ============================================================================
 * HomeTestimonials.tsx — Client Testimonials Section (Homepage)
 * ============================================================================
 *
 * PURPOSE:
 *   Displays a grid of client testimonial cards on the homepage to build
 *   trust and credibility. Each card shows a quote, the client's name,
 *   their role/company, and a placeholder avatar.
 *
 * TRANSLATIONS:
 *   Text comes from the "home" namespace:
 *     - home.testimonials_heading  → section heading
 *     - home.testimonials_subtitle → section subtitle
 *
 * TESTIMONIAL DATA:
 *   All testimonial data is hardcoded in the `testimonials` array below.
 *   Each entry has: quote, name, role, initials.
 *
 * TO EDIT TESTIMONIALS:
 *   - Change quote text → edit the `quote` field directly
 *   - Change person info → edit `name`, `role`, `initials`
 *   - Add a testimonial → add a new object to the array
 *   - Remove one → delete the object from the array
 *
 * TO REPLACE AVATAR PLACEHOLDERS WITH REAL PHOTOS:
 *   Add a `photo` field to each testimonial object (e.g., '/images/clients/jane.jpg')
 *   and replace the initials circle with an <Image> component.
 *
 * STYLING:
 *   - Uses Tailwind CSS + glass-card utility.
 *   - Responsive: 1 col mobile, 2 cols sm, 3 cols lg.
 *   - Cards lift on hover via framer-motion.
 *
 * REFERENCED FILES / DEPENDENCIES:
 *   - ./AnimatedSection → scroll-triggered reveal animation wrapper
 *   - next-intl         → translations (useTranslations)
 *   - framer-motion     → hover animations (motion.div)
 *
 * ============================================================================
 */

'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

/**
 * ---------------------------------------------------------------------------
 * Testimonials Data Array (Hardcoded)
 * ---------------------------------------------------------------------------
 * Each testimonial object contains:
 *   - quote:    The client's testimonial text
 *   - name:     Client name
 *   - role:     Client's role and company
 *   - initials: 2-letter initials for the avatar placeholder
 *
 * TO ADD A TESTIMONIAL:
 *   Add a new object with all four fields.
 *
 * TO EDIT:
 *   Change any field directly in the object.
 *
 * TO REMOVE:
 *   Delete the entire object from the array.
 * ---------------------------------------------------------------------------
 */
const testimonials = [
  {
    quote: 'Blok Blok Studio transformed my online presence completely. The bold design perfectly captures my coaching philosophy and the results have been incredible.',
    name: 'Kofi',
    role: 'Founder, Coach Kofi',
    initials: 'CK',
  },
  {
    quote: 'Working with this team was an absolute pleasure. They understood our brand instantly and delivered a website that builds trust with families from the first click.',
    name: 'Nanny & Nest Team',
    role: 'Nanny & Nest',
    initials: 'NN',
  },
  {
    quote: 'The e-commerce store they built for us is incredible. Our booster pack drops sell out in hours and the community engagement through the site has been amazing.',
    name: 'Exotic Ripz',
    role: 'Exotic Ripz',
    initials: 'ER',
  },
];

export function HomeTestimonials() {
  const t = useTranslations('home');

  return (
    /* Section wrapper with responsive padding */
    <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ================================================================
            Section Header (Title + Subtitle)
            ================================================================
            TO EDIT: Change "home.testimonials_heading" and
            "home.testimonials_subtitle" in your translation files.
        */}
        <AnimatedSection className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            {t('testimonials_heading')}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            {t('testimonials_subtitle')}
          </p>
        </AnimatedSection>

        {/* ================================================================
            Testimonials Grid
            ================================================================
            Responsive: 1 col mobile, 2 cols sm, 3 cols lg.
            Each card has a staggered entrance animation.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              {/* Card lifts up 6px on hover */}
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full flex flex-col"
              >
                {/* Star rating — 5 filled stars */}
                <div className="flex gap-1 mb-4 sm:mb-6">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="w-4 h-4 text-white/40"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 sm:mb-8 flex-1">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Client info — avatar + name + role */}
                <div className="flex items-center gap-3">
                  {/*
                    Avatar placeholder — circle with initials.

                    TO REPLACE WITH REAL PHOTO:
                      Add `photo` field to testimonial object, then:
                      <Image src={testimonial.photo} alt={testimonial.name}
                             width={40} height={40}
                             className="rounded-full object-cover" />
                  */}
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white/60">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    {/* Client name */}
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    {/* Client role + company */}
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
