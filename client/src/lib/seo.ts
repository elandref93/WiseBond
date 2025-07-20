import { DefaultSeoProps } from 'next-seo';

export const defaultSEO: DefaultSeoProps = {
  titleTemplate: '%s | WiseBond - South Africa\'s #1 Home Loan Originator',
  defaultTitle: 'WiseBond - Compare Home Loan Rates & Get Mortgage Advice in South Africa',
  description: 'Compare the best home loan rates from all major South African banks. Get expert mortgage advice, calculate repayments, and apply for your dream home loan with WiseBond. Free service, no hidden fees.',
  canonical: 'https://wisebond.co.za',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://wisebond.co.za',
    siteName: 'WiseBond',
    title: 'WiseBond - Compare Home Loan Rates & Get Mortgage Advice in South Africa',
    description: 'Compare the best home loan rates from all major South African banks. Get expert mortgage advice, calculate repayments, and apply for your dream home loan with WiseBond. Free service, no hidden fees.',
    images: [
      {
        url: 'https://wisebond.co.za/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WiseBond - Smart Home Loan Solutions in South Africa',
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
      content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    },
    {
      name: 'author',
      content: 'WiseBond',
    },
    {
      name: 'keywords',
      content: 'home loan South Africa, mortgage rates, bond calculator, property finance, home loan comparison, mortgage broker Johannesburg, Cape Town home loans, first-time buyer, property investment, home loan application, bond origination, mortgage advice, home loan rates 2025, property buying guide',
    },
    {
      name: 'google-analytics',
      content: 'G-XNFR4FQSPR',
    },
    {
      name: 'geo.region',
      content: 'ZA',
    },
    {
      name: 'geo.placename',
      content: 'South Africa',
    },
    {
      name: 'geo.position',
      content: '-30.5595;22.9375',
    },
    {
      name: 'ICBM',
      content: '-30.5595, 22.9375',
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
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      href: '/rss.xml',
    },
  ],
};

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'Compare Home Loan Rates & Get Mortgage Advice in South Africa',
    description: 'Compare the best home loan rates from Standard Bank, FNB, Absa, Nedbank & more. Calculate repayments, check affordability & get expert mortgage advice. Free service, no hidden fees.',
    keywords: 'home loan rates South Africa, mortgage calculator, bond comparison, property finance Johannesburg, Cape Town home loans, first-time buyer mortgage, home loan application, mortgage broker',
  },
  calculators: {
    title: 'Free Home Loan Calculators & Mortgage Tools | WiseBond',
    description: 'Use our free home loan calculators to estimate repayments, check affordability, compare different loan scenarios & find the best mortgage rates in South Africa.',
    keywords: 'bond calculator, mortgage calculator, home loan affordability, repayment calculator, bond repayment calculator, home loan comparison tool, mortgage affordability calculator',
  },
  guidance: {
    title: 'Home Buying Guide & Mortgage Advice South Africa',
    description: 'Expert guidance on buying a home in South Africa. Learn about the mortgage process, requirements, tips for first-time buyers & how to get the best home loan rates.',
    keywords: 'home buying guide South Africa, mortgage advice, first-time buyer guide, property buying process, home loan requirements, mortgage application guide, property investment tips',
  },
  contact: {
    title: 'Contact WiseBond - Get Expert Mortgage Advice & Home Loan Help',
    description: 'Get in touch with our mortgage experts for personalized home loan advice, application assistance & help finding the best rates from South African banks.',
    keywords: 'contact mortgage broker, home loan advice, property finance consultation, mortgage expert Johannesburg, Cape Town mortgage broker, home loan application help',
  },
  about: {
    title: 'About WiseBond - Your Trusted Mortgage Partner in South Africa',
    description: 'Learn about WiseBond\'s mission to simplify home loan processes & help South Africans achieve their property dreams. We work with all major banks to find you the best rates.',
    keywords: 'about WiseBond, mortgage broker South Africa, property finance company, home loan originator, mortgage partner, trusted mortgage advisor',
  },
  services: {
    title: 'Mortgage Services & Home Loan Solutions | WiseBond',
    description: 'Comprehensive mortgage services including loan comparison, application assistance, expert advice & personalized home loan solutions for South African homebuyers.',
    keywords: 'mortgage services, home loan assistance, property finance solutions, bond origination, mortgage application help, home loan comparison service',
  },
  profile: {
    title: 'My Account - Manage Your WiseBond Home Loan Applications',
    description: 'Manage your WiseBond account, view saved calculations, track your mortgage applications & access personalized home loan recommendations.',
    keywords: 'account management, saved calculations, mortgage tracking, home loan applications, personal dashboard, mortgage account',
  },
  login: {
    title: 'Login to WiseBond - Access Your Mortgage Tools & Applications',
    description: 'Sign in to your WiseBond account to access your personalized mortgage tools, saved calculations & track your home loan applications.',
    keywords: 'login, sign in, WiseBond account, mortgage account access, home loan portal',
  },
  signup: {
    title: 'Sign Up for WiseBond - Start Your Home Loan Journey',
    description: 'Create your free WiseBond account to save calculations, compare loans, get personalized mortgage advice & start your home buying journey.',
    keywords: 'sign up, register, create account, WiseBond, home loan account, mortgage tools access',
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