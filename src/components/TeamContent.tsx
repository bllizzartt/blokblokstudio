'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

const teamMembers = [
  { name: 'Alex Morgan', roleKey: 'role_ceo' as const, initials: 'AM' },
  { name: 'Jordan Rivera', roleKey: 'role_creative' as const, initials: 'JR' },
  { name: 'Sam Chen', roleKey: 'role_tech' as const, initials: 'SC' },
  { name: 'Taylor Kim', roleKey: 'role_design' as const, initials: 'TK' },
  { name: 'Morgan Blake', roleKey: 'role_marketing' as const, initials: 'MB' },
  { name: 'Casey Wright', roleKey: 'role_dev' as const, initials: 'CW' },
];

export function TeamContent() {
  const t = useTranslations('team');

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-14 sm:mb-20 lg:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* Team Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {teamMembers.map((member, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="group"
              >
                <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
                  {/* Avatar placeholder */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/20 group-hover:scale-110 transition-all duration-500">
                        <span className="text-xl sm:text-2xl font-bold text-white/20 group-hover:text-white/40 transition-colors">
                          {member.initials}
                        </span>
                      </div>
                    </div>

                    {/* Hover overlay with social links */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500 flex items-end justify-center pb-6">
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        {['Twitter', 'LinkedIn', 'Dribbble'].map((social) => (
                          <a
                            key={social}
                            href="#"
                            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <span className="text-xs">{social[0]}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-6 text-center">
                    <h3 className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{t(member.roleKey)}</p>
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
