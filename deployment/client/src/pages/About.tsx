export default function About() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            About WiseBond
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            South Africa's trusted home loan originator helping you secure the
            best possible home loan rates from multiple banks.
          </p>
        </div>
      </div>

      {/* Mission & Values */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Our Mission
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                WiseBond was founded with a clear mission: to make the home loan
                application process simpler, faster, and more transparent for
                South Africans. We believe that everyone deserves a fair chance at
                homeownership, and our goal is to help our clients secure the best
                possible financing terms.
              </p>
              <p className="mt-4 text-lg text-gray-500">
                We understand that buying a home is one of the most significant
                financial decisions you'll ever make. That's why we're committed
                to providing expert guidance and support throughout the entire
                process, ensuring you get the best deal from multiple banks
                without having to shop around yourself.
              </p>
            </div>
            <div className="mt-10 lg:mt-0">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Our Values
              </h2>
              <div className="mt-4 space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Transparency
                    </h3>
                    <p className="mt-1 text-gray-500">
                      We believe in complete transparency throughout the home loan
                      process. No hidden fees, no surprises.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Integrity
                    </h3>
                    <p className="mt-1 text-gray-500">
                      We always act in our clients' best interests, offering
                      honest advice and recommendations tailored to your needs.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Excellence
                    </h3>
                    <p className="mt-1 text-gray-500">
                      We strive for excellence in everything we do, from our
                      customer service to our banking relationships and approval
                      rates.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Innovation
                    </h3>
                    <p className="mt-1 text-gray-500">
                      We continuously seek new ways to improve our service and
                      streamline the home loan application process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Leadership Team
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
              Meet the experienced professionals who lead WiseBond to success,
              bringing decades of combined experience in South African finance,
              real estate, and customer service.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Team Member 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Sarah Johnson
                </h3>
                <p className="text-primary font-medium">Chief Executive Officer</p>
                <p className="mt-3 text-gray-500">
                  With over 15 years of experience in the South African financial
                  sector, Sarah leads our company with expertise and vision.
                </p>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Thabo Mbeki
                </h3>
                <p className="text-primary font-medium">Chief Operations Officer</p>
                <p className="mt-3 text-gray-500">
                  Thabo ensures our operations run smoothly, bringing valuable
                  insights from his background in banking and home loans.
                </p>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Lerato Ndlovu
                </h3>
                <p className="text-primary font-medium">Head of Client Services</p>
                <p className="mt-3 text-gray-500">
                  Lerato leads our client service team, ensuring every client
                  receives personalized support throughout their journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Impact in Numbers
            </h2>
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-primary">10+</span>
                <p className="mt-2 text-lg font-medium text-gray-900">
                  Years in Business
                </p>
              </div>
              <div className="text-center">
                <span className="text-4xl font-extrabold text-primary">5,000+</span>
                <p className="mt-2 text-lg font-medium text-gray-900">
                  Satisfied Clients
                </p>
              </div>
              <div className="text-center">
                <span className="text-4xl font-extrabold text-primary">R8.2B</span>
                <p className="mt-2 text-lg font-medium text-gray-900">
                  Home Loans Secured
                </p>
              </div>
              <div className="text-center">
                <span className="text-4xl font-extrabold text-primary">92%</span>
                <p className="mt-2 text-lg font-medium text-gray-900">
                  Approval Rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Locations
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
              WiseBond has offices across South Africa to better serve our
              clients nationwide. Visit us at any of our locations or connect
              with us online.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Johannesburg */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900">Johannesburg</h3>
              <p className="mt-2 text-gray-500">
                123 Main Street<br />
                Sandton<br />
                Johannesburg, 2031<br />
                <span className="text-primary">+27 11 234 5678</span>
              </p>
            </div>

            {/* Cape Town */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900">Cape Town</h3>
              <p className="mt-2 text-gray-500">
                456 Beach Road<br />
                Sea Point<br />
                Cape Town, 8001<br />
                <span className="text-primary">+27 21 345 6789</span>
              </p>
            </div>

            {/* Durban */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900">Durban</h3>
              <p className="mt-2 text-gray-500">
                789 Umhlanga Drive<br />
                Umhlanga Rocks<br />
                Durban, 4320<br />
                <span className="text-primary">+27 31 456 7890</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
