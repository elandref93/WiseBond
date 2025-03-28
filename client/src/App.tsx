import React, { Suspense, lazy, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "./components/Loading";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Services = lazy(() => import("@/pages/Services"));
const Calculators = lazy(() => import("@/pages/Calculators"));
const Determinator = lazy(() => import("@/pages/Determinator"));
const LoanEligibility = lazy(() => import("@/pages/LoanEligibility"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Contact = lazy(() => import("@/pages/Contact"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Login = lazy(() => import("@/pages/Login"));
const Profile = lazy(() => import("@/pages/Profile"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/calculators" component={Calculators} />
      <Route path="/determinator" component={Determinator} />
      <Route path="/loan-eligibility" component={LoanEligibility} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/signup" component={SignUp} />
      <Route path="/login" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Fetch any initial data needed
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['/api/auth/me'],
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<Loading />}>
              <Router />
            </Suspense>
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
