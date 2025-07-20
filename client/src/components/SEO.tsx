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
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "ZA"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "info@wisebond.co.za"
            },
            "sameAs": [
              "https://twitter.com/wisebond",
              "https://facebook.com/wisebond",
              "https://linkedin.com/company/wisebond"
            ]
          })}
        </script>
        
        {/* Structured Data for WebSite */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "WiseBond",
            "url": "https://wisebond.co.za",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://wisebond.co.za/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
    </>
  );
};

export default SEO; 