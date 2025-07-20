import { useEffect } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";
import SEO from "@/components/SEO";
import { pageSEO } from "@/lib/seo";

export default function Login() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to homepage if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);
  
  // Show loading while checking auth state
  if (isLoading) {
    return <Loading />;
  }
  
  // If not logged in, show login form
  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <SEO
          title={pageSEO.login.title}
          description={pageSEO.login.description}
          openGraph={{
            title: pageSEO.login.title,
            description: pageSEO.login.description,
            url: "https://wisebond.co.za/login",
          }}
          additionalMetaTags={[
            {
              name: "keywords",
              content: pageSEO.login.keywords,
            },
          ]}
        />
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-gray-600">
              Log in to access your WiseBond account
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // This will not be rendered as the useEffect will redirect
  return <Loading />;
}
