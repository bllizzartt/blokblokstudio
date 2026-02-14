export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService'],
    name: 'Blok Blok Studio',
    url: 'https://blokblokstudio.com',
    logo: 'https://blokblokstudio.com/logo.png',
    description:
      'A creative digital agency crafting bold brands, stunning websites, and digital products that move people.',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-000-0000',
      contactType: 'customer service',
      email: 'hello@blokblokstudio.com',
      availableLanguage: ['English', 'German', 'French', 'Spanish'],
    },
    sameAs: [
      'https://www.instagram.com/blokblokstudio/',
      'https://www.linkedin.com/company/blok-blok-studio/',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Creative Ave',
      addressLocality: 'Design District',
    },
    areaServed: {
      '@type': 'GeoShape',
      name: 'Worldwide',
    },
    priceRange: '$$',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Digital Services',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Web Design & Development',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Custom Website Design' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web Application Development' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'E-Commerce Solutions' } },
          ],
        },
        {
          '@type': 'OfferCatalog',
          name: 'Branding & Identity',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Brand Strategy' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Visual Identity Design' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Brand Guidelines' } },
          ],
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Blok Blok Studio',
    url: 'https://blokblokstudio.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://blokblokstudio.com/projects?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `https://blokblokstudio.com${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServiceSchema() {
  const services = [
    {
      name: 'Web Design & Development',
      description: 'Custom websites built with modern technologies. Fast, responsive, and conversion-optimized.',
    },
    {
      name: 'Brand Identity & Strategy',
      description: 'Complete brand identity including logo design, visual systems, and brand guidelines.',
    },
    {
      name: 'Mobile App Development',
      description: 'Native and cross-platform mobile applications designed for performance and user engagement.',
    },
    {
      name: 'Digital Marketing & SEO',
      description: 'Data-driven marketing strategies including SEO, content marketing, and conversion optimization.',
    },
    {
      name: 'UI/UX Design',
      description: 'User-centered interface design that balances aesthetics with usability and accessibility.',
    },
  ];

  const schema = services.map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    provider: {
      '@type': 'Organization',
      name: 'Blok Blok Studio',
      url: 'https://blokblokstudio.com',
    },
    description: service.description,
    areaServed: 'Worldwide',
  }));

  return (
    <>
      {schema.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Blok Blok Studio',
    image: 'https://blokblokstudio.com/og-image.jpg',
    url: 'https://blokblokstudio.com',
    telephone: '+1-555-000-0000',
    email: 'hello@blokblokstudio.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Creative Ave',
      addressLocality: 'Design District',
    },
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    numberOfEmployees: '3',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
