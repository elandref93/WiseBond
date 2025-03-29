import { useState, useEffect, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { UpdateProfile, User as UserType } from '@shared/schema';
import { updateProfileSchema } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import AddressInput from '@/components/AddressInput';

import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  validateSAID,
  extractDateOfBirth,
  calculateAgeFromID,
  extractGender,
  extractCitizenship,
  formatDateYYYYMMDD,
  formatIDNumber
} from '@/lib/saIDHelper';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  UserCircle as UserIcon, 
  Home, 
  Briefcase, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [idInfo, setIdInfo] = useState<{
    isValid: boolean;
    dateOfBirth?: string;
    age?: number;
    gender?: 'male' | 'female';
    citizenship?: 'SA Citizen' | 'Permanent Resident';
  }>({ isValid: false });
  
  // Fetch user profile data
  const { data: profileData, isLoading: isProfileLoading } = useQuery<UserType>({
    queryKey: ['/api/user/profile', user?.id],
    enabled: !!user,
  });

  // Set up form with zod validation
  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNumber: '',
      address: '',
      city: '',
      postalCode: '',
      province: '',
      employmentStatus: '',
      employerName: '',
      employmentSector: '',
      jobTitle: '',
      employmentDuration: '',
      monthlyIncome: 0,
    },
  });
  
  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      // Create a sanitized version of the profile data with empty string/number fallbacks
      const formData: UpdateProfile = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone || '',
        idNumber: profileData.idNumber || '',
        dateOfBirth: profileData.dateOfBirth || '',
        age: profileData.age || 0,
        address: profileData.address || '',
        city: profileData.city || '',
        postalCode: profileData.postalCode || '',
        province: profileData.province || '',
        employmentStatus: profileData.employmentStatus || '',
        employerName: profileData.employerName || '',
        employmentSector: profileData.employmentSector || '',
        jobTitle: profileData.jobTitle || '',
        employmentDuration: profileData.employmentDuration || '',
        monthlyIncome: profileData.monthlyIncome || 0,
        otpVerified: profileData.otpVerified || false,
        profileComplete: profileData.profileComplete || false
      };
      
      form.reset(formData);
      
      // Process ID number if it exists
      if (profileData.idNumber) {
        handleIdNumberValidation(profileData.idNumber);
      }
    }
  }, [profileData, form]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: UpdateProfile) => {
      return apiRequest(`/api/user/profile`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile', user?.id] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (formData: UpdateProfile) => {
    updateProfileMutation.mutate(formData);
  };
  
  // Process ID number and extract information
  const handleIdNumberValidation = (idNumber: string) => {
    if (!idNumber) {
      setIdInfo({ isValid: false });
      return;
    }
    
    const isValid = validateSAID(idNumber);
    if (!isValid) {
      setIdInfo({ isValid: false });
      return;
    }
    
    const dob = extractDateOfBirth(idNumber);
    const age = calculateAgeFromID(idNumber);
    const gender = extractGender(idNumber);
    const citizenship = extractCitizenship(idNumber);
    
    setIdInfo({
      isValid,
      dateOfBirth: dob ? formatDateYYYYMMDD(dob) : undefined,
      age: age !== null ? age : undefined,
      gender: gender !== null ? gender : undefined,
      citizenship: citizenship !== null ? citizenship : undefined,
    });
    
    // Auto-fill dateOfBirth and age from ID
    if (dob) {
      form.setValue('dateOfBirth', formatDateYYYYMMDD(dob));
    }
    if (age !== null) {
      form.setValue('age', age);
    }
  };
  
  if (isProfileLoading) {
    return <div className="flex justify-center py-8">Loading profile...</div>;
  }
  
  const watchedIdNumber = form.watch('idNumber');
  
  // Tab navigation items 
  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: <UserIcon className="h-5 w-5 mr-2" /> },
    { id: 'address', label: 'Address & Contact', icon: <Home className="h-5 w-5 mr-2" /> },
    { id: 'employment', label: 'Employment & Income', icon: <Briefcase className="h-5 w-5 mr-2" /> },
    { id: 'financial', label: 'Financial Information', icon: <CreditCard className="h-5 w-5 mr-2" />, disabled: true },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5 mr-2" />, disabled: true },
    { id: 'applications', label: 'Loan Applications', icon: <Clock className="h-5 w-5 mr-2" />, disabled: true },
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side tabs */}
        <div className="lg:w-64 w-full">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="space-y-1 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  className={`flex items-center w-full p-3 text-left rounded-md transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : tab.disabled 
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  disabled={tab.disabled}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.disabled && (
                    <Badge className="ml-auto text-xs" variant="outline">Coming Soon</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center text-amber-800 mb-2">
              <ShieldCheck className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Profile Completion</h3>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2.5">
              <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <p className="text-sm text-amber-800 mt-2">Complete your profile to improve your loan eligibility.</p>
          </div>
        </div>

        {/* Right side content */}
        <div className="flex-1">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information Tab */}
                  {activeTab === 'personal' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Personal Details</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Your first name" />
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
                                <Input {...field} placeholder="Your last name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator className="my-6" />
                      <h3 className="text-lg font-medium mb-4">ID Verification</h3>
                      
                      <FormField
                        control={form.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              South African ID Number 
                              {idInfo.isValid && <Badge className="ml-2 bg-green-500">Verified</Badge>}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="13-digit SA ID number" 
                                maxLength={13}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleIdNumberValidation(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {watchedIdNumber && !idInfo.isValid && (
                        <Alert className="mt-4 bg-red-50 text-red-700 border-red-200">
                          <AlertDescription>
                            Invalid South African ID number. Please check and enter a valid 13-digit ID number.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {idInfo.isValid && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Date of Birth</p>
                            <p>{idInfo.dateOfBirth}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Age</p>
                            <p>{idInfo.age} years</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Gender</p>
                            <p className="capitalize">{idInfo.gender}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Citizenship</p>
                            <p>{idInfo.citizenship}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Address & Contact Tab */}
                  {activeTab === 'address' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Contact Information</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="your.email@example.com" />
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
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="e.g. 0821234567 or +27821234567"
                                  pattern="(0[0-9]{9}|\+27[1-9][0-9]{8})"
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
                                Enter a valid South African phone number (e.g., 0821234567 or +27821234567)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator className="my-6" />
                      <h3 className="text-lg font-medium mb-4">Residential Address</h3>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <AddressInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Your street address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Your city" value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select province" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                                  <SelectItem value="free_state">Free State</SelectItem>
                                  <SelectItem value="gauteng">Gauteng</SelectItem>
                                  <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                                  <SelectItem value="limpopo">Limpopo</SelectItem>
                                  <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                                  <SelectItem value="northern_cape">Northern Cape</SelectItem>
                                  <SelectItem value="north_west">North West</SelectItem>
                                  <SelectItem value="western_cape">Western Cape</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. 2000" value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Employment & Income Tab */}
                  {activeTab === 'employment' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Employment Details</h2>
                      
                      <FormField
                        control={form.control}
                        name="employmentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="permanent">Permanently Employed</SelectItem>
                                <SelectItem value="contract">Contract Worker</SelectItem>
                                <SelectItem value="self_employed">Self-Employed</SelectItem>
                                <SelectItem value="unemployed">Unemployed</SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch('employmentStatus') && form.watch('employmentStatus') !== 'unemployed' && 
                      form.watch('employmentStatus') !== 'retired' && form.watch('employmentStatus') !== 'student' && (
                        <div className="mt-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="employerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employer / Company Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Name of your employer or business" value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="jobTitle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Title / Position</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Your job title" value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="employmentSector"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Industry / Sector</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select sector" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="agriculture">Agriculture & Farming</SelectItem>
                                    <SelectItem value="construction">Construction & Engineering</SelectItem>
                                    <SelectItem value="education">Education & Training</SelectItem>
                                    <SelectItem value="financial">Financial Services</SelectItem>
                                    <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
                                    <SelectItem value="it">IT & Technology</SelectItem>
                                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                    <SelectItem value="mining">Mining</SelectItem>
                                    <SelectItem value="retail">Retail & Sales</SelectItem>
                                    <SelectItem value="tourism">Tourism & Hospitality</SelectItem>
                                    <SelectItem value="transport">Transport & Logistics</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="employmentDuration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Length of Employment</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="less_than_1">Less than 1 year</SelectItem>
                                    <SelectItem value="1_to_2">1-2 years</SelectItem>
                                    <SelectItem value="3_to_5">3-5 years</SelectItem>
                                    <SelectItem value="6_to_10">6-10 years</SelectItem>
                                    <SelectItem value="more_than_10">More than 10 years</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  How long have you been with your current employer?
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="monthlyIncome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Income</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      className="pl-7"
                                      placeholder="Your gross monthly income" 
                                      value={field.value ?? 0}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        field.onChange(value);
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Your gross monthly income before tax and deductions
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {form.watch('employmentStatus') && (form.watch('employmentStatus') === 'unemployed' || 
                        form.watch('employmentStatus') === 'retired' || form.watch('employmentStatus') === 'student') && (
                        <Alert className="mt-4 bg-blue-50 text-blue-700 border-blue-200">
                          <AlertDescription>
                            Please fill out the financial information section to provide details about your income sources and financial situation.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Financial Information Tab - Disabled for now */}
                  {activeTab === 'financial' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Financial Information</h2>
                      <p className="text-gray-500">This section will be available soon.</p>
                    </div>
                  )}
                  
                  {/* Documents Tab - Disabled for now */}
                  {activeTab === 'documents' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Documents</h2>
                      <p className="text-gray-500">This section will be available soon.</p>
                    </div>
                  )}
                  
                  {/* Applications Tab - Disabled for now */}
                  {activeTab === 'applications' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Loan Applications</h2>
                      <p className="text-gray-500">This section will be available soon.</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-6">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="min-w-[150px] bg-amber-500 hover:bg-amber-600"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}