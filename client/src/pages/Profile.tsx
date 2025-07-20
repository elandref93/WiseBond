import { useState, useEffect, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { UpdateProfile, User as UserType } from '@shared/schema';
import { updateProfileSchema } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import ImprovedAddressInput from '@/components/ImprovedAddressInput';
import PropertiesManager from '@/components/PropertiesManager';

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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { 
  UserCircle as UserIcon, 
  Home, 
  Briefcase, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Clock,
  BarChart3,
  Loader2,
  Upload,
  FileQuestion,
  ClipboardList,
  Building2,
  Info,
  AlertTriangle
} from 'lucide-react';
import ExpenseManagement from '@/components/budget/ExpenseManagement';
import DocumentManager from '@/components/documents/DocumentManager';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [showOtpDialog, setShowOtpDialog] = useState<boolean>(false);
  const [mobileOtp, setMobileOtp] = useState<string>('');
  const [verifyingMobile, setVerifyingMobile] = useState<boolean>(false);
  const [idInfo, setIdInfo] = useState<{
    isValid: boolean;
    dateOfBirth?: string;
    age?: number;
    gender?: 'male' | 'female';
    citizenship?: 'SA Citizen' | 'Permanent Resident';
  }>({ isValid: false });
  
  // Fetch user profile data
  const { data: profileData, isLoading: isProfileLoading } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
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
      monthlyIncome: undefined,
      maritalStatus: undefined,
      hasCoApplicant: false,

      coApplicantFirstName: '',
      coApplicantLastName: '',
      coApplicantEmail: '',
      coApplicantPhone: '',
      coApplicantIdNumber: '',
      coApplicantDateOfBirth: '',
      coApplicantEmploymentStatus: undefined,
      coApplicantEmployerName: '',
      coApplicantMonthlyIncome: undefined,
      sameAddress: true,
      coApplicantAddress: '',
      coApplicantCity: '',
      coApplicantPostalCode: '',
      coApplicantProvince: '',
      otpVerified: false,
      phoneVerified: false,
      profileComplete: false
    },
  });
  
  // State for co-applicant ID validation
  const [coApplicantIdInfo, setCoApplicantIdInfo] = useState<{
    isValid: boolean;
    dateOfBirth?: string;
    age?: number;
    gender?: 'male' | 'female';
    citizenship?: 'SA Citizen' | 'Permanent Resident';
  }>({ isValid: false });
  
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
        monthlyIncome: profileData.monthlyIncome === null ? null : profileData.monthlyIncome,
        maritalStatus: profileData.maritalStatus as 'Single' | 'Married' | 'Divorced' | 'Widowed' | undefined,
        hasCoApplicant: profileData.hasCoApplicant || false,

        coApplicantFirstName: profileData.coApplicantFirstName || '',
        coApplicantLastName: profileData.coApplicantLastName || '',
        coApplicantEmail: profileData.coApplicantEmail || '',
        coApplicantPhone: profileData.coApplicantPhone || '',
        coApplicantIdNumber: profileData.coApplicantIdNumber || '',
        coApplicantDateOfBirth: profileData.coApplicantDateOfBirth || '',
        coApplicantEmploymentStatus: profileData.coApplicantEmploymentStatus as 'Employed' | 'Self-employed' | 'Unemployed' | 'Retired' | 'Student' | undefined,
        coApplicantEmployerName: profileData.coApplicantEmployerName || '',
        coApplicantMonthlyIncome: profileData.coApplicantMonthlyIncome === null ? null : profileData.coApplicantMonthlyIncome,
        sameAddress: profileData.sameAddress ?? true,
        coApplicantAddress: profileData.coApplicantAddress || '',
        coApplicantCity: profileData.coApplicantCity || '',
        coApplicantPostalCode: profileData.coApplicantPostalCode || '',
        coApplicantProvince: profileData.coApplicantProvince || '',
        otpVerified: profileData.otpVerified || false,
        phoneVerified: profileData.phoneVerified || false,
        profileComplete: profileData.profileComplete || false
      };
      
      form.reset(formData);
      
      // Process ID number if it exists
      if (profileData.idNumber) {
        handleIdNumberValidation(profileData.idNumber);
      }
      // Process co-applicant ID number if it exists
      if (profileData.coApplicantIdNumber) {
        handleCoApplicantIdNumberValidation(profileData.coApplicantIdNumber);
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
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: Error) => {
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
  
  // Process ID number and extract information for main applicant
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
  
  // Process ID number and extract information for co-applicant
  const handleCoApplicantIdNumberValidation = (idNumber: string) => {
    if (!idNumber) {
      setCoApplicantIdInfo({ isValid: false });
      return;
    }
    
    const isValid = validateSAID(idNumber);
    if (!isValid) {
      setCoApplicantIdInfo({ isValid: false });
      return;
    }
    
    const dob = extractDateOfBirth(idNumber);
    const age = calculateAgeFromID(idNumber);
    const gender = extractGender(idNumber);
    const citizenship = extractCitizenship(idNumber);
    
    setCoApplicantIdInfo({
      isValid,
      dateOfBirth: dob ? formatDateYYYYMMDD(dob) : undefined,
      age: age !== null ? age : undefined,
      gender: gender !== null ? gender : undefined,
      citizenship: citizenship !== null ? citizenship : undefined,
    });
    
    // Auto-fill co-applicant dateOfBirth from ID
    if (dob) {
      form.setValue('coApplicantDateOfBirth', formatDateYYYYMMDD(dob));
    }
  };
  
  if (isProfileLoading) {
    return <div className="flex justify-center py-8">Loading profile...</div>;
  }
  
  const watchedIdNumber = form.watch('idNumber');
  const watchedCoApplicantIdNumber = form.watch('coApplicantIdNumber');
  const watchedMaritalStatus = form.watch('maritalStatus');
  const watchedHasCoApplicant = form.watch('hasCoApplicant');
  
  // Only show co-applicant section when they explicitly choose to add a co-applicant
  const showCoApplicantSection = watchedHasCoApplicant;
  
  // Tab navigation items with disabled flag type
  const tabs: Array<{ id: string; label: string; icon: React.ReactNode; disabled?: boolean }> = [
    { id: 'personal', label: 'Personal & Contact Details', icon: <UserIcon className="h-5 w-5 mr-2" /> },
    { id: 'employment', label: 'Employment & Income', icon: <Briefcase className="h-5 w-5 mr-2" /> },
    { id: 'properties', label: 'My Properties', icon: <Home className="h-5 w-5 mr-2" /> },
    { id: 'financial', label: 'Financial Management', icon: <CreditCard className="h-5 w-5 mr-2" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5 mr-2" /> },
    { id: 'applications', label: 'Loan Applications', icon: <Clock className="h-5 w-5 mr-2" /> },
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {profileData?.firstName || 'there'}!
        </h1>
        <p className="text-gray-600 mt-2">Manage your profile, documents, and loan applications all in one place.</p>
      </div>
      
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
                      ? 'bg-orange-50 text-orange-700 font-medium' 
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
                  {/* Personal & Contact Details Tab */}
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
                                <Input 
                                  {...field} 
                                  placeholder="Your first name" 
                                  onChange={(e) => {
                                    // Only allow letters, spaces, hyphens and apostrophes
                                    const value = e.target.value;
                                    const sanitized = value.replace(/[^a-zA-Z\s\-']/g, '');
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
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Your last name" 
                                  onChange={(e) => {
                                    // Only allow letters, spaces, hyphens and apostrophes
                                    const value = e.target.value;
                                    const sanitized = value.replace(/[^a-zA-Z\s\-']/g, '');
                                    field.onChange(sanitized);
                                  }}
                                />
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

                      <Separator className="my-6" />
                      <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between items-center mb-1">
                                <FormLabel>Email Address</FormLabel>
                                {form.watch('otpVerified') ? (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                    Unverified
                                  </Badge>
                                )}
                              </div>
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
                              <div className="flex justify-between items-center mb-1">
                                <FormLabel>Phone Number</FormLabel>
                                {form.watch('phoneVerified') ? (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                    Unverified
                                  </Badge>
                                )}
                              </div>
                              <FormControl>
                                <div className="relative">
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
                                  {!form.watch('phoneVerified') && (
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 text-xs"
                                      onClick={async () => {
                                        try {
                                          // Send phone OTP
                                          const response = await apiRequest('/api/auth/send-phone-otp', {
                                            method: 'POST',
                                            body: JSON.stringify({
                                              userId: user?.id,
                                              phone: field.value
                                            }),
                                          });
                                          
                                          const data = await response.json();
                                          
                                          if (data.developmentOtp) {
                                            toast({
                                              title: "Development Mode - Phone OTP",
                                              description: `Use this OTP code: ${data.developmentOtp}`,
                                            });
                                          } else {
                                            toast({
                                              title: "Phone OTP Sent",
                                              description: "Verification code sent to your phone number.",
                                            });
                                          }
                                          
                                          setShowOtpDialog(true);
                                        } catch (error) {
                                          toast({
                                            title: "Failed to send OTP",
                                            description: "Please try again later.",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      Verify
                                    </Button>
                                  )}
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                We'll send a verification code to this number
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
                              <ImprovedAddressInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Your street address"
                                onSelect={(address) => {
                                  field.onChange(address.streetAddress);
                                  form.setValue('city', address.city);
                                  form.setValue('province', address.province);
                                  form.setValue('postalCode', address.postalCode);
                                }}
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
                      
                      <Separator className="my-6" />
                      <h3 className="text-lg font-medium mb-4">Marital Status & Co-Application</h3>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={form.control}
                          name="maritalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marital Status</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  // When changing from "Married" to another status, reset hasCoApplicant
                                  if (field.value === 'Married' && value !== 'Married') {
                                    form.setValue('hasCoApplicant', false);
                                  }
                                  field.onChange(value);
                                }}
                                value={field.value || undefined}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select marital status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Single">Single</SelectItem>
                                  <SelectItem value="Married">Married</SelectItem>
                                  <SelectItem value="Divorced">Divorced</SelectItem>
                                  <SelectItem value="Widowed">Widowed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                This affects your loan application options
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Show co-applicant option when married */}
                        {watchedMaritalStatus === 'Married' && (
                          <div className="p-4 border border-orange-100 bg-orange-50 rounded-lg">
                            <div className="flex items-start">
                              <Info className="h-5 w-5 text-orange-500" />
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-orange-700">
                                  You indicated that you're married
                                </h4>
                                <p className="text-sm text-orange-600 mb-4">
                                  Would you like to include your spouse as a co-applicant on your home loan application? 
                                  This may increase your chances of approval and potentially qualify you for a higher loan amount.
                                </p>
                                
                                <FormField
                                  control={form.control}
                                  name="hasCoApplicant"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-orange-200 bg-white p-4">
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                          Include spouse as co-applicant
                                        </FormLabel>
                                        <FormDescription>
                                          We'll need some basic information about your spouse
                                        </FormDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Show standalone co-applicant option when not married */}
                        {watchedMaritalStatus !== 'Married' && watchedMaritalStatus !== undefined && (
                          <FormField
                            control={form.control}
                            name="hasCoApplicant"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Apply with a Co-Applicant
                                  </FormLabel>
                                  <FormDescription>
                                    Add a partner to your application
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      {showCoApplicantSection && (
                        <div className="space-y-6 mt-6 p-4 border border-orange-100 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-orange-500" />
                            <h3 className="text-lg font-medium text-orange-700">Co-Applicant Information</h3>
                          </div>
                          <p className="text-sm text-orange-600">
                            Adding a co-applicant may increase your chances of loan approval and may allow for a higher loan amount.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="coApplicantFirstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="Co-applicant's first name" 
                                      onChange={(e) => {
                                        // Only allow letters, spaces, hyphens and apostrophes
                                        const value = e.target.value;
                                        const sanitized = value.replace(/[^a-zA-Z\s\-']/g, '');
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
                              name="coApplicantLastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="Co-applicant's last name" 
                                      onChange={(e) => {
                                        // Only allow letters, spaces, hyphens and apostrophes
                                        const value = e.target.value;
                                        const sanitized = value.replace(/[^a-zA-Z\s\-']/g, '');
                                        field.onChange(sanitized);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="coApplicantIdNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    South African ID Number 
                                    {coApplicantIdInfo.isValid && <Badge className="ml-2 bg-green-500">Verified</Badge>}
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="13-digit SA ID number" 
                                      maxLength={13}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        handleCoApplicantIdNumberValidation(e.target.value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {watchedCoApplicantIdNumber && !coApplicantIdInfo.isValid && (
                              <Alert className="mt-4 bg-red-50 text-red-700 border-red-200">
                                <AlertDescription>
                                  Invalid South African ID number. Please check and enter a valid 13-digit ID number.
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {coApplicantIdInfo.isValid && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-lg">
                                <div>
                                  <p className="text-sm font-medium">Date of Birth</p>
                                  <p>{coApplicantIdInfo.dateOfBirth}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Age</p>
                                  <p>{coApplicantIdInfo.age} years</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Gender</p>
                                  <p className="capitalize">{coApplicantIdInfo.gender}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Citizenship</p>
                                  <p>{coApplicantIdInfo.citizenship}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="coApplicantEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" placeholder="Co-applicant's email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="coApplicantPhone"
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="coApplicantEmploymentStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employment Status</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Employed">Employed</SelectItem>
                                    <SelectItem value="Self-employed">Self-Employed</SelectItem>
                                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                                    <SelectItem value="Retired">Retired</SelectItem>
                                    <SelectItem value="Student">Student</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {(form.watch('coApplicantEmploymentStatus') === 'Employed' || 
                            form.watch('coApplicantEmploymentStatus') === 'Self-employed') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="coApplicantEmployerName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Employer / Company Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field} 
                                        placeholder="Name of employer or business" 
                                        value={field.value || ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="coApplicantMonthlyIncome"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Monthly Income</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                          <span className="text-gray-500 sm:text-sm">R</span>
                                        </div>
                                        <Input
                                          {...field}
                                          className="pl-8"
                                          placeholder="e.g. 25,000"
                                          value={field.value === undefined || field.value === null ? '' : field.value}
                                          onChange={(e) => {
                                            // Remove currency formatting for data value
                                            const valueWithoutR = e.target.value.replace(/R/g, '');
                                            const numericValue = valueWithoutR.replace(/[^0-9]/g, '');
                                            
                                            // Convert to number or undefined if empty
                                            const value = numericValue === '' ? undefined : Number(numericValue);
                                            field.onChange(value);
                                          }}
                                          onBlur={(e) => {
                                            if (field.value) {
                                              // Format the display when field loses focus
                                              const formattedValue = field.value.toLocaleString('en-ZA');
                                              e.target.value = `R${formattedValue}`;
                                            }
                                          }}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          
                          <FormField
                            control={form.control}
                            name="sameAddress"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Same Address as Main Applicant
                                  </FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          {!form.watch('sameAddress') && (
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="coApplicantAddress"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Street Address</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Co-applicant's street address"
                                        value={field.value || ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                  control={form.control}
                                  name="coApplicantCity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>City</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="City" value={field.value || ''} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="coApplicantProvince"
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
                                  name="coApplicantPostalCode"
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
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Financial Management Tab */}
                  {activeTab === 'financial' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Financial Management</h2>
                      <p className="text-gray-600 mb-4">
                        Track and manage your monthly expenses to help with your home loan application.
                      </p>
                      
                      <ExpenseManagement />
                    </div>
                  )}
                  
                  {/* Properties Tab */}
                  {activeTab === 'properties' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">My Properties</h2>
                      <p className="text-gray-600 mb-4">
                        Manage your property portfolio and loan scenarios to find the best financing options.
                      </p>
                      
                      <PropertiesManager />
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
                                    <Input
                                      {...field} 
                                      placeholder="Name of your employer or business" 
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        // Only allow letters, numbers, spaces, hyphens, apostrophes, and some basic punctuation
                                        const value = e.target.value;
                                        const sanitized = value.replace(/[^\w\s\-'.&()]/g, '');
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
                              name="jobTitle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Title / Position</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="Your job title" 
                                      value={field.value || ''} 
                                      onChange={(e) => {
                                        // Only allow letters, spaces, hyphens apostrophes, and some basic punctuation
                                        const value = e.target.value;
                                        const sanitized = value.replace(/[^\w\s\-'.&()]/g, '');
                                        field.onChange(sanitized);
                                      }}
                                    />
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
                        </div>
                      )}

                      {form.watch('employmentStatus') && (form.watch('employmentStatus') === 'unemployed' || 
                        form.watch('employmentStatus') === 'retired' || form.watch('employmentStatus') === 'student') && (
                        <Alert className="mt-4 bg-orange-50 text-orange-700 border-orange-200">
                          <AlertDescription>
                            Please visit the Financial Management section to provide details about your income sources and expenses.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <div>
                      {/* Using the full-featured DocumentManager component */}
                      <DocumentManager />
                    </div>
                  )}
                  
                  {/* Loan Applications Tab */}
                  {activeTab === 'applications' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Loan Applications</h2>
                      <p className="text-gray-600 mb-4">
                        View and track the status of your home loan applications.
                      </p>
                      
                      <div className="mt-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium">Start a New Application</h3>
                                <p className="text-gray-500 mt-1">Begin your journey to homeownership</p>
                              </div>
                              <Button>Apply Now</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="mt-8">
                        <h3 className="text-lg font-medium mb-4">Your Applications</h3>
                        <div className="bg-muted p-8 rounded-lg flex flex-col items-center justify-center text-center">
                          <ClipboardList className="h-16 w-16 text-gray-400 mb-4" />
                          <h4 className="text-lg font-medium">No applications yet</h4>
                          <p className="text-gray-500 mt-2 max-w-md">
                            You haven't started any home loan applications. Click "Apply Now" to begin.
                          </p>
                          <div className="mt-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md">
                              <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                                <div>
                                  <h5 className="font-medium text-amber-800">Application Requirements</h5>
                                  <p className="text-sm text-amber-700 mt-1">
                                    To complete your application, make sure to upload all required documents and
                                    complete your personal profile information.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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

      {/* Mobile OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Mobile Number</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to your mobile phone to verify your number.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            <InputOTP 
              maxLength={6}
              value={mobileOtp}
              onChange={(value) => setMobileOtp(value)}
              render={() => (
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              )} 
            />
            <p className="text-sm text-muted-foreground mt-4">
              Didn't receive a code? <Button variant="link" className="p-0 h-auto" onClick={() => {
                toast({
                  title: "Code Resent",
                  description: "A new verification code has been sent to your mobile number."
                });
              }}>Resend Code</Button>
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setShowOtpDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                setVerifyingMobile(true);
                try {
                  // Verify phone OTP with actual API
                  const response = await apiRequest('/api/auth/verify-phone-otp', {
                    method: 'POST',
                    body: JSON.stringify({
                      userId: user?.id,
                      otp: mobileOtp
                    }),
                  });
                  
                  if (response.ok) {
                    setShowOtpDialog(false);
                    setMobileOtp('');
                    
                    // Update the form and refresh user data
                    form.setValue('phoneVerified', true);
                    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                    
                    toast({
                      title: "Mobile Verified",
                      description: "Your mobile number has been successfully verified.",
                    });
                  } else {
                    const errorData = await response.json();
                    toast({
                      title: "Verification Failed",
                      description: errorData.message || "Invalid OTP code. Please try again.",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  toast({
                    title: "Verification Failed",
                    description: "An error occurred. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setVerifyingMobile(false);
                }
              }}
              disabled={mobileOtp.length !== 6 || verifyingMobile}
              className="w-full sm:w-auto"
            >
              {verifyingMobile ? "Verifying..." : "Verify Mobile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}