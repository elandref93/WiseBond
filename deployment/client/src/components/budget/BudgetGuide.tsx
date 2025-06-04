import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Lightbulb, BadgeInfo, ShieldCheck, Home, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function BudgetGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            South African Home Loan Budget Guide
          </CardTitle>
          <CardDescription>
            Important guidelines for preparing your financial information for a home loan application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50">
            <BadgeInfo className="h-4 w-4" />
            <AlertTitle>Why your budget matters</AlertTitle>
            <AlertDescription>
              South African banks typically require detailed financial information to assess your ability to repay a home loan. 
              A well-documented budget demonstrates financial responsibility and increases your chances of approval.
            </AlertDescription>
          </Alert>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Key Budget Categories for Home Loan Applications</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 py-2">
                  <div>
                    <h4 className="font-medium">Housing-Related Costs</h4>
                    <p className="text-sm text-gray-600">
                      Include current rental/bond payments, rates and taxes, levies, utilities, and maintenance costs.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Transport Expenses</h4>
                    <p className="text-sm text-gray-600">
                      Vehicle finance, insurance, fuel, maintenance, and public transport costs.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Debt Obligations</h4>
                    <p className="text-sm text-gray-600">
                      Credit cards, personal loans, student loans, store accounts, and any other financing agreements.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Insurance and Medical</h4>
                    <p className="text-sm text-gray-600">
                      Medical aid, life insurance, short-term insurance policies, and other coverage costs.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Living Expenses</h4>
                    <p className="text-sm text-gray-600">
                      Food, groceries, clothing, childcare, education, entertainment, and other regular expenses.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>The 50/30/20 Rule for South African Budgeting</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 py-2">
                  <p className="text-sm text-gray-600">
                    The 50/30/20 rule is a helpful guideline for managing your finances:
                  </p>
                  
                  <div>
                    <h4 className="font-medium">50% - Needs</h4>
                    <p className="text-sm text-gray-600">
                      Allocate 50% of your income to essentials like housing, utilities, groceries, and transport.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">30% - Wants</h4>
                    <p className="text-sm text-gray-600">
                      Limit 30% of your income for lifestyle choices like dining out, entertainment, and non-essential subscriptions.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">20% - Savings & Debt Repayment</h4>
                    <p className="text-sm text-gray-600">
                      Reserve at least 20% for savings, investments, and accelerated debt repayment.
                    </p>
                  </div>
                  
                  <Alert className="mt-2">
                    <ShieldCheck className="h-4 w-4" />
                    <AlertDescription>
                      Banks look favorably on applications where housing costs (including the new bond payment) 
                      don't exceed 30% of your gross monthly income.
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Improving Your Budget for Better Bond Approval</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 py-2">
                  <div className="flex gap-2 items-start">
                    <div className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Reduce Non-Essential Expenses</h4>
                      <p className="text-sm text-gray-600">
                        Minimize discretionary spending like entertainment, subscriptions and dining out for at least 3-6 months before applying.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <div className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Pay Down Existing Debt</h4>
                      <p className="text-sm text-gray-600">
                        Reduce credit card balances, personal loans, and other debt obligations to improve your debt-to-income ratio.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <div className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Build an Emergency Fund</h4>
                      <p className="text-sm text-gray-600">
                        Having 3-6 months of expenses saved demonstrates financial stability to lenders.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <div className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Be Honest and Accurate</h4>
                      <p className="text-sm text-gray-600">
                        Banks verify information and may request bank statements. Accurate declarations build credibility.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <div className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                      5
                    </div>
                    <div>
                      <h4 className="font-medium">Maintain Stable Income</h4>
                      <p className="text-sm text-gray-600">
                        Avoid changing jobs during the application process, as lenders prefer stable employment history.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Check Affordability
          </Button>
          <Button className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Start Bond Application
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}