// Manually create a fixed mapping function for one of the problematic sections

/**
 * Helper function to map database column names to JavaScript property names
 * for User objects returned from the database
 */
function mapUserDataFromDB(userData) {
  return {
    ...userData,
    // Convert snake_case database column names to camelCase JavaScript properties
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
  };
}