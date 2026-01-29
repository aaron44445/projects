export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Peacase',
    url: 'https://peacase.com',
    logo: 'https://peacase.com/logo.png',
    description: 'Premium spa and salon management software. Everything you need to run your salon. Nothing you dont.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@peacase.com',
      contactType: 'customer service',
    },
    sameAs: [
      'https://twitter.com/peacase',
      'https://linkedin.com/company/peacase',
      'https://instagram.com/peacase',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
