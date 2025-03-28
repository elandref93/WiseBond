import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BondRepaymentCalculator from "./calculators/BondRepaymentCalculator";
import AffordabilityCalculator from "./calculators/AffordabilityCalculator";
import DepositSavingsCalculator from "./calculators/DepositSavingsCalculator";
import CalculationResults from "./calculators/CalculationResults";
import { CalculationResult } from "@/lib/calculators";

export default function CalculatorSection() {
  const [activeTab, setActiveTab] = useState("bond");
  const [calculationResults, setCalculationResults] = useState<CalculationResult | null>(null);

  const handleCalculationComplete = (results: CalculationResult) => {
    setCalculationResults(results);
  };

  return (
    <div id="calculators" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            Tools
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Financial Calculators
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Plan your home loan journey with our helpful calculators.
          </p>
        </div>

        <div className="mt-10">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <Tabs defaultValue="bond" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="bond">Bond Repayment</TabsTrigger>
                  <TabsTrigger value="affordability">Affordability</TabsTrigger>
                  <TabsTrigger value="deposit">Deposit Savings</TabsTrigger>
                </TabsList>

                <TabsContent value="bond">
                  <BondRepaymentCalculator onCalculate={handleCalculationComplete} />
                </TabsContent>

                <TabsContent value="affordability">
                  <AffordabilityCalculator onCalculate={handleCalculationComplete} />
                </TabsContent>

                <TabsContent value="deposit">
                  <DepositSavingsCalculator onCalculate={handleCalculationComplete} />
                </TabsContent>
              </Tabs>

              {calculationResults && <CalculationResults results={calculationResults} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
