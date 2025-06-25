import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { PlusIcon, HomeIcon, MapPinIcon, EditIcon, TrashIcon, LineChartIcon } from "lucide-react";
import AddPropertyDialog from "@/components/properties/AddPropertyDialog";
import EditPropertyDialog from "@/components/properties/EditPropertyDialog";
import PropertyScenarios from "@/components/properties/PropertyScenarios";
import { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/calculators";

export default function PropertiesManager() {
  const { user } = useAuth();
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
    mutationFn: async (property: Property) => {
      return await apiRequest(`/api/properties/${property.id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: 'Property Deleted',
        description: 'The property has been successfully removed from your portfolio.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete property. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteProperty = (property: Property) => {
    if (confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
      deletePropertyMutation.mutate(property);
    }
  };

  // If viewing scenarios for a specific property
  if (selectedProperty) {
    return (
      <PropertyScenarios 
        property={selectedProperty} 
        onBack={() => setSelectedProperty(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Property Portfolio</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your properties and analyze loan scenarios
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800 text-sm">Failed to load properties. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && properties.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <HomeIcon className="w-10 h-10 text-gray-400 mb-3" />
            <h4 className="text-base font-semibold text-gray-900 mb-2">No properties yet</h4>
            <p className="text-gray-600 text-center text-sm mb-4 max-w-md">
              Add your first property to start analyzing loan scenarios and potential savings.
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold truncate">{property.name}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      <span className="truncate">{property.city}, {property.province}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {property.bank}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Property Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Property Value</span>
                    <span className="font-semibold">{formatCurrency(property.propertyValue)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Current Balance</span>
                    <span className="font-semibold">{formatCurrency(property.currentLoanBalance)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Interest Rate</span>
                    <span className="font-semibold">{property.currentInterestRate}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Monthly Payment</span>
                    <span className="font-semibold">{formatCurrency(property.currentMonthlyPayment)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Remaining Term</span>
                    <span className="font-semibold">{Math.round(property.remainingTerm / 12)} years</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
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
  );
}