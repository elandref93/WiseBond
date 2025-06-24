import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, PlusIcon, EditIcon, TrashIcon, ToggleLeftIcon, ToggleRightIcon } from "lucide-react";
import { Property, LoanScenario } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddScenarioDialog from "./AddScenarioDialog";
import EditScenarioDialog from "./EditScenarioDialog";
import PropertyAnalysisChart from "./PropertyAnalysisChart";
import AmortizationTable from "./AmortizationTable";
import { generatePropertyAnalysis, PropertyAnalysis, formatCurrency } from "@/lib/propertyCalculations";

interface PropertyScenariosProps {
  property: Property;
  onBack: () => void;
}

export default function PropertyScenarios({ property, onBack }: PropertyScenariosProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingScenario, setEditingScenario] = useState<LoanScenario | null>(null);
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);

  // Fetch scenarios for this property
  const { data: scenarios = [], isLoading } = useQuery<LoanScenario[]>({
    queryKey: ['/api/properties', property.id, 'scenarios'],
  });

  // Toggle scenario active state
  const toggleScenarioMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/scenarios/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'scenarios'] });
      toast({
        title: "Scenario updated",
        description: "Scenario status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (scenarioId: number) => {
      const response = await apiRequest('DELETE', `/api/scenarios/${scenarioId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'scenarios'] });
      toast({
        title: "Scenario deleted",
        description: "Scenario has been successfully removed.",
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

  // Recalculate analysis when scenarios change
  useEffect(() => {
    if (scenarios.length >= 0) {
      const newAnalysis = generatePropertyAnalysis(property, scenarios);
      setAnalysis(newAnalysis);
    }
  }, [property, scenarios]);

  const handleToggleScenario = (scenario: LoanScenario) => {
    toggleScenarioMutation.mutate({
      id: scenario.id,
      isActive: !scenario.isActive
    });
  };

  const handleDeleteScenario = (scenario: LoanScenario) => {
    if (window.confirm(`Are you sure you want to delete the scenario "${scenario.name}"?`)) {
      deleteScenarioMutation.mutate(scenario.id);
    }
  };

  const getScenarioTypeLabel = (type: string) => {
    switch (type) {
      case 'lump_sum':
        return 'Lump Sum Payment';
      case 'extra_monthly':
        return 'Extra Monthly Payment';
      case 'monthly_increase':
        return 'Monthly Payment Increase';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Properties
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-gray-600 mt-1">
              {property.address}, {property.city}, {property.province}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Scenario
          </Button>
        </div>

        {/* Property Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Property Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Property Value</p>
                <p className="text-lg font-semibold">{formatCurrency(property.propertyValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(property.currentLoanBalance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Payment</p>
                <p className="text-lg font-semibold">{formatCurrency(property.currentMonthlyPayment)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Interest Rate</p>
                <p className="text-lg font-semibold">{property.currentInterestRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scenarios List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Loan Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : scenarios.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No scenarios yet</p>
                    <Button onClick={() => setShowAddDialog(true)} size="sm">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add First Scenario
                    </Button>
                  </div>
                ) : (
                  scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        scenario.isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold truncate">{scenario.name}</h4>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleScenario(scenario)}
                            disabled={toggleScenarioMutation.isPending}
                          >
                            {scenario.isActive ? (
                              <ToggleRightIcon className="w-4 h-4 text-primary" />
                            ) : (
                              <ToggleLeftIcon className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingScenario(scenario)}
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteScenario(scenario)}
                            disabled={deleteScenarioMutation.isPending}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Badge variant={scenario.isActive ? "default" : "secondary"} className="text-xs">
                        {getScenarioTypeLabel(scenario.type)}
                      </Badge>
                      {scenario.type === 'lump_sum' && scenario.lumpSumAmount && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(scenario.lumpSumAmount)} on {scenario.lumpSumDate}
                        </p>
                      )}
                      {scenario.type === 'extra_monthly' && scenario.extraMonthlyAmount && (
                        <p className="text-sm text-gray-600 mt-1">
                          +{formatCurrency(scenario.extraMonthlyAmount)} monthly
                        </p>
                      )}
                      {scenario.type === 'monthly_increase' && scenario.monthlyIncreaseAmount && (
                        <p className="text-sm text-gray-600 mt-1">
                          +{formatCurrency(scenario.monthlyIncreaseAmount)} increase
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis and Charts */}
          <div className="lg:col-span-2 space-y-8">
            {analysis && (
              <>
                {/* Scenario Results Summary */}
                {analysis.scenarioResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Scenario Impact Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.scenarioResults.map((result, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">{result.scenario.name}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Interest Saved</p>
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(result.totalInterestSaved)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Time Saved</p>
                                <p className="font-semibold text-blue-600">
                                  {Math.round(result.monthsSaved / 12)} years {result.monthsSaved % 12} months
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">New Payoff Date</p>
                                <p className="font-semibold">
                                  {new Date(result.newPayoffDate).toLocaleDateString('en-ZA')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {analysis.combinedScenarioResult && (
                          <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                            <h4 className="font-semibold mb-2 text-primary">Combined Scenarios Impact</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Total Interest Saved</p>
                                <p className="font-bold text-green-600 text-lg">
                                  {formatCurrency(analysis.combinedScenarioResult.totalInterestSaved)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total Time Saved</p>
                                <p className="font-bold text-blue-600 text-lg">
                                  {Math.round(analysis.combinedScenarioResult.monthsSaved / 12)} years {analysis.combinedScenarioResult.monthsSaved % 12} months
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">New Payoff Date</p>
                                <p className="font-bold text-lg">
                                  {new Date(analysis.combinedScenarioResult.newPayoffDate).toLocaleDateString('en-ZA')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Chart */}
                <PropertyAnalysisChart analysis={analysis} />

                {/* Amortization Table */}
                <AmortizationTable analysis={analysis} />
              </>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <AddScenarioDialog 
          property={property}
          open={showAddDialog} 
          onOpenChange={setShowAddDialog} 
        />
        
        {editingScenario && (
          <EditScenarioDialog 
            scenario={editingScenario}
            open={!!editingScenario} 
            onOpenChange={(open) => {
              if (!open) setEditingScenario(null);
            }}
          />
        )}
      </div>
    </div>
  );
}