import SignUpForm from "@/components/auth/SignUpForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUp() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Create Account
          </h1>
          <p className="mt-2 text-gray-600">
            Join WiseBond to start your home loan journey
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Create your account to save calculations and track applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
