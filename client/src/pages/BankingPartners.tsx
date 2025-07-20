import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

// Import bank logos properly for production builds
import bankLogo1 from "@/assets/images/banks/bank-logo-1.png";
import bankLogo2 from "@/assets/images/banks/bank-logo-2.png";
import bankLogo3 from "@/assets/images/banks/bank-logo-3.png";
import bankLogo4 from "@/assets/images/banks/bank-logo-4.png";
import bankLogo5 from "@/assets/images/banks/bank-logo-5.png";
import bankLogo6 from "@/assets/images/banks/bank-logo-6.png";
import bankLogo7 from "@/assets/images/banks/bank-logo-7.png";
import bankLogo8 from "@/assets/images/banks/bank-logo-8.png";

export default function BankingPartners() {
  // Bank logos with proper imports
  const bankLogos = [
    { src: bankLogo1, alt: "Standard Bank" },
    { src: bankLogo2, alt: "Absa Bank" },
    { src: bankLogo3, alt: "FNB" },
    { src: bankLogo4, alt: "Nedbank" },
    { src: bankLogo5, alt: "Investec" },
    { src: bankLogo6, alt: "SA Home Loans" },
    { src: bankLogo7, alt: "RMB" },
    { src: bankLogo8, alt: "Sentinel Home Loans" },
  ];

  return (
    <>
      <SEO
        title="Banking Partners - WiseBond"
        description="WiseBond works with South Africa's leading banks including Standard Bank, FNB, Absa, Nedbank, and more to find you the best home loan rates."
        openGraph={{
          title: "Banking Partners - WiseBond",
          description: "WiseBond works with South Africa's leading banks to find you the best home loan rates.",
          url: "https://wisebond.co.za/banking-partners",
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: "banking partners, home loan banks, Standard Bank, FNB, Absa, Nedbank, Investec, South Africa",
          },
        ]}
      />
      <div className="bg-white">
        {/* Hero Section */}
        <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Banking Partners
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            We work with South Africa's leading financial institutions to find 
            you the best possible home loan at the most competitive rate.
          </p>
        </div>
      </div>

      {/* Looking for the best home loan section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary/5 rounded-xl p-8 md:p-12">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Looking for the best SA home loan out there?
                </h2>
                <div className="space-y-2 text-lg text-gray-700">
                  <p>One application.</p>
                  <p>Multiple banks.</p>
                  <p>Best offer.</p>
                </div>
                <Button className="mt-6 px-6 py-3 text-base" size="lg">
                  Get pre-approved <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="hidden md:block mt-8 md:mt-0">
                <img 
                  src="https://bb-website-prod-wp.azurewebsites.net/wp-content/uploads/image-17-2.png" 
                  alt="Banking Partners" 
                  className="h-56 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Banks Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            We work with all the leading banks
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-3xl mx-auto">
            We work with our industry partners, including estate agents, developers, 
            lawyers and financial institutions.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {bankLogos.map((logo, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center justify-center">
                <img 
                  src={logo.src} 
                  alt={logo.alt} 
                  className="h-20 object-contain"
                />
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button className="px-6 py-3 text-base" size="lg">
              Apply for a bond <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Get Bond Approval Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="md:grid md:grid-cols-2 md:gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Get bond approval today
              </h2>
              <div className="prose prose-lg text-gray-500">
                <p>
                  Wise Bond (Pty) Ltd works with all the major banks to get you the best possible interest rate on your home loan. 
                  Whether you're looking for a Standard Bank, FNB, Absa, Nedbank, Investec, RMB, Sentinal Homes or HIP 
                  home loan, we can help you.
                </p>
                <p>
                  By letting our specialist home loan consultants apply to these banks for you, we can secure the best 
                  interest rate for you. All you need to do is upload your documents and we'll do the rest. If you want 
                  to know how much you can afford, use our online bond repayment calculator to find out your home loan affordability.
                </p>
                <p>
                  Wise Bond (Pty) Ltd also offers a free, home loan pre-approval which provides an accurate indication of what the banks 
                  could offer you based on your credit score, income and expenses. Our pre-approval certificate also 
                  gives you an indication of bond and transfer costs, and transfer duty payable (if applicable). 
                  It's valid for three months and tells sellers and agents you're a serious buyer.
                </p>
              </div>
            </div>
            <div className="mt-8 md:mt-0">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 h-full flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Shop around for your home loan with one click
                </h3>
                <Button className="mt-4 px-6 py-3 text-base w-full md:w-auto" size="lg">
                  Get pre-approved <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary/5 rounded-xl p-8 md:p-12">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Any questions?
                </h2>
                <p className="text-lg text-gray-700">
                  Find answers to all your questions around buying a property, affordability and more.
                </p>
                <Button className="mt-6" variant="outline">
                  Go to FAQs
                </Button>
              </div>
              <div className="mt-6 md:mt-0 hidden md:block">
                <img 
                  src="https://bb-website-prod-wp.azurewebsites.net/wp-content/uploads/Chat.svg" 
                  alt="Any questions?" 
                  className="h-24 w-24"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}