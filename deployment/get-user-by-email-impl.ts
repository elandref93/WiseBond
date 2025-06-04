  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log(`Looking up user with email: ${email}`);
      
      // Query the database
      const userResult = await pool.query(`
        SELECT * FROM "users" WHERE email = $1
      `, [email]);
      
      if (userResult.rows.length === 0) {
        return undefined;
      }
      
      const userData = userResult.rows[0];
      
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
      };
      
      return user;
    } catch (error) {
      console.error("Database error in getUserByEmail:", error);
      return undefined;
    }
  }