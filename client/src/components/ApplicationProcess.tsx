import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check } from "lucide-react";

export default function ApplicationProcess() {
  const steps = [
    {
      number: 1,
      title: "Complete our online application",
      description:
        "Fill out our simple online form with your personal details, employment information, and property details. It takes less than 10 minutes.",
    },
    {
      number: 2,
      title: "Submit required documents",
      description:
        "Upload the necessary documents like ID, proof of income, and bank statements. Our secure portal makes this quick and easy.",
    },
    {
      number: 3,
      title: "We submit to multiple banks",
      description:
        "We'll submit your application to multiple major South African banks simultaneously to get you the best possible rates.",
    },
    {
      number: 4,
      title: "Compare offers and select the best",
      description:
        "We'll present you with all the offers from different banks so you can compare and choose the one that suits you best.",
    },
  ];

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            How It Works
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple Application Process
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our streamlined process makes applying for a home loan easy.
          </p>
        </div>
        <div className="mt-10">
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-lg font-medium text-gray-900">
                Follow these steps
              </span>
            </div>
          </div>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute h-full w-0.5 bg-gray-200 left-5 top-5 md:left-8"></div>
              <div className="space-y-12">
                {steps.map((step) => (
                  <div key={step.number} className="flex">
                    <div className="flex-shrink-0 h-10 w-10 md:h-16 md:w-16 rounded-full bg-primary text-white flex items-center justify-center z-10">
                      <span className="text-lg md:text-2xl font-bold">
                        {step.number}
                      </span>
                    </div>
                    <div className="ml-4 md:ml-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-base text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}

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

          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button size="lg">Start Your Application Now</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
