import React from 'react';
import { NextSeo } from 'next-seo';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    handle?: string;
    site?: string;
    cardType?: string;
  };
  additionalMetaTags?: Array<{
    name: string;
    content: string;
  }>;
  additionalLinkTags?: Array<{
    rel: string;
    href: string;
    sizes?: string;
  }>;
  noindex?: boolean;
  nofollow?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  openGraph,
  twitter,
  additionalMetaTags = [],
  additionalLinkTags = [],
  noindex = false,
  nofollow = false,
}) => {
  const robots = noindex || nofollow 
    ? `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`
    : 'index, follow';

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={canonical}
        openGraph={openGraph}
        twitter={twitter}
        additionalMetaTags={[
          {
            name: 'robots',
            content: robots,
          },
          ...additionalMetaTags,
        ]}
        additionalLinkTags={additionalLinkTags}
      />
      <Helmet>
        {/* Structured Data for Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialService",
            "name": "WiseBond",
            "description": "Smart Home Loan Solutions in South Africa",
            "url": "https://wisebond.co.za",
            "logo": "https://wisebond.co.za/logo.png",
            "image": "https://wisebond.co.za/og-image.jpg",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "ZA",
              "addressRegion": "Gauteng"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "info@wisebond.co.za",
              "availableLanguage": "English"
            },
            "areaServed": {
              "@type": "Country",
              "name": "South Africa"
            },
            "serviceType": "Home Loan Originator",
            "priceRange": "Free",
            "sameAs": [
              "https://twitter.com/wisebond",
              "https://facebook.com/wisebond",
              "https://linkedin.com/company/wisebond"
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "127"
            }
          })}
        </script>
        
        {/* Structured Data for WebSite */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "WiseBond",
            "url": "https://wisebond.co.za",
            "description": "Compare home loan rates and get mortgage advice in South Africa",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://wisebond.co.za/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "WiseBond"
            }
          })}
        </script>

        {/* Structured Data for BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://wisebond.co.za"
              }
            ]
          })}
        </script>

        {/* Structured Data for FAQPage (if on FAQ page) */}
        {title?.includes('FAQ') && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How do I apply for a home loan in South Africa?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can apply for a home loan through WiseBond by comparing rates from multiple banks, using our calculators to check affordability, and getting expert guidance throughout the process."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What documents do I need for a home loan application?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You'll need proof of income, bank statements, ID documents, and property details. Our team will guide you through the complete documentation process."
                  }
                }
              ]
            })}
          </script>
        )}

        {/* Structured Data for Calculator Tools */}
        {title?.includes('Calculator') && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "WiseBond Home Loan Calculator",
              "description": "Free home loan calculator to estimate repayments and check affordability",
              "url": "https://wisebond.co.za/calculators",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "ZAR"
              }
            })}
          </script>
        )}
      </Helmet>
    </>
  );
};

export default SEO; 