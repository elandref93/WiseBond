[33mcommit 08358fd9f5c6dd1fca2560ef66eade3ae9c64333[m
Author: Elandre Fourie <elandref@eapfs.co.za>
Date:   Fri Aug 1 15:43:35 2025 +0200

    Update email sender logic and remove outdated testing script
    
    - Refined email sender logic in server/email.ts for consistent use of 'noreply@wisebond.co.za'.
    - Removed the test-pdf-email-complete.js file to eliminate outdated testing methods.

[33mcommit 67e98ee2ed909e9a40d29d18b64fc643007c82d1[m
Author: Elandre Fourie <elandref@eapfs.co.za>
Date:   Fri Aug 1 15:36:14 2025 +0200

    Remove comprehensive PDF email testing script and update email sender logic for consistency
    
    - Deleted the test-pdf-email-complete.js file, which contained a comprehensive testing script for PDF generation and email sending.
    - Updated email sender logic in server/email.ts to ensure consistent use of the 'noreply@wisebond.co.za' email address across various email functions.

[33mcommit eedb3248e551116ff5594d8d2b16bee89c41982d[m
Merge: 274b1d9 9fa90eb
Author: Elandre Fourie <elandref@eapfs.co.za>
Date:   Fri Aug 1 15:14:33 2025 +0200

    Merge branch 'main' of https://github.com/elandref93/WiseBond

[33mcommit 274b1d9078fe2f614e2902b12a48095ae6a62936[m
Author: Elandre Fourie <elandref@eapfs.co.za>
Date:   Fri Aug 1 15:14:28 2025 +0200

    Update Mailgun sender email to 'noreply@wisebond.co.za' across multiple configuration files
    
    - Changed MAILGUN_FROM_EMAIL from 'postmaster@wisebond.co.za' to 'noreply@wisebond.co.za' in AZURE-DEPLOYMENT-FIXES-SUMMARY.md, AZURE-DEPLOYMENT-TROUBLESHOOTING.md, LOCAL-DEVELOPMENT-SETUP.md, and MAILGUN-SETUP.md for consistency.
    - Updated setup-local-env.js to reflect the new default sender email.
    - Adjusted email sending logic in server/email.ts to ensure the new sender email is used in all relevant email functions.
