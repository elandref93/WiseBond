import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { PlusIcon, HomeIcon, BanknoteIcon, CalendarIcon, MapPinIcon, EditIcon, TrashIcon, LineChartIcon } from "lucide-react";
import AddPropertyDialog from "@/components/properties/AddPropertyDialog";
import EditPropertyDialog from "@/components/properties/EditPropertyDialog";
import PropertyScenarios from "@/components/properties/PropertyScenarios";
import { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

export default function Properties() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Fetch user's properties
  const { data: properties = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !!user
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await apiRequest(`/api/properties/${propertyId}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Property deleted",
        description: "Property has been successfully removed from your portfolio.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const handleDeleteProperty = (property: Property) => {
    if (window.confirm(`Are you sure you want to delete "${property.name}"? This will also remove all associated scenarios.`)) {
      deletePropertyMutation.mutate(property.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  if (selectedProperty) {
    return (
      <PropertyScenarios 
        property={selectedProperty} 
        onBack={() => setSelectedProperty(null)} 
      />
    );
  }

  return (
    <>
      <SEO
        title="My Properties - WiseBond"
        description="Manage your property portfolio and analyze loan scenarios. Track your home loans, compare options, and optimize your mortgage strategy."
        openGraph={{
          title: "My Properties - WiseBond",
          description: "Manage your property portfolio and analyze loan scenarios.",
          url: "https://wisebond.co.za/properties",
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: "property portfolio, loan scenarios, mortgage management, home loan tracking, WiseBond",
          },
        ]}
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
            <p className="text-gray-600 mt-1">
              Manage your property portfolio and loan scenarios
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Property
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-800">Failed to load properties. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && properties.length === 0 && (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HomeIcon className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Add your first property to start analyzing your loan scenarios and potential savings.
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Add Your First Property
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Properties Grid */}
        {!isLoading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold truncate">{property.name}</CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        <span className="truncate">{property.city}, {property.province}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {property.bank}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Property Value */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Property Value</span>
                    <span className="font-semibold">{formatCurrency(property.propertyValue)}</span>
                  </div>

                  {/* Current Balance */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Balance</span>
                    <span className="font-semibold text-red-600">{formatCurrency(property.currentLoanBalance)}</span>
                  </div>

                  {/* Monthly Payment */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Payment</span>
                    <span className="font-semibold">{formatCurrency(property.currentMonthlyPayment)}</span>
                  </div>

                  {/* Interest Rate */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interest Rate</span>
                    <span className="font-semibold">{property.currentInterestRate}%</span>
                  </div>

                  {/* Remaining Term */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining Term</span>
                    <span className="font-semibold">{Math.round(property.remainingTerm / 12)} years</span>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedProperty(property)}
                    >
                      <LineChartIcon className="w-4 h-4 mr-1" />
                      Scenarios
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProperty(property)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProperty(property)}
                      disabled={deletePropertyMutation.isPending}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <AddPropertyDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog} 
        />
        
        {editingProperty && (
          <EditPropertyDialog 
            property={editingProperty}
            open={!!editingProperty} 
            onOpenChange={(open) => {
              if (!open) setEditingProperty(null);
            }}
          />
        )}
        </div>
      </div>
    </>
  );
}