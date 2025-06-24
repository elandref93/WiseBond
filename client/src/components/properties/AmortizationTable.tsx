import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyAnalysis, formatCurrency, formatDate } from "@/lib/propertyCalculations";

interface AmortizationTableProps {
  analysis: PropertyAnalysis;
}

export default function AmortizationTable({ analysis }: AmortizationTableProps) {
  const [selectedScenario, setSelectedScenario] = useState<number>(-1); // -1 for baseline, 0+ for scenarios, 999 for combined
  const [showFirstPayments, setShowFirstPayments] = useState(12);

  // Get the selected schedule
  const getSelectedSchedule = () => {
    if (selectedScenario === -1) {
      return analysis.baselineSchedule;
    } else if (selectedScenario === 999 && analysis.combinedScenarioResult) {
      return analysis.combinedScenarioResult.amortizationSchedule;
    } else if (selectedScenario >= 0 && selectedScenario < analysis.scenarioResults.length) {
      return analysis.scenarioResults[selectedScenario].amortizationSchedule;
    }
    return analysis.baselineSchedule;
  };

  const selectedSchedule = getSelectedSchedule();
  const displayedPayments = selectedSchedule.slice(0, showFirstPayments);

  const getScenarioName = () => {
    if (selectedScenario === -1) {
      return "Baseline Schedule";
    } else if (selectedScenario === 999 && analysis.combinedScenarioResult) {
      return "Combined Scenarios";
    } else if (selectedScenario >= 0 && selectedScenario < analysis.scenarioResults.length) {
      return analysis.scenarioResults[selectedScenario].scenario.name;
    }
    return "Baseline Schedule";
  };

  const getTotalInterest = () => {
    return selectedSchedule.reduce((sum, payment) => sum + payment.interestPayment, 0);
  };

  const getTotalPaid = () => {
    return selectedSchedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
  };

  const handleLoadMore = () => {
    setShowFirstPayments(prev => Math.min(prev + 12, selectedSchedule.length));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Amortization Schedule</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedScenario === -1 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedScenario(-1)}
            >
              Baseline
            </Button>
            
            {analysis.scenarioResults.map((result, index) => (
              <Button
                key={index}
                variant={selectedScenario === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedScenario(index)}
              >
                {result.scenario.name}
              </Button>
            ))}
            
            {analysis.combinedScenarioResult && (
              <Button
                variant={selectedScenario === 999 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedScenario(999)}
              >
                Combined
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Total Payments</p>
            <p className="font-semibold">{selectedSchedule.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Interest</p>
            <p className="font-semibold text-red-600">{formatCurrency(getTotalInterest())}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Amount Paid</p>
            <p className="font-semibold">{formatCurrency(getTotalPaid())}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Final Payment Date</p>
            <p className="font-semibold">
              {selectedSchedule.length > 0 && formatDate(selectedSchedule[selectedSchedule.length - 1].paymentDate)}
            </p>
          </div>
        </div>

        {/* Current Selection */}
        <div className="mb-4">
          <Badge variant="outline" className="text-sm">
            Viewing: {getScenarioName()}
          </Badge>
        </div>

        {/* Amortization Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Payment</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                {selectedScenario !== -1 && <TableHead className="text-right">Extra</TableHead>}
                {selectedScenario !== -1 && <TableHead className="text-right">Lump Sum</TableHead>}
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedPayments.map((payment, index) => (
                <TableRow key={payment.paymentNumber} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(payment.totalPayment)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payment.principalPayment)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(payment.interestPayment)}
                  </TableCell>
                  {selectedScenario !== -1 && (
                    <TableCell className="text-right text-green-600">
                      {payment.extraPayment ? formatCurrency(payment.extraPayment) : "-"}
                    </TableCell>
                  )}
                  {selectedScenario !== -1 && (
                    <TableCell className="text-right text-blue-600">
                      {payment.lumpSumPayment ? formatCurrency(payment.lumpSumPayment) : "-"}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium">
                    {formatCurrency(payment.remainingBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Load More Button */}
        {showFirstPayments < selectedSchedule.length && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={handleLoadMore}>
              Load Next 12 Payments ({showFirstPayments} of {selectedSchedule.length} shown)
            </Button>
          </div>
        )}

        {/* Table Legend */}
        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p><strong>Payment:</strong> Total monthly payment amount</p>
          <p><strong>Principal:</strong> Amount applied to loan balance</p>
          <p><strong>Interest:</strong> Interest charged for the period</p>
          {selectedScenario !== -1 && (
            <>
              <p><strong>Extra:</strong> Additional monthly payment amount</p>
              <p><strong>Lump Sum:</strong> One-time extra payment amount</p>
            </>
          )}
          <p><strong>Balance:</strong> Remaining loan balance after payment</p>
        </div>
      </CardContent>
    </Card>
  );
}