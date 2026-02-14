'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

/**
 * Team Members Data
 * Each member includes bio details displayed in a codex/JSON-style card.
 * To add a new member, add an entry here and a matching role key in locale files.
 */
const teamMembers = [
  {
    name: 'Chase Haynes',
    roleKey: 'role_founder' as const,
    location: 'Berlin, Germany',
    studied: ['Design and Technology', 'Parsons School of Design'],
    enjoys: ['Art Museums', 'Traveling', 'Content Creation'],
    socials: {
      linkedin: 'https://www.linkedin.com/in/chase-haynes/',
      instagram: 'https://www.instagram.com/haynes2va/',
    },
  },
  {
    name: 'Kyle Talley',
    roleKey: 'role_graphic' as const,
    location: 'Richmond, Virginia, USA',
    studied: ['Creative Advertising', 'Virginia Commonwealth University'],
    enjoys: ['Brazilian Jiu Jitsu', 'Animation', 'Thrifting'],
    socials: {
      linkedin: 'https://www.linkedin.com/in/kylebtalley/',
      instagram: 'https://www.instagram.com/ta11ey_/',
    },
  },
  {
    name: 'Stephen Darling',
    roleKey: 'role_web' as const,
    location: 'Arlington, Virginia, USA',
    studied: ['Interactive Design and Computer Science', 'James Madison University'],
    enjoys: ['Movies', 'Film Photography', 'Cooking'],
    socials: {
      linkedin: '',
      instagram: 'https://www.instagram.com/stephen.darling/',
    },
  },
];

export function TeamContent() {
  const t = useTranslations('team');

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <AnimatedSection className="text-center mb-14 sm:mb-20 lg:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* Team Members — Codex-style Bio Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member, i) => (
            <AnimatedSection key={i} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950/40 border border-white/5">
                  {/* Subtle purple glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-800/20 pointer-events-none" />

                  <div className="relative p-6 sm:p-8 flex flex-col h-full">
                    {/* Name & Role */}
                    <div className="mb-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                        {member.name}
                      </h2>
                      <p className="text-gray-400 text-sm sm:text-base italic">
                        {t(member.roleKey)}
                      </p>
                    </div>

                    {/* Code Block — JSON-style bio */}
                    <div className="font-mono text-sm flex-1">
                      {/* Opening brace */}
                      <p className="text-white/80 mb-4">{'{'}</p>

                      {/* Based in */}
                      <div className="ml-4 mb-5">
                        <p className="text-gray-500 italic text-xs mb-1">&lt;Based in&gt;</p>
                        <p className="text-white font-semibold ml-6 text-sm sm:text-base font-sans">
                          {member.location}
                        </p>
                      </div>

                      {/* Studied */}
                      {member.studied.length > 0 && (
                        <div className="ml-4 mb-5">
                          <p className="text-gray-500 italic text-xs mb-1">&lt;Studied&gt;</p>
                          {member.studied.map((item, idx) => (
                            <p
                              key={idx}
                              className="text-white font-semibold ml-6 text-sm sm:text-base font-sans"
                            >
                              {item}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Enjoys */}
                      <div className="ml-4 mb-4">
                        <p className="text-gray-500 italic text-xs mb-1">&lt;Enjoys&gt;</p>
                        {member.enjoys.length > 0 ? (
                          member.enjoys.map((item, idx) => (
                            <p
                              key={idx}
                              className="text-white font-semibold ml-6 text-sm sm:text-base font-sans"
                            >
                              {item}
                            </p>
                          ))
                        ) : (
                          <div className="ml-6">
                            <p className="text-white/30">-</p>
                            <p className="text-white/30">-</p>
                            <p className="text-white/30">-</p>
                          </div>
                        )}
                      </div>

                      {/* Closing brace */}
                      <p className="text-white/80">{'}'}</p>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
                      {member.socials.linkedin && (
                        <a
                          href={member.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on LinkedIn`}
                          className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                      {member.socials.instagram && (
                        <a
                          href={member.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on Instagram`}
                          className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </a>
                      )}
                    </div>
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
