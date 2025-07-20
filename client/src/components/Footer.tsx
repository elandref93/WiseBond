import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/">
              <span className="text-primary font-bold text-2xl cursor-pointer">
                Wise Bond
              </span>
            </Link>
            <p className="text-gray-500 text-base">
              South Africa's trusted home loan originator helping you secure the
              best possible home loan rates from multiple banks.
            </p>
            <div className="flex space-x-6">
              <span
                className="text-gray-400 hover:text-gray-500 cursor-pointer"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </span>
              <span
                className="text-gray-400 hover:text-gray-500 cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </span>
              <span
                className="text-gray-400 hover:text-gray-500 cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter size={24} />
              </span>
              <span
                className="text-gray-400 hover:text-gray-500 cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin size={24} />
              </span>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Services
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link href="/services">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Home Loans
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/services">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Building Loans
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/services">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Home Loan Refinancing
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/services">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        FLISP Subsidies
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Resources
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link href="/calculators">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Calculators
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/services">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Property Guides
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        FAQ
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Blog
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Company
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link href="/about">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        About Us
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Careers
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Partners
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Contact
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Legal
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link href="/privacy">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Privacy Policy
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Terms & Conditions
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies">
                      <span className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                        Cookie Policy
                      </span>
                    </Link>
                  </li>

                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {new Date().getFullYear()} Wise Bond (Pty) Ltd. All rights reserved.
            Registration No: 2025/291726/07. Wise Bond is a registered credit provider. Registration number NCRCP21939.
          </p>
        </div>
      </div>
    </footer>
  );
}
