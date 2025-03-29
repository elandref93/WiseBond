import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CalculationResult } from '@/lib/calculators';

// Define validation schema for email form
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

type EmailFormValues = z.infer<typeof formSchema>;

interface EmailCalculationFormProps {
  result: CalculationResult;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmailCalculationForm({ 
  result, 
  onSuccess,
  onCancel
}: EmailCalculationFormProps) {
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  // Handle form submission
  const onSubmit = async (values: EmailFormValues) => {
    try {
      // Send calculation results and user info to the server
      const response = await apiRequest('/api/calculations/email', {
        method: 'POST',
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          calculationType: result.type,
          calculationData: result,
        }),
      });
      
      // Parse response
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        toast({
          title: 'Calculation saved!',
          description: data.message || `We've sent the calculation results to ${values.email}`,
        });
        
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // API returned error
        console.error('Failed to send calculation (API error):', data.message);
        toast({
          title: 'Email delivery issue',
          description: data.message || 'Your information was saved, but there was a problem sending the email. Our team will contact you soon.',
          variant: 'destructive',
        });
        
        // Still call onSuccess since the data was saved
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      // Connection/network error
      console.error('Failed to send calculation (connection error):', error);
      toast({
        title: 'Connection problem',
        description: 'There was a problem connecting to our servers. Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email address" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Sending...' : 'Send Calculation'}
          </Button>
        </div>
      </form>
    </Form>
  );
}