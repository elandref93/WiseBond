import { Link } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HomeIcon, CreditCardIcon, CalendarIcon, BadgeIcon, BarChart4Icon, CalculatorIcon } from "lucide-react";

export default function CalculatorSection() {
  return (
    <div id="calculators" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            Tools
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Financial Calculators
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Plan your home loan journey with our helpful calculators.
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bond Repayment Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <HomeIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Repayments calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      See what your total monthly repayment amount would be on your new home.
                    </p>
                  </div>
                </div>
                <Link href="/calculators#calculator-detail">
                  <Button className="w-full mt-4">
                    Calculate
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Affordability Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BadgeIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Affordability calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Find out how much you can afford to spend on your new home, based on your income and expenses.
                    </p>
                  </div>
                </div>
                <Link href="/calculators#calculator-detail">
                  <Button className="w-full mt-4">
                    Calculate
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Bonds and Transfer Costs Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <CreditCardIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bonds and transfer costs calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Calculate the total bond registration and property transfer costs on your new home.
                    </p>
                  </div>
                </div>
                <Link href="/calculators#calculator-detail">
                  <Button className="w-full mt-4">
                    Calculate
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* View All Button */}
            <div className="col-span-full flex justify-center mt-8">
              <Link href="/calculators">
                <Button variant="outline" className="px-8">
                  View All Calculators
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
