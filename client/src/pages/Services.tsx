import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function Services() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Our Services
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            WiseBond offers a comprehensive range of home loan services
            designed to make your property financing journey seamless and
            successful.
          </p>
        </div>
      </div>

      {/* Main Services Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Service 1: Home Loans */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-md bg-primary text-white flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold">Home Loans</CardTitle>
                <CardDescription>
                  Secure competitive rates across multiple banks with a single application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Compare offers from all major South African banks</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Negotiated rates better than going direct</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>First-time homebuyer friendly options</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>100% financing options available</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup">
                  <Button className="w-full">Apply Now</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Service 2: Building Loans */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-md bg-primary text-white flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold">Building Loans</CardTitle>
                <CardDescription>
                  Finance for constructing your dream home from the ground up
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Phased payments aligned with construction progress</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Interest-only payments during construction</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Professional guidance on building requirements</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Assistance with architect and building plans</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup">
                  <Button className="w-full">Learn More</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Service 3: Refinancing */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-md bg-primary text-white flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold">Home Loan Refinancing</CardTitle>
                <CardDescription>
                  Optimize your existing home loan to save money or access equity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Secure lower interest rates on existing loans</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Access built-up equity for renovations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Consolidate debt at lower interest rates</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Reduce monthly repayments through restructuring</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup">
                  <Button className="w-full">Refinance Now</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Specialized Services */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Specialized Solutions
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
              Beyond our core offerings, WiseBond provides specialized services
              to meet unique financing needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* FLISP Subsidies */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-10 w-10 rounded-md bg-secondary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">FLISP Subsidies</h3>
              <p className="mt-2 text-gray-500">
                We help first-time homebuyers access Finance Linked Individual
                Subsidy Program (FLISP) benefits, reducing your initial costs.
              </p>
            </div>

            {/* Investment Property Financing */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-10 w-10 rounded-md bg-secondary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Investment Properties</h3>
              <p className="mt-2 text-gray-500">
                Specialized financing solutions for investment properties with
                favorable terms and competitive rates for rental income.
              </p>
            </div>

            {/* Vacation Home Financing */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-10 w-10 rounded-md bg-secondary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Vacation Homes</h3>
              <p className="mt-2 text-gray-500">
                Financing options specifically designed for second homes and
                vacation properties in South Africa's desirable locations.
              </p>
            </div>

            {/* Commercial Property Loans */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-10 w-10 rounded-md bg-secondary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Commercial Property</h3>
              <p className="mt-2 text-gray-500">
                Financing solutions for commercial properties, helping business
                owners purchase their own premises or investment properties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Process Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Service Process
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
              We've simplified the home loan application process to make your journey
              to homeownership as smooth as possible
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-lg font-medium text-gray-900">
                How it works
              </span>
            </div>
          </div>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute h-full w-0.5 bg-gray-200 left-5 top-5 md:left-8"></div>
              <div className="space-y-12">
                <div className="flex">
                  <div className="flex-shrink-0 h-10 w-10 md:h-16 md:w-16 rounded-full bg-primary text-white flex items-center justify-center z-10">
                    <span className="text-lg md:text-2xl font-bold">1</span>
                  </div>
                  <div className="ml-4 md:ml-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Complete our online application
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      Fill out our simple online form with your personal details,
                      employment information, and property details. It takes less
                      than 10 minutes.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 h-10 w-10 md:h-16 md:w-16 rounded-full bg-primary text-white flex items-center justify-center z-10">
                    <span className="text-lg md:text-2xl font-bold">2</span>
                  </div>
                  <div className="ml-4 md:ml-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Submit required documents
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      Upload the necessary documents like ID, proof of income, and
                      bank statements. Our secure portal makes this quick and easy.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 h-10 w-10 md:h-16 md:w-16 rounded-full bg-primary text-white flex items-center justify-center z-10">
                    <span className="text-lg md:text-2xl font-bold">3</span>
                  </div>
                  <div className="ml-4 md:ml-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      We submit to multiple banks
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      We'll submit your application to multiple major South African
                      banks simultaneously to get you the best possible rates.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 h-10 w-10 md:h-16 md:w-16 rounded-full bg-primary text-white flex items-center justify-center z-10">
                    <span className="text-lg md:text-2xl font-bold">4</span>
                  </div>
                  <div className="ml-4 md:ml-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Compare offers and select the best
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      We'll present you with all the offers from different banks so
                      you can compare and choose the one that suits you best.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 h-10 w-10 md:h-16 md:w-16 rounded-full bg-green-600 text-white flex items-center justify-center z-10">
                    <Check className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div className="ml-4 md:ml-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Your home loan is approved!
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      We'll help you finalize all the paperwork and guide you
                      through the rest of the process until you get your keys.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-secondary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-400">
              Let us help you secure your dream home.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-3">
            <Link href="/signup">
              <Button size="lg">Apply Now</Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
