import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, MinusCircle, Edit, Save, X, AlertCircle } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  BudgetCategory, 
  Expense, 
  insertExpenseSchema 
} from '@shared/schema';
import { formatCurrency, parseCurrency } from '@/lib/formatters';
import { AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ExpenseManagement() {
  const queryClient = useQueryClient();
  const [income, setIncome] = useState<number>(0);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    description: '',
    categoryId: 0,
    isRecurring: true,
    frequency: 'monthly' as 'once' | 'weekly' | 'monthly' | 'yearly',
    customCategory: '',
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch budget categories
  const { 
    data: categories = [], 
    isLoading: loadingCategories,
    error: categoriesError
  } = useQuery<BudgetCategory[]>({
    queryKey: ['/api/budget/categories'],
  });

  // Fetch user expenses
  const { 
    data: expenses = [], 
    isLoading: loadingExpenses,
    error: expensesError
  } = useQuery<Expense[]>({
    queryKey: ['/api/budget/expenses'],
  });

  // Mutations for adding, updating, and deleting expenses
  const addExpenseMutation = useMutation({
    mutationFn: (expense: {
      name: string;
      amount: number;
      description: string;
      categoryId: number;
      isRecurring: boolean;
      frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
    }) => {
      return apiRequest('/api/budget/expenses', {
        method: 'POST',
        body: JSON.stringify(expense),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/expenses'] });
      toast({
        title: "Expense added",
        description: "Your expense has been successfully added.",
      });
      setAddExpenseOpen(false);
      resetNewExpenseForm();
    },
    onError: (error) => {
      toast({
        title: "Error adding expense",
        description: "There was an error adding your expense. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding expense:", error);
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (expense: {
      id: number;
      name: string;
      amount: number;
      description: string;
      categoryId: number;
      isRecurring: boolean;
      frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
    }) => {
      const { id, ...updates } = expense;
      return apiRequest(`/api/budget/expenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/expenses'] });
      toast({
        title: "Expense updated",
        description: "Your expense has been successfully updated.",
      });
      setEditingExpense(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating expense",
        description: "There was an error updating your expense. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating expense:", error);
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/budget/expenses/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget/expenses'] });
      toast({
        title: "Expense deleted",
        description: "Your expense has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting expense",
        description: "There was an error deleting your expense. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting expense:", error);
    }
  });

  // Calculate total expenses and remaining budget
  const totalExpenses = expenses.reduce((total, expense) => {
    return total + expense.amount;
  }, 0);
  
  const remainingBudget = income - totalExpenses;
  const expensePercentage = income > 0 ? (totalExpenses / income) * 100 : 0;

  // Group expenses by category
  const expensesByCategory = expenses.reduce<Record<number, Expense[]>>((acc, expense) => {
    if (!acc[expense.categoryId]) {
      acc[expense.categoryId] = [];
    }
    acc[expense.categoryId].push(expense);
    return acc;
  }, {});

  // Calculate category totals
  const categoryTotals = Object.entries(expensesByCategory).reduce<Record<number, number>>((acc, [categoryId, expenses]) => {
    acc[Number(categoryId)] = expenses.reduce((total, expense) => total + expense.amount, 0);
    return acc;
  }, {});

  // Reset new expense form
  const resetNewExpenseForm = () => {
    setNewExpense({
      name: '',
      amount: '',
      description: '',
      categoryId: 0,
      isRecurring: true,
      frequency: 'monthly',
      customCategory: '',
    });
  };

  // Handle adding a new expense
  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.categoryId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addExpenseMutation.mutate({
      name: newExpense.name,
      amount: parseCurrency(newExpense.amount),
      description: newExpense.description,
      categoryId: newExpense.categoryId,
      isRecurring: newExpense.isRecurring,
      frequency: newExpense.frequency,
    });
  };

  // Handle updating an expense
  const handleUpdateExpense = () => {
    if (!editingExpense) return;

    updateExpenseMutation.mutate({
      id: editingExpense.id,
      name: editingExpense.name,
      amount: editingExpense.amount,
      description: editingExpense.description || '',
      categoryId: editingExpense.categoryId,
      isRecurring: editingExpense.isRecurring ?? true,
      frequency: (editingExpense.frequency ?? 'monthly') as 'once' | 'weekly' | 'monthly' | 'yearly',
    });
  };

  // Handle deleting an expense
  const handleDeleteExpense = (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Filter expenses by category for tabs
  const getFilteredExpenses = () => {
    if (activeTab === 'all') {
      return expenses;
    }
    return expenses.filter(expense => 
      getCategoryName(expense.categoryId).toLowerCase() === activeTab.toLowerCase()
    );
  };

  // Format frequency for display
  const formatFrequency = (frequency: string | null) => {
    if (!frequency) return 'Monthly'; // Default to Monthly if null
    
    switch(frequency) {
      case 'once': return 'One-time';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  // Loading state
  if (loadingCategories || loadingExpenses) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Budget Management</CardTitle>
          <CardDescription>Loading your financial information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (categoriesError || expensesError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Budget Data</CardTitle>
          <CardDescription>There was a problem loading your financial information.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p>Please try refreshing the page or contact support if the problem persists.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Budget Management</CardTitle>
        <CardDescription>
          Track and manage your monthly expenses for your home loan application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Income Input */}
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="income">Monthly Income (R)</Label>
              <Input
                id="income"
                type="text"
                placeholder="0.00"
                value={income ? formatCurrency(income, { symbol: '', decimal: '.', thousand: ',' }) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setIncome(parseCurrency(value));
                }}
                className="max-w-md"
              />
            </div>
          </div>

          {/* Budget Summary */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Income</span>
                  <span className="text-xl font-semibold text-primary">
                    {formatCurrency(income)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Total Expenses</span>
                  <span className="text-xl font-semibold text-red-500">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Disposable Income</span>
                  <span className={`text-xl font-semibold ${remainingBudget >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(remainingBudget)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Budget utilization</span>
                  <span className="text-sm text-gray-500">{expensePercentage.toFixed(0)}%</span>
                </div>
                <Progress value={expensePercentage > 100 ? 100 : expensePercentage} 
                  className={`h-2 ${expensePercentage > 80 ? 'bg-red-100' : 'bg-gray-100'}`} />
                
                {expensePercentage > 80 && (
                  <div className="flex items-start space-x-2 text-red-500 text-sm mt-2">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>
                      Your expenses are {expensePercentage > 100 ? 'exceeding' : 'approaching'} your income level, 
                      which may affect your bond application approval.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Expense Button */}
          <div className="flex justify-end">
            <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Add your monthly expense details below. This information helps in calculating your bond affordability.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newExpense.name}
                      onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                      className="col-span-3"
                      placeholder="e.g., Rent, Electricity"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount (R)
                    </Label>
                    <Input
                      id="amount"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      className="col-span-3"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select 
                      value={newExpense.categoryId.toString()} 
                      onValueChange={(value) => {
                        setNewExpense({...newExpense, categoryId: Number(value)});
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="frequency" className="text-right">
                      Frequency
                    </Label>
                    <Select 
                      value={newExpense.frequency} 
                      onValueChange={(value: 'once' | 'weekly' | 'monthly' | 'yearly') => {
                        setNewExpense({...newExpense, frequency: value});
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">One-time</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      className="col-span-3"
                      placeholder="Optional details about this expense"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddExpense} disabled={addExpenseMutation.isPending}>
                    {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Expense List */}
          <div>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex overflow-auto">
                <TabsTrigger value="all">All Categories</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.name.toLowerCase()}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {activeTab === 'all' ? (
                  <Accordion type="multiple" className="w-full">
                    {categories.map((category) => {
                      const categoryExpenses = expensesByCategory[category.id] || [];
                      const categoryTotal = categoryTotals[category.id] || 0;
                      
                      if (categoryExpenses.length === 0) return null;
                      
                      return (
                        <AccordionItem key={category.id} value={`category-${category.id}`}>
                          <AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-md">
                            <div className="flex flex-1 items-center justify-between">
                              <span>{category.name}</span>
                              <span className="text-red-500 font-medium mr-4">
                                {formatCurrency(categoryTotal)}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ScrollArea className="h-[var(--radix-accordion-content-height)] max-h-96">
                              <div className="space-y-2 p-2">
                                {categoryExpenses.map((expense) => (
                                  <ExpenseItem
                                    key={expense.id}
                                    expense={expense}
                                    onEdit={() => setEditingExpense(expense)}
                                    onDelete={() => handleDeleteExpense(expense.id)}
                                    formatFrequency={formatFrequency}
                                  />
                                ))}
                              </div>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="space-y-2">
                    {getFilteredExpenses().map((expense) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        onEdit={() => setEditingExpense(expense)}
                        onDelete={() => handleDeleteExpense(expense.id)}
                        formatFrequency={formatFrequency}
                      />
                    ))}
                    {getFilteredExpenses().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No expenses in this category. Click "Add Expense" to get started.
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>

      {/* Edit Expense Dialog */}
      {editingExpense && (
        <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>
                Update your expense details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingExpense.name}
                  onChange={(e) => setEditingExpense({...editingExpense, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right">
                  Amount (R)
                </Label>
                <Input
                  id="edit-amount"
                  value={formatCurrency(editingExpense.amount, { symbol: '', decimal: '.', thousand: ',' })}
                  onChange={(e) => {
                    const value = parseCurrency(e.target.value);
                    setEditingExpense({...editingExpense, amount: value});
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select 
                  value={editingExpense.categoryId.toString()} 
                  onValueChange={(value) => {
                    setEditingExpense({...editingExpense, categoryId: Number(value)});
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-frequency" className="text-right">
                  Frequency
                </Label>
                <Select 
                  value={editingExpense.frequency ?? 'monthly'} 
                  onValueChange={(value: 'once' | 'weekly' | 'monthly' | 'yearly') => {
                    setEditingExpense({...editingExpense, frequency: value});
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={editingExpense.description || ''}
                  onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingExpense(null)}>Cancel</Button>
              <Button onClick={handleUpdateExpense} disabled={updateExpenseMutation.isPending}>
                {updateExpenseMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

// Expense Item Component
interface ExpenseItemProps {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  formatFrequency: (frequency: string | null) => string;
}

function ExpenseItem({ expense, onEdit, onDelete, formatFrequency }: ExpenseItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm hover:shadow-md transition-all">
      <div className="flex-1">
        <div className="font-medium">{expense.name}</div>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <span>{formatFrequency(expense.frequency)}</span>
          {expense.description && (
            <>
              <span>•</span>
              <span>{expense.description}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-red-500 font-medium whitespace-nowrap">
          {formatCurrency(expense.amount)}
        </span>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <MinusCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}