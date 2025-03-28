import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  const faqs = [
    {
      question: "What is a bond originator?",
      answer:
        "A bond originator is a professional service that helps home buyers apply for home loans (bonds) with multiple banks simultaneously. We handle the application process, paperwork, and negotiations on your behalf to secure the best possible interest rate.",
    },
    {
      question: "How much does it cost to use HomeBondSA?",
      answer:
        "Our service is completely free to you as the home buyer. We are paid a commission by the bank when your home loan is successfully approved. This commission does not affect your interest rate or loan terms in any way.",
    },
    {
      question: "How long does the application process take?",
      answer:
        "The initial application takes less than 10 minutes to complete. Once submitted, we typically receive responses from banks within 2-5 working days. The entire process from application to approval usually takes between 7-14 days, depending on the complexity of your application.",
    },
    {
      question: "What documents do I need to apply?",
      answer:
        "You'll need to provide: a copy of your ID document, proof of income (3 months' payslips or 6 months' bank statements if self-employed), 3 months' bank statements, proof of address, and if applicable, a copy of the offer to purchase for the property you want to buy.",
    },
    {
      question: "Can you help if I have a poor credit score?",
      answer:
        "Yes, we work with clients across all credit profiles. While a poor credit score may limit your options, we have relationships with banks that specialize in different risk profiles. We'll work to find the best possible solution based on your specific circumstances.",
    },
    {
      question: "Do you handle FLISP subsidy applications?",
      answer:
        "Yes, we assist with Finance Linked Individual Subsidy Program (FLISP) applications for first-time home buyers who qualify. Our consultants are knowledgeable about the requirements and can guide you through the process of applying for this government subsidy.",
    },
  ];

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            FAQ
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </p>
        </div>
        <div className="mt-10 max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-md p-2">
                <AccordionTrigger className="text-lg text-left font-medium text-gray-900">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-gray-500 pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
