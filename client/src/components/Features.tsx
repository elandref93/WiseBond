import { 
  Percent, 
  DollarSign, 
  Clock, 
  UserCheck 
} from "lucide-react";

export default function Features() {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            Benefits
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Why choose HomeBondSA?
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            We make your home loan journey smooth and successful.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Percent className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                  Better Interest Rates
                </p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                We negotiate with multiple banks on your behalf to secure the
                best possible interest rate for your home loan.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                  No Cost to You
                </p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Our service is completely free to you. We're paid by the banks
                when your home loan is successfully approved.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                  Save Time
                </p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Apply once with us instead of approaching multiple banks
                individually. We handle all the paperwork and follow-ups.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <UserCheck className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                  Expert Guidance
                </p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Our consultants are experts in South African home financing and
                will guide you through the entire process.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
