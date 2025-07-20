import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Partners from "@/components/Partners";
import CalculatorSection from "@/components/CalculatorSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ApplicationProcess from "@/components/ApplicationProcess";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import SEO from "@/components/SEO";
import { pageSEO } from "@/lib/seo";

export default function Home() {
  return (
    <div>
      <SEO
        title={pageSEO.home.title}
        description={pageSEO.home.description}
        openGraph={{
          title: pageSEO.home.title,
          description: pageSEO.home.description,
          url: "https://wisebond.co.za",
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: pageSEO.home.keywords,
          },
        ]}
      />
      <Hero />
      <Features />
      <Partners />
      <CalculatorSection />
      <TestimonialsSection />
      <ApplicationProcess />
      <FAQSection />
      <CTASection />
    </div>
  );
}
