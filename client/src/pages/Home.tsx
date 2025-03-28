import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Partners from "@/components/Partners";
import CalculatorSection from "@/components/CalculatorSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ApplicationProcess from "@/components/ApplicationProcess";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <div>
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
