import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FAQ() {
  const generalFaqs = [
    {
      question: "What is a bond originator?",
      answer:
        "A bond originator is a professional service that helps home buyers apply for home loans (bonds) with multiple banks simultaneously. We handle the application process, paperwork, and negotiations on your behalf to secure the best possible interest rate.",
    },
    {
      question: "How much does it cost to use WiseBond?",
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

  const loanFaqs = [
    {
      question: "What is the current home loan interest rate in South Africa?",
      answer:
        "Home loan interest rates in South Africa typically range from prime minus 1% to prime plus 2%, depending on your credit profile, income, and the property value. As of 2023, the prime lending rate is approximately 11.25%, so most home loans range between 10.25% and 13.25%.",
    },
    {
      question: "How much deposit do I need for a home loan in South Africa?",
      answer:
        "While 100% home loans (no deposit) are available for qualifying applicants, most banks prefer a deposit of 10-20% of the property price. A larger deposit improves your chances of approval and secures better interest rates, potentially saving you significant money over the loan term.",
    },
    {
      question: "What fees are involved in a home loan application?",
      answer:
        "When applying for a home loan, you should budget for initiation fees (typically around R6,000), monthly admin fees (R60-R80), bond registration costs (varies by property value), transfer duties (for properties over R1 million), and legal fees for the transferring and bond attorneys.",
    },
    {
      question: "What is the maximum home loan term in South Africa?",
      answer:
        "The standard home loan term in South Africa is 20 years, but most banks offer terms of up to 30 years. A longer term reduces your monthly repayments but increases the total interest paid over the life of the loan.",
    },
    {
      question: "Can I get a home loan if I'm self-employed?",
      answer:
        "Yes, self-employed individuals can qualify for home loans, but the requirements are often stricter. You'll typically need to provide 6-24 months of bank statements, 2 years of financial statements prepared by an accountant, tax returns, and proof of consistent income.",
    },
    {
      question: "How do banks calculate how much I can borrow?",
      answer:
        "Banks typically use two main calculations: the installment-to-income ratio (your monthly bond payment shouldn't exceed 30% of your gross income) and affordability assessment (considering all income, expenses, and debt to ensure you can afford the repayments).",
    },
  ];

  const propertyFaqs = [
    {
      question: "What is the difference between sectional title and freehold property?",
      answer:
        "Freehold property means you own the land and all structures on it, giving you more freedom for alterations but full responsibility for maintenance. Sectional title means you own the interior of your unit while sharing ownership of common areas, with body corporate fees covering communal maintenance but restrictions on modifications.",
    },
    {
      question: "What additional costs should I budget for when buying property?",
      answer:
        "Beyond the property price and home loan fees, budget for transfer duties, bond registration costs, attorney fees, moving expenses, home insurance, municipal deposits, and possible immediate repairs or renovations. It's wise to set aside 8-10% of the property price for these additional costs.",
    },
    {
      question: "How long does the property transfer process take in South Africa?",
      answer:
        "The property transfer process in South Africa typically takes 2-3 months from acceptance of the offer to purchase until the property is registered in your name. This includes obtaining bond approval, signing documents, paying costs, and registration in the Deeds Office.",
    },
    {
      question: "What is an occupation date and why is it important?",
      answer:
        "The occupation date in the sales agreement specifies when you can move into the property, which may be before or after the transfer date. If you occupy before transfer, you'll typically pay occupational rent to the seller. This date is crucial for planning your move and potential rental obligations.",
    },
    {
      question: "What are the ongoing costs of owning property in South Africa?",
      answer:
        "As a property owner in South Africa, you'll need to budget for monthly bond repayments, homeowners insurance, municipal rates and taxes, utilities (water, electricity, sewage), security costs, levies (for sectional title properties), and regular maintenance.",
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            Find answers to common questions about home loans, our services, and
            the property buying process in South Africa.
          </p>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="loans">Home Loans</TabsTrigger>
              <TabsTrigger value="property">Property</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Accordion type="single" collapsible className="space-y-4">
                {generalFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-4">
                    <AccordionTrigger className="text-lg text-left font-medium text-gray-900 py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-gray-500 pt-2 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="loans">
              <Accordion type="single" collapsible className="space-y-4">
                {loanFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-4">
                    <AccordionTrigger className="text-lg text-left font-medium text-gray-900 py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-gray-500 pt-2 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="property">
              <Accordion type="single" collapsible className="space-y-4">
                {propertyFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-4">
                    <AccordionTrigger className="text-lg text-left font-medium text-gray-900 py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-gray-500 pt-2 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Glossary Section */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Home Loan Glossary
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Understanding the terminology used in the home loan process
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <dl className="space-y-6">
              <div>
                <dt className="text-lg font-medium text-gray-900">Bond</dt>
                <dd className="mt-2 text-gray-500">
                  In South Africa, a home loan is commonly referred to as a bond. It's a
                  legal agreement where the property serves as security for the loan.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">Prime Interest Rate</dt>
                <dd className="mt-2 text-gray-500">
                  The base interest rate set by South African banks. Home loan rates are
                  often quoted as "prime plus" or "prime minus" a percentage.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">Deposit</dt>
                <dd className="mt-2 text-gray-500">
                  An upfront payment made by the buyer, typically 10-20% of the property
                  price, reducing the amount needed to be borrowed.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">Transfer Duty</dt>
                <dd className="mt-2 text-gray-500">
                  A tax levied by the government on property transfers. Properties under
                  R1 million are exempt, with a sliding scale applying to higher values.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">Bond Registration</dt>
                <dd className="mt-2 text-gray-500">
                  The legal process of registering the home loan against the property
                  title deed, which must be completed before the transfer can occur.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">Offer to Purchase (OTP)</dt>
                <dd className="mt-2 text-gray-500">
                  A legal document signed by the buyer and seller that outlines the terms
                  and conditions of the property sale.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">FICA</dt>
                <dd className="mt-2 text-gray-500">
                  The Financial Intelligence Centre Act requires banks to verify client
                  identities and addresses as part of the home loan application process.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">FLISP</dt>
                <dd className="mt-2 text-gray-500">
                  The Finance Linked Individual Subsidy Program is a government subsidy
                  for first-time homebuyers earning between R3,501 and R22,000 per month.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Still Have Questions */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Still Have Questions?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Our team of experts is ready to help you with any questions you may have
            about home loans or the property buying process.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/contact">
              <Button size="lg">Contact Us</Button>
            </Link>
            <Link href="/calculators">
              <Button variant="outline" size="lg">
                Try Our Calculators
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
