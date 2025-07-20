import SignUpForm from "@/components/auth/SignUpForm";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { pageSEO } from "@/lib/seo";

export default function SignUp() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <SEO
        title={pageSEO.signup.title}
        description={pageSEO.signup.description}
        openGraph={{
          title: pageSEO.signup.title,
          description: pageSEO.signup.description,
          url: "https://wisebond.co.za/signup",
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: pageSEO.signup.keywords,
          },
        ]}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Create Account
          </h1>
          <p className="mt-2 text-gray-600">
            Join WiseBond to start your home loan journey
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
