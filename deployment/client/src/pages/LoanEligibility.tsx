import LoanEligibilityWizard from "@/components/loan-wizard/LoanEligibilityWizard";

export default function LoanEligibility() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Home Loan Eligibility Pre-Check
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            Find out if you're likely to qualify for a home loan before you apply.
            This quick assessment will help set realistic expectations for your home buying journey.
          </p>
        </div>
      </div>

      {/* Wizard Section */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <LoanEligibilityWizard />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Check Your Eligibility?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Time</h3>
              <p className="text-gray-600">
                Know where you stand before spending hours viewing properties or filling out formal applications.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Set Realistic Expectations</h3>
              <p className="text-gray-600">
                Understand your borrowing power and set a realistic budget for your property search.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Identify Improvements</h3>
              <p className="text-gray-600">
                Discover what factors might be affecting your eligibility and get guidance on how to improve them.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Is this pre-check a formal application?
              </h3>
              <p className="text-gray-600">
                No, this is not a formal loan application. It's a quick assessment tool to give you an indication of your eligibility based on the information you provide. For a formal pre-approval, you'll need to submit official documentation to a bank or through our bond origination service.
              </p>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                How accurate is this pre-check?
              </h3>
              <p className="text-gray-600">
                This tool provides a general indication based on typical lending criteria in South Africa. The actual decision by banks may vary based on their specific policies, your full credit report, and other factors. This is meant as a guide, not a guarantee.
              </p>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Will this affect my credit score?
              </h3>
              <p className="text-gray-600">
                No, this pre-check does not perform a credit check and won't impact your credit score in any way. We don't store your personal information, and the assessment is done purely for informational purposes.
              </p>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                What should I do after the pre-check?
              </h3>
              <p className="text-gray-600">
                If you receive a positive indication, the next step would be to gather your documentation (ID, proof of income, bank statements, etc.) and apply for a formal pre-approval. If there are challenges identified, consider working on those areas before applying or speak with one of our consultants for personalized advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}