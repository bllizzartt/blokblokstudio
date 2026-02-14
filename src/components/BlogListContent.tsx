'use client';

import { blogPosts } from '@/data/blog';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const categoryColors: Record<string, string> = {
  'Web Design': 'from-blue-600/30 to-indigo-900/30',
  'SEO': 'from-green-600/30 to-emerald-900/30',
  'Branding': 'from-purple-600/30 to-pink-900/30',
};

export function BlogListContent() {
  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            Insights
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Expert tips on web design, branding, SEO, and growing your digital presence.
          </p>
        </AnimatedSection>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {blogPosts.map((post, i) => (
            <AnimatedSection key={post.slug} delay={i * 0.1}>
              <Link href={`/blog/${post.slug}`}>
                <motion.article
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden group cursor-pointer h-full flex flex-col"
                >
                  {/* Image area with gradient fallback */}
                  <div className={`aspect-[16/10] relative overflow-hidden bg-gradient-to-br ${categoryColors[post.category] || 'from-gray-700/30 to-gray-900/30'}`}>
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Overlay to ensure readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                    {/* Category badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white font-medium border border-white/10">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      <span>&middot;</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-white transition-colors leading-snug">
                      {post.title}
                    </h2>

                    <p className="text-gray-500 text-sm leading-relaxed flex-1">
                      {post.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 group-hover:text-white transition-colors">
                      Read article
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </motion.article>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
