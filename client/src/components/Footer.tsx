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
                WiseBond
              </span>
            </Link>
            <p className="text-gray-500 text-base">
              South Africa's trusted home loan originator helping you secure the
              best possible home loan rates from multiple banks.
            </p>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500"
                aria-label="Twitter"
              >
                <Twitter size={24} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500"
                aria-label="LinkedIn"
              >
                <Linkedin size={24} />
              </a>
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
                      <a className="text-base text-gray-500 hover:text-gray-900">
                        Blog
                      </a>
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
                      <a className="text-base text-gray-500 hover:text-gray-900">
                        About Us
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about">
                      <a className="text-base text-gray-500 hover:text-gray-900">
                        Careers
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about">
                      <a className="text-base text-gray-500 hover:text-gray-900">
                        Partners
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact">
                      <a className="text-base text-gray-500 hover:text-gray-900">
                        Contact
                      </a>
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
                    <a
                      href="#"
                      className="text-base text-gray-500 hover:text-gray-900"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-base text-gray-500 hover:text-gray-900"
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-base text-gray-500 hover:text-gray-900"
                    >
                      Cookie Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-base text-gray-500 hover:text-gray-900"
                    >
                      POPIA Compliance
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {new Date().getFullYear()} WiseBond. All rights reserved.
            WiseBond is a registered Financial Service Provider (FSP12345).
          </p>
        </div>
      </div>
    </footer>
  );
}
