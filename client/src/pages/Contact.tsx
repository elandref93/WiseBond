import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Phone, Mail, Clock } from "lucide-react";
import SEO from "@/components/SEO";
import { pageSEO } from "@/lib/seo";

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .refine(
      (val) => /^[A-Za-z\s\-']+$/.test(val), 
      { message: "Name can only contain letters, spaces, hyphens and apostrophes" }
    ),
  email: z.string()
    .refine(
      (val) => /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/.test(val),
      { message: "Please enter a valid email address" }
    ),
  phone: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Allow empty as it's optional
      // Match either 10 digits starting with 0 or +27 followed by 9 digits
      return /^(0\d{9}|\+27[1-9]\d{8})$/.test(val);
    },
    { message: "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)" }
  ),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type ContactFormValues = z.infer<typeof formSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Default form values
  const defaultValues: ContactFormValues = {
    name: "",
    email: "",
    phone: "",
    message: "",
  };

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(values)
      });
      
      toast({
        title: "Message sent successfully",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO
        title={pageSEO.contact.title}
        description={pageSEO.contact.description}
        openGraph={{
          title: pageSEO.contact.title,
          description: pageSEO.contact.description,
          url: "https://wisebond.co.za/contact",
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: pageSEO.contact.keywords,
          },
        ]}
      />
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            Have questions about our services or need help with your home loan
            application? Our team is here to help.
          </p>
        </div>
      </div>

      {/* Contact Form and Info */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
              <p className="mt-4 text-gray-500">
                Fill out the form below and one of our home loan consultants will
                get back to you within 24 hours.
              </p>

              <div className="mt-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your full name" 
                              {...field} 
                              onChange={(e) => {
                                // Only allow letters, spaces, hyphens and apostrophes
                                const value = e.target.value;
                                const sanitized = value.replace(/[^A-Za-z\s\-']/g, '');
                                field.onChange(sanitized);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your.email@example.com" 
                              {...field} 
                              className={form.formState.errors.email ? "border-red-500 focus:ring-red-500" : ""}
                              onChange={(e) => {
                                field.onChange(e);
                                // Live validation feedback
                                const emailRegex = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/;
                                const isValid = emailRegex.test(e.target.value);
                                const emailInput = e.target as HTMLInputElement;
                                if (e.target.value && !isValid) {
                                  emailInput.classList.add("border-red-500");
                                  emailInput.classList.add("bg-red-50");
                                } else {
                                  emailInput.classList.remove("border-red-500");
                                  emailInput.classList.remove("bg-red-50");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0821234567 or +27821234567" 
                              {...field} 
                              maxLength={12}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only digits and plus sign
                                const sanitized = value.replace(/[^\d+]/g, '');
                                
                                // Enforce length constraints
                                if (sanitized.startsWith('+27') && sanitized.length > 12) {
                                  field.onChange(sanitized.substring(0, 12));
                                } else if (sanitized.startsWith('0') && sanitized.length > 10) {
                                  field.onChange(sanitized.substring(0, 10));
                                } else {
                                  field.onChange(sanitized);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Add your phone number if you prefer to be contacted by phone. Use format 0821234567 or +27821234567.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="How can we help you? Let us know about your home loan needs or any questions you have."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>

            <div className="mt-12 lg:mt-0">
              <h2 className="text-2xl font-bold text-gray-900">Contact information</h2>
              <p className="mt-4 text-gray-500">
                Prefer to reach out directly? Use any of the contact methods below.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <Phone className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                    <p className="mt-1 text-gray-500">
                      Call our toll-free number for general inquiries
                    </p>
                    <p className="mt-2 text-xl font-medium text-primary">
                      0800 123 4567
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <Mail className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Email</h3>
                    <p className="mt-1 text-gray-500">
                      Send us an email anytime
                    </p>
                    <p className="mt-2 text-xl font-medium text-primary">
                      info@wisebond.co.za
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Hours</h3>
                    <p className="mt-1 text-gray-500">
                      Our support team is available:
                    </p>
                    <p className="mt-2 text-gray-700">
                      Monday - Friday: 8:00 AM - 6:00 PM<br />
                      Saturday: 9:00 AM - 1:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offices Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Offices
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
              Visit us at any of our locations across South Africa
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Johannesburg */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900">Johannesburg (Head Office)</h3>
              <p className="mt-2 text-gray-500">
                Coldstream Office Park<br />
                Unit 17, 2 Coldstream Street<br />
                Wilgespruit, Roodepoort<br />
                Johannesburg, 1735<br />
                <span className="text-primary">+27 11 234 5678</span>
              </p>
            </div>

            {/* Cape Town */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900">Cape Town</h3>
              <p className="mt-2 text-gray-500">
                Subtropica Office Park<br />
                Klapmuts<br />
                Cape Town, 7625<br />
                <span className="text-primary">+27 21 345 6789</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section (Placeholder) */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="lg:text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Visit Us
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-3xl lg:mx-auto">
              Find our offices across South Africa
            </p>
          </div>

          <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-center">
              Interactive map will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
