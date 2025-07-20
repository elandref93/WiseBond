// This is a replacement for the updateUser method in storage.ts
async function updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
  try {
    console.log(`Updating user ID ${id} with fields:`, Object.keys(updates).join(', '));
    
    // First modify the database to add co-applicant columns if they don't exist
    try {
      // Check if co-applicant columns exist by trying to select a column
      await pool.query(`SELECT marital_status FROM users LIMIT 1`);
      console.log("Co-applicant columns exist in the database");
    } catch (e) {
      console.log("Co-applicant columns don't exist, adding them to the database");
      
      try {
        // Add co-applicant columns to the users table
        await pool.query(`
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS marital_status TEXT,
          ADD COLUMN IF NOT EXISTS has_co_applicant BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS co_applicant_first_name TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_last_name TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_email TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_phone TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_id_number TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_date_of_birth TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_age INTEGER,
          ADD COLUMN IF NOT EXISTS co_applicant_employment_status TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_employer_name TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_employment_sector TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_job_title TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_employment_duration TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_monthly_income INTEGER,
          ADD COLUMN IF NOT EXISTS same_address BOOLEAN DEFAULT TRUE,
          ADD COLUMN IF NOT EXISTS co_applicant_address TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_city TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_postal_code TEXT,
          ADD COLUMN IF NOT EXISTS co_applicant_province TEXT
        `);
        console.log("Successfully added co-applicant columns to users table");
      } catch (alterError) {
        console.error("Error adding co-applicant columns:", alterError);
        // Continue with the update anyway, we'll just not include co-applicant fields
      }
    }
    
    // Create a single update query that only includes the fields in the database
    const updateFields: Record<string, any> = {};
    
    // Base user fields
    if (updates.username !== undefined) updateFields.username = updates.username;
    if (updates.password !== undefined) updateFields.password = updates.password;
    if (updates.firstName !== undefined) updateFields.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateFields.last_name = updates.lastName;
    if (updates.email !== undefined) updateFields.email = updates.email;
    if (updates.phone !== undefined) updateFields.phone = updates.phone;
    if (updates.idNumber !== undefined) updateFields.id_number = updates.idNumber;
    if (updates.dateOfBirth !== undefined) updateFields.date_of_birth = updates.dateOfBirth;
    if (updates.age !== undefined) updateFields.age = updates.age;
    if (updates.address !== undefined) updateFields.address = updates.address;
    if (updates.city !== undefined) updateFields.city = updates.city;
    if (updates.postalCode !== undefined) updateFields.postal_code = updates.postalCode;
    if (updates.province !== undefined) updateFields.province = updates.province;
    if (updates.employmentStatus !== undefined) updateFields.employment_status = updates.employmentStatus;
    if (updates.employerName !== undefined) updateFields.employer_name = updates.employerName;
    if (updates.employmentSector !== undefined) updateFields.employment_sector = updates.employmentSector;
    if (updates.jobTitle !== undefined) updateFields.job_title = updates.jobTitle;
    if (updates.employmentDuration !== undefined) updateFields.employment_duration = updates.employmentDuration;
    if (updates.monthlyIncome !== undefined) {
      updateFields.monthly_income = updates.monthlyIncome === 0 ? null : updates.monthlyIncome;
    }
    if (updates.otpVerified !== undefined) updateFields.otp_verified = updates.otpVerified;
    if (updates.profileComplete !== undefined) updateFields.profile_complete = updates.profileComplete;
    updateFields.updated_at = new Date();
    
    // Co-applicant fields - we'll try these in a separate query if they exist
    const coApplicantFields: Record<string, any> = {};
    if (updates.maritalStatus !== undefined) coApplicantFields.marital_status = updates.maritalStatus;
    if (updates.hasCoApplicant !== undefined) coApplicantFields.has_co_applicant = updates.hasCoApplicant;
    if (updates.coApplicantFirstName !== undefined) coApplicantFields.co_applicant_first_name = updates.coApplicantFirstName;
    if (updates.coApplicantLastName !== undefined) coApplicantFields.co_applicant_last_name = updates.coApplicantLastName;
    if (updates.coApplicantEmail !== undefined) coApplicantFields.co_applicant_email = updates.coApplicantEmail;
    if (updates.coApplicantPhone !== undefined) coApplicantFields.co_applicant_phone = updates.coApplicantPhone;
    if (updates.coApplicantIdNumber !== undefined) coApplicantFields.co_applicant_id_number = updates.coApplicantIdNumber;
    if (updates.coApplicantDateOfBirth !== undefined) coApplicantFields.co_applicant_date_of_birth = updates.coApplicantDateOfBirth;
    if (updates.coApplicantAge !== undefined) coApplicantFields.co_applicant_age = updates.coApplicantAge;
    if (updates.coApplicantEmploymentStatus !== undefined) coApplicantFields.co_applicant_employment_status = updates.coApplicantEmploymentStatus;
    if (updates.coApplicantEmployerName !== undefined) coApplicantFields.co_applicant_employer_name = updates.coApplicantEmployerName;
    if (updates.coApplicantEmploymentSector !== undefined) coApplicantFields.co_applicant_employment_sector = updates.coApplicantEmploymentSector;
    if (updates.coApplicantJobTitle !== undefined) coApplicantFields.co_applicant_job_title = updates.coApplicantJobTitle;
    if (updates.coApplicantEmploymentDuration !== undefined) coApplicantFields.co_applicant_employment_duration = updates.coApplicantEmploymentDuration;
    if (updates.coApplicantMonthlyIncome !== undefined) {
      coApplicantFields.co_applicant_monthly_income = updates.coApplicantMonthlyIncome === 0 ? null : updates.coApplicantMonthlyIncome;
    }
    if (updates.sameAddress !== undefined) coApplicantFields.same_address = updates.sameAddress;
    if (updates.coApplicantAddress !== undefined) coApplicantFields.co_applicant_address = updates.coApplicantAddress;
    if (updates.coApplicantCity !== undefined) coApplicantFields.co_applicant_city = updates.coApplicantCity;
    if (updates.coApplicantPostalCode !== undefined) coApplicantFields.co_applicant_postal_code = updates.coApplicantPostalCode;
    if (updates.coApplicantProvince !== undefined) coApplicantFields.co_applicant_province = updates.coApplicantProvince;
    
    // Check if we have anything to update
    if (Object.keys(updateFields).length === 0 && Object.keys(coApplicantFields).length === 0) {
      console.log("No fields to update");
      return await this.getUser(id);
    }
    
    // First update the base user fields
    if (Object.keys(updateFields).length > 0) {
      // Create parameters and SQL statements
      const fieldEntries = Object.entries(updateFields);
      const setClause = fieldEntries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
      const values = fieldEntries.map(([_, value]) => value);
      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${setClause} 
        WHERE id = $${values.length}
      `;
      
      console.log("Executing update query for base fields");
      
      try {
        await pool.query(query, values);
        console.log("Base user fields updated successfully");
      } catch (e) {
        console.error("Error updating base fields:", e);
        return undefined;
      }
    }
    
    // Now update co-applicant fields if any
    if (Object.keys(coApplicantFields).length > 0) {
      // Create parameters and SQL statements for co-applicant fields
      const fieldEntries = Object.entries(coApplicantFields);
      const setClause = fieldEntries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
      const values = fieldEntries.map(([_, value]) => value);
      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${setClause} 
        WHERE id = $${values.length}
      `;
      
      console.log("Executing update query for co-applicant fields");
      
      try {
        await pool.query(query, values);
        console.log("Co-applicant fields updated successfully");
      } catch (e) {
        console.error("Error updating co-applicant fields:", e);
        // Continue, we already updated the base fields
      }
    }
    
    // Now retrieve the updated user
    try {
      const query = `
        SELECT 
          id, username, password, first_name as "firstName", last_name as "lastName", 
          email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
          address, city, postal_code as "postalCode", province, 
          employment_status as "employmentStatus", employer_name as "employerName", 
          employment_sector as "employmentSector", job_title as "jobTitle", 
          employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
          otp_verified as "otpVerified", profile_complete as "profileComplete", 
          created_at as "createdAt", updated_at as "updatedAt",
          marital_status as "maritalStatus", has_co_applicant as "hasCoApplicant",
          co_applicant_first_name as "coApplicantFirstName", co_applicant_last_name as "coApplicantLastName",
          co_applicant_email as "coApplicantEmail", co_applicant_phone as "coApplicantPhone",
          co_applicant_id_number as "coApplicantIdNumber", co_applicant_date_of_birth as "coApplicantDateOfBirth",
          co_applicant_age as "coApplicantAge", co_applicant_employment_status as "coApplicantEmploymentStatus",
          co_applicant_employer_name as "coApplicantEmployerName", co_applicant_employment_sector as "coApplicantEmploymentSector",
          co_applicant_job_title as "coApplicantJobTitle", co_applicant_employment_duration as "coApplicantEmploymentDuration",
          co_applicant_monthly_income as "coApplicantMonthlyIncome", same_address as "sameAddress",
          co_applicant_address as "coApplicantAddress", co_applicant_city as "coApplicantCity",
          co_applicant_postal_code as "coApplicantPostalCode", co_applicant_province as "coApplicantProvince"
        FROM users 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        console.log("User not found after update");
        return undefined;
      }
      
      return result.rows[0];
    } catch (e) {
      console.error("Error retrieving updated user:", e);
      
      // Fallback to basic user info retrieval without co-applicant fields
      try {
        const query = `
          SELECT 
            id, username, password, first_name as "firstName", last_name as "lastName", 
            email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
            address, city, postal_code as "postalCode", province, 
            employment_status as "employmentStatus", employer_name as "employerName", 
            employment_sector as "employmentSector", job_title as "jobTitle", 
            employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
            otp_verified as "otpVerified", profile_complete as "profileComplete", 
            created_at as "createdAt", updated_at as "updatedAt"
          FROM users 
          WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
          console.log("User not found after update in fallback");
          return undefined;
        }
        
        // Add co-applicant field defaults
        const user = {
          ...result.rows[0],
          maritalStatus: updates.maritalStatus || null,
          hasCoApplicant: updates.hasCoApplicant || false,
          coApplicantFirstName: updates.coApplicantFirstName || null,
          coApplicantLastName: updates.coApplicantLastName || null,
          coApplicantEmail: updates.coApplicantEmail || null,
          coApplicantPhone: updates.coApplicantPhone || null,
          coApplicantIdNumber: updates.coApplicantIdNumber || null,
          coApplicantDateOfBirth: updates.coApplicantDateOfBirth || null,
          coApplicantAge: updates.coApplicantAge || null,
          coApplicantEmploymentStatus: updates.coApplicantEmploymentStatus || null,
          coApplicantEmployerName: updates.coApplicantEmployerName || null,
          coApplicantEmploymentSector: updates.coApplicantEmploymentSector || null,
          coApplicantJobTitle: updates.coApplicantJobTitle || null,
          coApplicantEmploymentDuration: updates.coApplicantEmploymentDuration || null,
          coApplicantMonthlyIncome: updates.coApplicantMonthlyIncome || null,
          sameAddress: updates.sameAddress !== undefined ? updates.sameAddress : true,
          coApplicantAddress: updates.coApplicantAddress || null,
          coApplicantCity: updates.coApplicantCity || null,
          coApplicantPostalCode: updates.coApplicantPostalCode || null,
          coApplicantProvince: updates.coApplicantProvince || null
        };
        
        return user;
      } catch (fallbackError) {
        console.error("Error in fallback user retrieval:", fallbackError);
        return undefined;
      }
    }
  } catch (error) {
    console.error("Database error in updateUser:", error);
    return undefined;
  }
}