import { DefaultSeoProps } from 'next-seo';

export const defaultSEO: DefaultSeoProps = {
  titleTemplate: '%s | WiseBond',
  defaultTitle: 'WiseBond - Smart Home Loan Solutions in South Africa',
  description: 'Get the best home loan rates and mortgage advice in South Africa. Compare lenders, calculate repayments, and find your perfect home loan with WiseBond.',
  canonical: 'https://wisebond.co.za',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://wisebond.co.za',
    siteName: 'WiseBond',
    title: 'WiseBond - Smart Home Loan Solutions in South Africa',
    description: 'Get the best home loan rates and mortgage advice in South Africa. Compare lenders, calculate repayments, and find your perfect home loan with WiseBond.',
    images: [
      {
        url: 'https://wisebond.co.za/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WiseBond - Smart Home Loan Solutions',
      },
    ],
  },
  twitter: {
    handle: '@wisebond',
    site: '@wisebond',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#2563eb',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'author',
      content: 'WiseBond',
    },
    {
      name: 'keywords',
      content: 'home loan, mortgage, South Africa, property finance, bond calculator, home loan rates, mortgage broker, property investment',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ],
};

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'Smart Home Loan Solutions in South Africa',
    description: 'Compare the best home loan rates from leading South African banks. Calculate repayments, check affordability, and get expert mortgage advice.',
    keywords: 'home loan rates, mortgage calculator, bond comparison, South Africa property finance',
  },
  calculators: {
    title: 'Home Loan Calculators & Tools',
    description: 'Use our comprehensive home loan calculators to estimate repayments, check affordability, and compare different loan scenarios.',
    keywords: 'bond calculator, mortgage calculator, home loan affordability, repayment calculator',
  },
  guidance: {
    title: 'Home Buying Guide & Mortgage Advice',
    description: 'Expert guidance on buying a home in South Africa. Learn about the mortgage process, requirements, and tips for first-time buyers.',
    keywords: 'home buying guide, mortgage advice, first-time buyer, property buying process',
  },
  contact: {
    title: 'Contact WiseBond - Get Expert Mortgage Advice',
    description: 'Get in touch with our mortgage experts for personalized home loan advice and assistance with your property finance needs.',
    keywords: 'contact mortgage broker, home loan advice, property finance consultation',
  },
  about: {
    title: 'About WiseBond - Your Trusted Mortgage Partner',
    description: 'Learn about WiseBond\'s mission to simplify home loan processes and help South Africans achieve their property dreams.',
    keywords: 'about WiseBond, mortgage broker, property finance company',
  },
  services: {
    title: 'Mortgage Services & Home Loan Solutions',
    description: 'Comprehensive mortgage services including loan comparison, application assistance, and expert advice for South African homebuyers.',
    keywords: 'mortgage services, home loan assistance, property finance solutions',
  },
  profile: {
    title: 'My Account - WiseBond',
    description: 'Manage your WiseBond account, view saved calculations, and track your mortgage applications.',
    keywords: 'account management, saved calculations, mortgage tracking',
  },
  login: {
    title: 'Login - WiseBond',
    description: 'Sign in to your WiseBond account to access your personalized mortgage tools and saved calculations.',
    keywords: 'login, sign in, WiseBond account',
  },
  signup: {
    title: 'Sign Up - WiseBond',
    description: 'Create your free WiseBond account to save calculations, compare loans, and get personalized mortgage advice.',
    keywords: 'sign up, register, create account, WiseBond',
  },
};

// Dynamic SEO helper function
export const getPageSEO = (page: keyof typeof pageSEO, customData?: Partial<DefaultSeoProps>) => {
  const baseSEO = pageSEO[page];
  return {
    ...baseSEO,
    ...customData,
  };
}; 