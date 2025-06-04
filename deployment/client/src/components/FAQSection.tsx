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
      question: "Why should I use WiseBond instead of going directly to my bank?",
      answer:
        "By applying through WiseBond, you'll receive offers from multiple banks, increasing your chances of approval and securing a better interest rate. On average, our clients save over R100,000 on their home loans through better rates. Additionally, we handle all the paperwork, follow-ups, and negotiations, making the process much smoother.",
    },
    {
      question: "What is pre-approval and why should I get it?",
      answer:
        "Pre-approval is an initial assessment by banks to determine how much they would be willing to lend you based on your financial profile. It's highly recommended before house hunting as it shows sellers you're a serious buyer, gives you a clear budget, and speeds up the final approval process once you find a property.",
    },
    {
      question: "Will applying to multiple banks through WiseBond affect my credit score?",
      answer:
        "No. When you apply through Wise Bond, the banks recognize this as a home loan comparison rather than multiple separate applications. Credit bureaus typically count multiple home loan inquiries within a short period as a single inquiry, minimizing the impact on your credit score.",
    },
    {
      question: "How much does it cost to use Wise Bond?",
      answer:
        "Our service is completely free to you as the home buyer. We are paid a commission by the bank when your home loan is successfully approved. This commission does not affect your interest rate or loan terms in any way.",
    },
    {
      question: "What happens after the banks respond to my application?",
      answer:
        "Once the banks respond, your dedicated Wise Bond consultant will compile all offers and present them to you in a clear, comparable format. We'll explain the differences in interest rates, terms, and conditions. You can then select the offer that best suits your needs, and we'll help finalize the application with your chosen bank.",
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
