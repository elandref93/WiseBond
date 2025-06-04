// Define subcategories for each main budget category
// These are specific expense types that fall under each main category

export interface SubcategoryDef {
  id: string;
  name: string;
  description?: string;
}

// Map of category name to its subcategories
export const subcategoriesByCategory: Record<string, SubcategoryDef[]> = {
  "Housing": [
    { id: "housing_rent", name: "Rent", description: "Monthly rental payments" },
    { id: "housing_bond", name: "Bond Repayment", description: "Current home loan repayments" },
    { id: "housing_rates", name: "Rates & Taxes", description: "Municipal property rates and taxes" },
    { id: "housing_levies", name: "Levies", description: "Body corporate or homeowners association fees" },
    { id: "housing_maintenance", name: "Maintenance", description: "Regular home maintenance costs" },
    { id: "housing_security", name: "Security", description: "Home security services and alarm monitoring" },
    { id: "housing_other", name: "Other Housing Expenses", description: "Other housing-related expenses" }
  ],
  
  "Utilities": [
    { id: "utilities_electricity", name: "Electricity", description: "Monthly electricity bill" },
    { id: "utilities_water", name: "Water", description: "Monthly water bill" },
    { id: "utilities_gas", name: "Gas", description: "Gas supply for cooking or heating" },
    { id: "utilities_garbage", name: "Refuse Removal", description: "Garbage collection and waste management" },
    { id: "utilities_other", name: "Other Utilities", description: "Other utility-related expenses" }
  ],
  
  "Insurance": [
    { id: "insurance_medical", name: "Medical Aid", description: "Medical aid or health insurance" },
    { id: "insurance_life", name: "Life Insurance", description: "Life insurance premiums" },
    { id: "insurance_car", name: "Car Insurance", description: "Vehicle insurance premiums" },
    { id: "insurance_house", name: "Household Insurance", description: "Home and contents insurance" },
    { id: "insurance_funeral", name: "Funeral Plan", description: "Funeral policy premiums" },
    { id: "insurance_disability", name: "Disability Cover", description: "Disability insurance premiums" },
    { id: "insurance_other", name: "Other Insurance", description: "Other insurance premiums" }
  ],
  
  "Food & Groceries": [
    { id: "food_groceries", name: "Groceries", description: "Regular grocery shopping" },
    { id: "food_takeout", name: "Takeout", description: "Takeaway food and delivery" },
    { id: "food_restaurants", name: "Restaurants", description: "Dining out expenses" },
    { id: "food_lunch", name: "Work Lunches", description: "Meals during work hours" },
    { id: "food_other", name: "Other Food Expenses", description: "Other food-related expenses" }
  ],
  
  "Transportation": [
    { id: "transport_car_payment", name: "Vehicle Finance", description: "Car loan or finance payments" },
    { id: "transport_fuel", name: "Fuel", description: "Petrol or diesel for vehicles" },
    { id: "transport_maintenance", name: "Maintenance", description: "Vehicle maintenance and repairs" },
    { id: "transport_public", name: "Public Transport", description: "Bus, train, taxi fares" },
    { id: "transport_uber", name: "Uber/Bolt", description: "Ride-sharing services" },
    { id: "transport_license", name: "License & Registration", description: "Vehicle license and registration fees" },
    { id: "transport_other", name: "Other Transport", description: "Other transportation expenses" }
  ],
  
  "Debt Obligations": [
    { id: "debt_credit_cards", name: "Credit Cards", description: "Credit card payments" },
    { id: "debt_loans", name: "Personal Loans", description: "Personal loan repayments" },
    { id: "debt_store", name: "Store Accounts", description: "Retail store account payments" },
    { id: "debt_student", name: "Student Loans", description: "Student loan repayments" },
    { id: "debt_tax", name: "Tax Debt", description: "Tax debt repayments" },
    { id: "debt_other", name: "Other Debt", description: "Other debt obligations" }
  ],
  
  "Communication & Technology": [
    { id: "comms_cell", name: "Cell Phone", description: "Mobile phone contract or prepaid" },
    { id: "comms_landline", name: "Landline", description: "Home telephone service" },
    { id: "comms_internet", name: "Internet", description: "Home internet service" },
    { id: "comms_streaming", name: "Streaming Services", description: "Netflix, Showmax, etc." },
    { id: "comms_dstv", name: "DSTV", description: "Satellite TV subscription" },
    { id: "comms_other", name: "Other Communication", description: "Other communication expenses" }
  ],
  
  "Childcare & Education": [
    { id: "child_school", name: "School Fees", description: "Primary or secondary school fees" },
    { id: "child_university", name: "University Fees", description: "Tertiary education expenses" },
    { id: "child_daycare", name: "Childcare/Daycare", description: "Childcare or daycare expenses" },
    { id: "child_extracurricular", name: "Extracurricular", description: "After-school activities" },
    { id: "child_maintenance", name: "Maintenance", description: "Child maintenance or support payments" },
    { id: "child_other", name: "Other Child Expenses", description: "Other child-related expenses" }
  ],
  
  "Personal & Household": [
    { id: "personal_clothing", name: "Clothing", description: "Clothing and apparel purchases" },
    { id: "personal_toiletries", name: "Toiletries", description: "Personal care items" },
    { id: "personal_hair", name: "Hair & Beauty", description: "Salon and spa services" },
    { id: "personal_gym", name: "Gym Membership", description: "Fitness and gym subscriptions" },
    { id: "personal_domestic", name: "Domestic Help", description: "Domestic worker or gardener" },
    { id: "personal_medical", name: "Medical Expenses", description: "Out-of-pocket medical costs" },
    { id: "personal_other", name: "Other Personal", description: "Other personal expenses" }
  ],
  
  "Entertainment & Leisure": [
    { id: "entertain_events", name: "Events & Concerts", description: "Tickets for shows and events" },
    { id: "entertain_subscriptions", name: "Subscriptions", description: "Magazine or service subscriptions" },
    { id: "entertain_hobbies", name: "Hobbies", description: "Hobby-related expenses" },
    { id: "entertain_travel", name: "Travel", description: "Holiday and travel expenses" },
    { id: "entertain_gifts", name: "Gifts", description: "Gifts for others" },
    { id: "entertain_other", name: "Other Entertainment", description: "Other entertainment expenses" }
  ],
  
  "Savings & Investments": [
    { id: "savings_emergency", name: "Emergency Fund", description: "Emergency savings contributions" },
    { id: "savings_retirement", name: "Retirement", description: "Retirement annuity contributions" },
    { id: "savings_investments", name: "Investments", description: "Investment contributions" },
    { id: "savings_education", name: "Education Saving", description: "Education fund for children" },
    { id: "savings_other", name: "Other Savings", description: "Other savings or investments" }
  ],
  
  "Other Obligations": [
    { id: "other_donations", name: "Donations", description: "Charitable giving" },
    { id: "other_tithes", name: "Tithes", description: "Religious contributions" },
    { id: "other_alimony", name: "Alimony", description: "Alimony or spousal support" },
    { id: "other_sureties", name: "Loan Guarantees", description: "Payments for loan guarantees" },
    { id: "other_misc", name: "Miscellaneous", description: "Other miscellaneous expenses" }
  ]
};

// Helper function to get subcategories for a specific category
export function getSubcategoriesForCategory(categoryName: string): SubcategoryDef[] {
  return subcategoriesByCategory[categoryName] || [];
}

// Helper function to get a subcategory by its ID
export function getSubcategoryById(subcategoryId: string): SubcategoryDef | undefined {
  for (const categoryName in subcategoriesByCategory) {
    const found = subcategoriesByCategory[categoryName].find(sub => sub.id === subcategoryId);
    if (found) return found;
  }
  return undefined;
}