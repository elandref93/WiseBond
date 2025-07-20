import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <div className="bg-white">
      <SEO
        title="Privacy Policy - WiseBond"
        description="Learn how WiseBond collects, uses, and protects your personal information in accordance with POPIA and South African law. Your privacy and data security are our priority."
        openGraph={{
          title: "Privacy Policy - WiseBond",
          description: "Learn how WiseBond collects, uses, and protects your personal information in accordance with POPIA and South African law.",
          url: "https://wisebond.co.za/privacy",
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: "privacy policy, data protection, POPIA, personal information, WiseBond, South Africa",
          },
        ]}
      />
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            How we collect, use, and protect your personal information in accordance with POPIA and South African law.
          </p>
          <div className="mt-6 text-sm text-gray-400">
            <p>Version 1.0 | Effective Date: January 2025 | Last Updated: January 2025</p>
          </div>
        </div>
      </div>

      {/* Privacy Policy Content */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Company Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Wise Bond (Pty) Ltd Privacy Policy
            </h2>
            <p className="text-gray-600">
              Registration Number: 2025/291726/07 | NCRCP21939
            </p>
          </div>

          {/* Definitions and Introduction */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Definitions and Introduction</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">1.1 Key Definitions</h4>
              <div className="space-y-3 text-gray-700">
                <p><strong>"We", "us", "our"</strong> refers to Wise Bond (Pty) Ltd (Registration Number: 2025/291726/07), a South African bond origination company</p>
                <p><strong>"You", "your"</strong> refers to any individual whose personal information we collect, use, or process</p>
                <p><strong>"Personal information"</strong> means information relating to an identifiable, living, natural person, and where applicable, an identifiable, existing juristic person, as defined in POPIA</p>
                <p><strong>"Processing"</strong> means any operation or activity concerning personal information, including collection, use, storage, disclosure, and destruction</p>
                <p><strong>"POPIA"</strong> refers to the Protection of Personal Information Act, 4 of 2013</p>
                <p><strong>"Bond origination services"</strong> include home loan pre-qualification, application facilitation, mortgage advice, and related financial intermediary services</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">1.2 About This Policy</h4>
              <p className="text-gray-700 mb-4">
                When you engage with Wise Bond, you trust us with your personal information. This privacy policy explains how we collect, use, share, and protect your personal information in accordance with POPIA and other applicable South African laws.
              </p>
              <div className="bg-white rounded p-4">
                <p className="font-semibold text-gray-900 mb-2">This policy applies to:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>All personal information processed by Wise Bond (Pty) Ltd</li>
                  <li>Our website, mobile applications, and digital platforms</li>
                  <li>All interactions with our bond origination and related services</li>
                  <li>Information collected from third parties on your behalf</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Personal Information We Collect */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Personal Information We Collect</h3>
            
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">2.1 Information You Provide Directly</h4>
                
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Registration and Account Information:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Full names, identity numbers, and contact details</li>
                    <li>Email addresses, phone numbers, and physical addresses</li>
                    <li>Employment details, income information, and financial status</li>
                    <li>Banking details and account information</li>
                    <li>Login credentials for secure access to our services</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Bond Application Information:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Property details and purchase price</li>
                    <li>Co-applicant information (where applicable)</li>
                    <li>Financial statements and supporting documentation</li>
                    <li>Credit history and payment behavior data</li>
                    <li>Insurance requirements and preferences</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Plain Language Summary:</strong> We collect personal and financial information needed to assess your bond application and provide our services. This includes basic contact details, employment information, and the financial data required by banks for home loan decisions.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">2.2 Information We Collect Automatically</h4>
                
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Website and Digital Interactions:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>IP addresses, browser types, and device information</li>
                    <li>Website usage patterns and navigation behavior</li>
                    <li>Cookie data and similar tracking technologies</li>
                    <li>Time stamps and session duration information</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Service Interaction Data:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Communication records and call recordings</li>
                    <li>Document uploads and system interactions</li>
                    <li>Application progress and status updates</li>
                    <li>Support ticket and inquiry history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Your Personal Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3. How We Use Your Personal Information</h3>
            
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">3.1 Primary Processing Purposes</h4>
                
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Bond Origination Services:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Assessing your bond application eligibility</li>
                    <li>Facilitating applications with multiple banking partners</li>
                    <li>Providing mortgage advice and recommendations</li>
                    <li>Managing your application through to approval or decline</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Legal and Regulatory Compliance:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>FICA (Financial Intelligence Centre Act) compliance</li>
                    <li>Credit reporting and bureau obligations</li>
                    <li>Regulatory reporting to financial authorities</li>
                    <li>Anti-money laundering and sanctions screening</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Plain Language Summary:</strong> We use your information primarily to help you secure a home loan. This includes assessing your financial situation, applying to banks on your behalf, and meeting legal requirements that apply to financial services companies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Information Sharing and Disclosure */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">4. Information Sharing and Disclosure</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">4.1 Banking and Financial Partners</h4>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Primary Sharing for Bond Applications:</h5>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Banks and financial institutions for loan assessment</li>
                  <li>Credit bureaus for credit scoring and reporting</li>
                  <li>Insurance companies for bond protection products</li>
                  <li>Property valuers and conveyancing attorneys</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-gray-700">
                  <strong>Important Note:</strong> When you apply for a bond through Wise Bond, your information will be shared with multiple banks simultaneously to secure the best possible terms. Each bank will receive your complete application package.
                </p>
              </div>
            </div>
          </div>

          {/* Your Rights Under POPIA */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">5. Your Rights Under POPIA</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">5.1 Right to Access Your Information</h4>
                <p className="text-gray-700 mb-3">What You Can Request:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Confirmation of what personal information we hold about you</li>
                  <li>Details of how your information is being processed</li>
                  <li>Copies of your personal information in our possession</li>
                  <li>Information about third parties who have received your data</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">5.2 Right to Correction and Updates</h4>
                <p className="text-gray-700 mb-3">Correcting Inaccurate Information:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Request correction of any inaccurate or incomplete personal information</li>
                  <li>Update your contact details and financial circumstances</li>
                  <li>Modify consent preferences for marketing communications</li>
                </ul>
                <p className="text-sm text-gray-600 mt-3">
                  <strong>Response Time:</strong> We will respond to correction requests within 30 days.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">6. Contact Information and Complaints</h3>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Information Officer</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Primary Contact:</h5>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Information Officer:</strong> [To be appointed]</p>
                    <p><strong>Email:</strong> privacy@wisebond.co.za</p>
                    <p><strong>Phone:</strong> +27 11 234 5678</p>
                    <p><strong>Address:</strong> Head Office: Klapmuts, Western Cape, South Africa</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">How to Submit a Complaint:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Email our Information Officer at privacy@wisebond.co.za</li>
                    <li>Phone our dedicated complaints line at +27 11 234 5678</li>
                    <li>Write to us at our physical address above</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">7. Company Information</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Wise Bond (Pty) Ltd</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Registration Number:</strong> 2025/291726/07</p>
                    <p><strong>NCR Registration:</strong> NCRCP21939</p>
                    <p><strong>Physical Address:</strong> Head Office: Klapmuts, Western Cape, South Africa</p>
                    <p><strong>Main Phone:</strong> +27 11 234 5678</p>
                    <p><strong>Email:</strong> info@wisebond.co.za</p>
                    <p><strong>Website:</strong> www.wisebond.co.za</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Regulatory Compliance</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>National Credit Regulator (NCR):</strong> NCRCP21939</p>
                    <p><strong>Professional Indemnity Insurance:</strong> [Details to be provided]</p>
                    <p><strong>POPIA Compliance:</strong> Fully compliant with Protection of Personal Information Act</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acknowledgment and Consent</h3>
            <p className="text-gray-700 mb-4">
              By using Wise Bond's services, accessing our website, or providing personal information to us, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>You have read and understood this privacy policy</li>
              <li>You consent to the collection, use, and processing of your personal information as described</li>
              <li>You understand your rights under POPIA and how to exercise them</li>
              <li>You are at least 18 years of age or have appropriate guardian consent</li>
              <li>Information provided is accurate and complete to the best of your knowledge</li>
            </ul>
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center text-sm text-gray-500 border-t pt-8">
            <p>
              This privacy policy is compliant with South Africa's Protection of Personal Information Act (POPIA) and reflects current regulatory requirements as of January 2025.
            </p>
            <p className="mt-2">
              <strong>Document Control:</strong> Version 1.0 | Classification: Public Document
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 