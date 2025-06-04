import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CTASection() {
  return (
    <div className="bg-secondary-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span className="block">Ready to find your dream home?</span>
          <span className="block text-primary-400">
            Let us help you secure the best home loan.
          </span>
        </h2>
        <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-3">
          <Link href="/determinator">
            <Button size="lg">Find My Ideal Loan</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="lg" className="bg-white text-secondary-700 hover:bg-gray-100">
              Apply Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
