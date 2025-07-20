import SEO from "@/components/SEO";

export default function CookiePolicy() {
  return (
    <div className="bg-white">
      <SEO
        title="Cookie Policy - WiseBond"
        description="Learn how WiseBond uses cookies and tracking technologies to enhance your website experience. Understand your privacy choices and cookie preferences."
        openGraph={{
          title: "Cookie Policy - WiseBond",
          description: "Learn how WiseBond uses cookies and tracking technologies to enhance your website experience.",
          url: "https://wisebond.co.za/cookies",
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: "cookie policy, tracking technologies, website cookies, privacy preferences, WiseBond, South Africa",
          },
        ]}
      />
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            How we use cookies and similar tracking technologies to enhance your experience on our website.
          </p>
          <div className="mt-6 text-sm text-gray-400">
            <p>Version 1.0 | Effective Date: January 2025 | Last Updated: January 2025</p>
          </div>
        </div>
      </div>

      {/* Cookie Policy Content */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Company Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Wise Bond (Pty) Ltd Cookie Policy
            </h2>
            <p className="text-gray-600">
              Registration Number: 2025/291726/07 | NCRCP21939
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Introduction</h3>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">1.1 About This Cookie Policy</h4>
              <p className="text-gray-700 mb-4">
                This Cookie Policy explains how Wise Bond (Pty) Ltd (Registration Number: 2025/291726/07) ("<strong>Wise Bond</strong>", "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") uses cookies and similar tracking technologies when you visit our website www.wisebond.co.za (the "<strong>Website</strong>") or use our online services.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">1.2 What Are Cookies?</h4>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your computer, smartphone, tablet, or other device when you visit a website. They contain information that is transferred to your device's hard drive and allow a website to remember your preferences, login details, and other information to improve your browsing experience.
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">1.3 Your Consent</h4>
              <p className="text-gray-700">
                By continuing to use our Website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings or using our cookie preference center.
              </p>
            </div>
          </div>

          {/* Types of Cookies */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Types of Cookies We Use</h3>
            
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">2.1 Essential Cookies</h4>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> These cookies are necessary for our Website to function properly and cannot be disabled.</p>
                
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">What They Do:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Enable basic website functionality and navigation</li>
                    <li>Remember your login status during your session</li>
                    <li>Maintain security and prevent fraud</li>
                    <li>Store your cookie preferences</li>
                    <li>Enable form submissions and applications</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Legal Basis:</strong> Legitimate interest - these cookies are essential for providing our bond origination services.<br/>
                    <strong>Retention:</strong> Session cookies are deleted when you close your browser; persistent essential cookies typically last up to 12 months.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">2.2 Performance and Analytics Cookies</h4>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> These cookies help us understand how visitors use our Website so we can improve it.</p>
                
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">What They Do:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Count the number of visitors to different pages</li>
                    <li>Track how long visitors spend on each page</li>
                    <li>Record which pages are most and least popular</li>
                    <li>Monitor website loading speeds and performance</li>
                    <li>Identify technical issues or errors</li>
                  </ul>
                </div>

                <div className="bg-white rounded p-3 mb-3">
                  <h5 className="font-medium text-gray-900 mb-2">Third-Party Services We Use:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><strong>Google Analytics</strong> - website usage statistics</li>
                  </ul>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Legal Basis:</strong> Your consent (you can opt out at any time).<br/>
                    <strong>Retention:</strong> Typically 12-24 months, depending on the specific cookie.
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">2.3 Functional Cookies</h4>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> These cookies enhance your experience by remembering your preferences and choices.</p>
                
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">What They Do:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Remember your language preferences</li>
                    <li>Store your location for relevant content</li>
                    <li>Recall your previous searches or applications</li>
                    <li>Maintain your preferences for website layout or features</li>
                    <li>Pre-fill forms with previously entered information</li>
                  </ul>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Legal Basis:</strong> Your consent or legitimate interest in providing improved services.<br/>
                    <strong>Retention:</strong> Usually 12 months, though some preference cookies may last up to 2 years.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">2.4 Marketing and Advertising Cookies</h4>
                <p className="text-gray-700 mb-3"><strong>Purpose:</strong> These cookies are used to deliver relevant advertising and track the effectiveness of marketing campaigns.</p>
                
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">What They Do:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Track your interests based on pages visited</li>
                    <li>Deliver targeted advertisements on our Website and other sites</li>
                    <li>Limit the number of times you see the same advertisement</li>
                    <li>Measure the effectiveness of advertising campaigns</li>
                    <li>Enable sharing of content on social media platforms</li>
                  </ul>
                </div>

                <div className="bg-white rounded p-3 mb-3">
                  <h5 className="font-medium text-gray-900 mb-2">Third-Party Services We May Use:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><strong>Google Ads</strong> - for targeted advertising</li>
                    <li><strong>Facebook Pixel</strong> - for social media advertising</li>
                    <li><strong>LinkedIn Insight Tag</strong> - for professional network advertising</li>
                  </ul>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Legal Basis:</strong> Your explicit consent (you can opt out at any time).<br/>
                    <strong>Retention:</strong> Typically 12-24 months, depending on the advertising platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Cookies */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3. How We Use Cookies</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">3.1 Website Functionality</h4>
                <p className="text-gray-700 mb-3"><strong>Essential Operations:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Maintaining your session when you're logged into your account</li>
                  <li>Remembering items in your application or inquiry forms</li>
                  <li>Ensuring website security and preventing unauthorized access</li>
                  <li>Loading website content efficiently</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">3.2 Service Improvement</h4>
                <p className="text-gray-700 mb-3"><strong>Understanding User Behavior:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Identifying which pages are most useful to visitors</li>
                  <li>Discovering where users encounter difficulties</li>
                  <li>Testing new features and improvements</li>
                  <li>Optimizing website performance and loading times</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">3.3 Personalization</h4>
                <p className="text-gray-700 mb-3"><strong>Enhancing Your Experience:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Displaying relevant content based on your interests</li>
                  <li>Remembering your communication preferences</li>
                  <li>Customizing the website layout to your preferences</li>
                  <li>Providing location-specific information where relevant</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">3.4 Marketing and Communication</h4>
                <p className="text-gray-700 mb-3"><strong>Relevant Communications:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Showing you advertisements for our services on other websites</li>
                  <li>Measuring the effectiveness of our marketing campaigns</li>
                  <li>Preventing you from seeing duplicate advertisements</li>
                  <li>Enabling sharing of our content on social media platforms</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Your Cookie Choices */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">4. Your Cookie Choices and Controls</h3>
            
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">4.1 Cookie Preference Center</h4>
                <p className="text-gray-700 mb-3"><strong>Managing Your Preferences:</strong></p>
                <p className="text-gray-700 mb-4">We provide a cookie preference center where you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
                  <li>View all cookies used on our Website</li>
                  <li>Enable or disable non-essential cookie categories</li>
                  <li>Update your preferences at any time</li>
                  <li>Learn more about specific cookies and their purposes</li>
                </ul>
                
                <div className="bg-white rounded p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Accessing the Preference Center:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Click the "Cookie Settings" link in our website footer</li>
                    <li>Use the cookie banner that appears on your first visit</li>
                    <li>Contact us directly using the details provided below</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">4.2 Impact of Disabling Cookies</h4>
                <p className="text-gray-700 mb-3"><strong>Important Information:</strong></p>
                <p className="text-gray-700 mb-3">If you disable certain cookies, some features of our Website may not function properly:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>You may need to re-enter information frequently</li>
                  <li>Personalized content may not be available</li>
                  <li>Some forms or applications may not work correctly</li>
                  <li>We may not be able to remember your preferences</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Specific Cookie Details */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">5. Specific Cookie Details</h3>
            
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">5.1 Essential Cookies We Use</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">session_id</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Maintains your login session</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Session</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">HTTP</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">security_token</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Prevents cross-site request forgery</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Session</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">HTTP</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">cookie_consent</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Stores your cookie preferences</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">12 months</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">HTTP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">5.2 Analytics Cookies</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">_ga</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Google Analytics</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Distinguishes unique users</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">24 months</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">_gid</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Google Analytics</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Distinguishes unique users</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">24 hours</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">6. Contact Information</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Questions and Concerns</h4>
              <p className="text-gray-700 mb-4">If you have any questions about this Cookie Policy or our use of cookies, please contact us:</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Wise Bond (Pty) Ltd</h5>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Information Officer:</strong> [To be appointed]</p>
                    <p><strong>Email:</strong> privacy@wisebond.co.za</p>
                    <p><strong>Phone:</strong> +27 11 234 5678</p>
                    <p><strong>Address:</strong> Head Office: Klapmuts, Western Cape, South Africa</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">External Complaints</h5>
                  <p className="text-gray-700 mb-3">If you are not satisfied with how we handle your cookie-related concerns, you may file a complaint with:</p>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Information Regulator of South Africa</strong></p>
                    <p>54 Maxwell Drive, Woodmead, Johannesburg, 2191</p>
                    <p><strong>Phone:</strong> 010 023 5200</p>
                    <p><strong>Email:</strong> enquiries@inforegulator.org.za</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">7. Additional Resources</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Cookie Education</h4>
                <p className="text-gray-700 mb-3">To learn more about cookies and online privacy:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>All About Cookies:</strong> www.allaboutcookies.org</li>
                  <li><strong>Your Online Choices:</strong> www.youronlinechoices.com</li>
                  <li><strong>Information Commissioner (POPIA):</strong> www.inforegulator.org.za</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Opt-Out Tools</h4>
                <p className="text-gray-700 mb-3">Industry-wide opt-out tools:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Digital Advertising Alliance:</strong> www.aboutads.info/choices</li>
                  <li><strong>Network Advertising Initiative:</strong> www.networkadvertising.org/choices</li>
                  <li><strong>European Interactive Digital Advertising Alliance:</strong> www.youronlinechoices.eu</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Browser Information</h4>
                <p className="text-gray-700 mb-3">For detailed instructions on managing cookies in your browser:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Google Chrome Help:</strong> support.google.com/chrome</li>
                  <li><strong>Mozilla Firefox Help:</strong> support.mozilla.org</li>
                  <li><strong>Apple Safari Help:</strong> support.apple.com/safari</li>
                  <li><strong>Microsoft Edge Help:</strong> support.microsoft.com/edge</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acknowledgment</h3>
            <p className="text-gray-700 mb-4">
              This Cookie Policy is designed to comply with the Protection of Personal Information Act (POPIA) and other applicable South African privacy laws. We are committed to transparency in our data practices and protecting your privacy while providing excellent bond origination services.
            </p>
            <div className="mt-4 p-3 bg-white rounded border">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> This is not an exhaustive list. Cookies may be added or changed as we update our services.
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center text-sm text-gray-500 border-t pt-8">
            <p>
              This Cookie Policy is designed to comply with the Protection of Personal Information Act (POPIA) and other applicable South African privacy laws.
            </p>
            <p className="mt-2">
              <strong>Document Control:</strong> Version 1.0 | Classification: Public Document
            </p>
            <p className="mt-4 text-xs text-gray-400">
              © 2025 Wise Bond (Pty) Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 