// This script creates a fixed version of storage.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original file
const storageFilePath = path.join(__dirname, 'server', 'storage.ts'); 
const content = fs.readFileSync(storageFilePath, 'utf8');

// Define the problematic sections and their replacements
const replacements = [
  {
    // First occurrence (in createUser)
    search: `      const userData = userResult.rows[0];
      
      // Convert to User type with null values for co-applicant fields
      const user = {
        ...userData,
        // Add null values for co-applicant fields
        maritalStatus: null,
        hasCoApplicant: false,
        coApplicantFirstName: null,
        coApplicantLastName: null,
        coApplicantEmail: null,
        coApplicantPhone: null,
        coApplicantIdNumber: null,
        coApplicantDateOfBirth: null,
        coApplicantAge: null,
        coApplicantEmploymentStatus: null,
        coApplicantEmployerName: null,
        coApplicantEmploymentSector: null,
        coApplicantJobTitle: null,
        coApplicantEmploymentDuration: null,
        coApplicantMonthlyIncome: null,
        sameAddress: true,
        coApplicantAddress: null,
        coApplicantCity: null,
        coApplicantPostalCode: null,
        coApplicantProvince: null,
      };`,
    replace: `      const userData = userResult.rows[0];
      
      // Map database field names to JavaScript property names for consistency
      const user = {
        ...userData,
        // Convert snake_case database names to camelCase for JavaScript
        maritalStatus: userData.marital_status,
        hasCoApplicant: userData.has_co_applicant,
        coApplicantFirstName: userData.co_applicant_first_name,
        coApplicantLastName: userData.co_applicant_last_name,
        coApplicantEmail: userData.co_applicant_email,
        coApplicantPhone: userData.co_applicant_phone,
        coApplicantIdNumber: userData.co_applicant_id_number,
        coApplicantDateOfBirth: userData.co_applicant_date_of_birth,
        coApplicantAge: userData.co_applicant_age,
        coApplicantEmploymentStatus: userData.co_applicant_employment_status,
        coApplicantEmployerName: userData.co_applicant_employer_name,
        coApplicantEmploymentSector: userData.co_applicant_employment_sector,
        coApplicantJobTitle: userData.co_applicant_job_title,
        coApplicantEmploymentDuration: userData.co_applicant_employment_duration,
        coApplicantMonthlyIncome: userData.co_applicant_monthly_income,
        sameAddress: userData.same_address,
        coApplicantAddress: userData.co_applicant_address,
        coApplicantCity: userData.co_applicant_city,
        coApplicantPostalCode: userData.co_applicant_postal_code,
        coApplicantProvince: userData.co_applicant_province,
      };`
  },
  {
    // Second occurrence (in getUserByEmail)
    search: `      const userData = userResult.rows[0];
      
      // Convert to User type with null values for co-applicant fields
      const user = {
        ...userData,
        // Add null values for co-applicant fields
        maritalStatus: null,
        hasCoApplicant: false,
        coApplicantFirstName: null,
        coApplicantLastName: null,
        coApplicantEmail: null,
        coApplicantPhone: null,
        coApplicantIdNumber: null,
        coApplicantDateOfBirth: null,
        coApplicantAge: null,
        coApplicantEmploymentStatus: null,
        coApplicantEmployerName: null,
        coApplicantEmploymentSector: null,
        coApplicantJobTitle: null,
        coApplicantEmploymentDuration: null,
        coApplicantMonthlyIncome: null,
        sameAddress: true,
        coApplicantAddress: null,
        coApplicantCity: null,
        coApplicantPostalCode: null,
        coApplicantProvince: null,
      };`,
    replace: `      const userData = userResult.rows[0];
      
      // Map database field names to JavaScript property names for consistency
      const user = {
        ...userData,
        // Convert snake_case database names to camelCase for JavaScript
        maritalStatus: userData.marital_status,
        hasCoApplicant: userData.has_co_applicant,
        coApplicantFirstName: userData.co_applicant_first_name,
        coApplicantLastName: userData.co_applicant_last_name,
        coApplicantEmail: userData.co_applicant_email,
        coApplicantPhone: userData.co_applicant_phone,
        coApplicantIdNumber: userData.co_applicant_id_number,
        coApplicantDateOfBirth: userData.co_applicant_date_of_birth,
        coApplicantAge: userData.co_applicant_age,
        coApplicantEmploymentStatus: userData.co_applicant_employment_status,
        coApplicantEmployerName: userData.co_applicant_employer_name,
        coApplicantEmploymentSector: userData.co_applicant_employment_sector,
        coApplicantJobTitle: userData.co_applicant_job_title,
        coApplicantEmploymentDuration: userData.co_applicant_employment_duration,
        coApplicantMonthlyIncome: userData.co_applicant_monthly_income,
        sameAddress: userData.same_address,
        coApplicantAddress: userData.co_applicant_address,
        coApplicantCity: userData.co_applicant_city,
        coApplicantPostalCode: userData.co_applicant_postal_code,
        coApplicantProvince: userData.co_applicant_province,
      };`
  },
];

// Apply all replacements
let updatedContent = content;
let replacementsMade = 0;

for (const { search, replace } of replacements) {
  // Count occurrences of the pattern
  let count = 0;
  let tempContent = updatedContent;
  while (tempContent.includes(search)) {
    count++;
    tempContent = tempContent.replace(search, ''); // Remove to count next occurrence
  }
  
  console.log(`Found ${count} occurrences of pattern ${replacementsMade + 1}`);
  
  if (count === 1) {
    // Only one occurrence, safe to replace
    updatedContent = updatedContent.replace(search, replace);
    replacementsMade++;
    console.log(`Successfully replaced pattern ${replacementsMade}`);
  } else if (count > 1) {
    console.log(`Multiple occurrences found for pattern ${replacementsMade + 1}, cannot safely replace`);
    
    // Try to find unique surrounding context to make the replacement specific
    const lines = updatedContent.split('\n');
    let foundIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      // Look for the start of our pattern
      if (lines[i].includes('// Convert to User type with null values for co-applicant fields')) {
        // Check if this is followed by our pattern
        let match = true;
        const patternLines = search.split('\n');
        
        for (let j = 0; j < patternLines.length && match; j++) {
          if (i + j >= lines.length || !lines[i + j].includes(patternLines[j].trim())) {
            match = false;
          }
        }
        
        if (match) {
          foundIndex = i;
          console.log(`Found match at line ${foundIndex}`);
          
          // Replace this specific occurrence
          const replaceLines = replace.split('\n');
          lines.splice(foundIndex, patternLines.length, ...replaceLines);
          
          replacementsMade++;
          console.log(`Successfully replaced pattern ${replacementsMade} at line ${foundIndex}`);
          break;
        }
      }
    }
    
    if (foundIndex !== -1) {
      updatedContent = lines.join('\n');
    }
  }
}

// Check if replacements were made
if (replacementsMade > 0) {
  // Write the updated file to a new location first
  const newFilePath = path.join(__dirname, 'server-storage-fixed.ts');
  fs.writeFileSync(newFilePath, updatedContent);
  console.log(`Updated content written to ${newFilePath}`);
  
  // Show summary of replacements
  console.log(`Made ${replacementsMade} replacements in total`);
} else {
  console.log('No replacements were made');
}