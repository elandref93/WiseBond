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
  UserCircle as UserIcon, 
  Home, 
  Briefcase, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Clock,
  BarChart3,
  Upload,
  FileQuestion,
  ClipboardList,
  Building2,
  Info,
  AlertTriangle
} from 'lucide-react';
import ExpenseManagement from '@/components/budget/ExpenseManagement';

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
      monthlyIncome: undefined,
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
        monthlyIncome: profileData.monthlyIncome === null ? null : profileData.monthlyIncome,
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
  
  // Tab navigation items with disabled flag type
  const tabs: Array<{ id: string; label: string; icon: React.ReactNode; disabled?: boolean }> = [
    { id: 'personal', label: 'Personal & Contact Details', icon: <UserIcon className="h-5 w-5 mr-2" /> },
    { id: 'employment', label: 'Employment & Income', icon: <Briefcase className="h-5 w-5 mr-2" /> },
    { id: 'financial', label: 'Financial Management', icon: <CreditCard className="h-5 w-5 mr-2" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5 mr-2" /> },
    { id: 'applications', label: 'Loan Applications', icon: <Clock className="h-5 w-5 mr-2" /> },
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

                      <Separator className="my-6" />
                      <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                      
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
                    </div>
                  )}
                  
                  {/* Financial Management Tab */}
                  {activeTab === 'financial' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Financial Management</h2>
                      <p className="text-gray-600 mb-4">
                        Track and manage your monthly expenses to help with your home loan application.
                      </p>
                      
                      <div className="mb-6">
                        <div className="bg-gray-50 p-6 rounded-lg mb-6">
                          <h3 className="text-lg font-medium mb-4">Monthly Income</h3>
                          
                          <FormField
                            control={form.control}
                            name="monthlyIncome"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R</div>
                                  <Input 
                                    type="text" 
                                    className="pl-7 h-12 text-lg"
                                    placeholder="Your income" 
                                    value={field.value !== null && field.value !== undefined ? field.value.toString() : ''}
                                    onChange={(e) => {
                                      // Only allow digits and handle emptying the field properly
                                      const sanitized = e.target.value.replace(/[^\d]/g, '');
                                      if (sanitized === '') {
                                        // Set to null explicitly when empty (matches DB null value)
                                        field.onChange(null);
                                      } else {
                                        field.onChange(parseInt(sanitized));
                                      }
                                    }}
                                  />
                                </div>
                                <p className="text-gray-500 text-sm">
                                  Your gross monthly income before tax and deductions
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <ExpenseManagement />
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
                        <Alert className="mt-4 bg-blue-50 text-blue-700 border-blue-200">
                          <AlertDescription>
                            Please visit the Financial Management section to provide details about your income sources and expenses.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Document Management</h2>
                      <p className="text-gray-600 mb-4">
                        Upload and manage important documents for your home loan application.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-dashed border-2 hover:border-blue-400 transition-colors">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                            <Upload className="h-12 w-12 text-blue-500 mb-2" />
                            <h3 className="font-medium text-lg">ID Document</h3>
                            <p className="text-sm text-gray-500 mt-1">Upload a copy of your ID document or passport</p>
                            <Button variant="outline" size="sm" className="mt-4">Upload</Button>
                          </CardContent>
                        </Card>
                        
                        <Card className="border-dashed border-2 hover:border-blue-400 transition-colors">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                            <FileText className="h-12 w-12 text-blue-500 mb-2" />
                            <h3 className="font-medium text-lg">Proof of Income</h3>
                            <p className="text-sm text-gray-500 mt-1">Upload your last 3 months of payslips</p>
                            <Button variant="outline" size="sm" className="mt-4">Upload</Button>
                          </CardContent>
                        </Card>
                        
                        <Card className="border-dashed border-2 hover:border-blue-400 transition-colors">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                            <Building2 className="h-12 w-12 text-blue-500 mb-2" />
                            <h3 className="font-medium text-lg">Bank Statements</h3>
                            <p className="text-sm text-gray-500 mt-1">Upload your last 3 months of bank statements</p>
                            <Button variant="outline" size="sm" className="mt-4">Upload</Button>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="mt-8">
                        <h3 className="text-lg font-medium mb-4">Uploaded Documents</h3>
                        <div className="bg-muted p-8 rounded-lg flex flex-col items-center justify-center text-center">
                          <FileQuestion className="h-16 w-16 text-gray-400 mb-4" />
                          <h4 className="text-lg font-medium">No documents uploaded yet</h4>
                          <p className="text-gray-500 mt-2 max-w-md">
                            Upload the required documents above to start your home loan application process.
                          </p>
                        </div>
                      </div>
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
    </div>
  );
}