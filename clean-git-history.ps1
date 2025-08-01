# PowerShell script to completely remove test-pdf-email-complete.js from git history

Write-Host "Cleaning git history to remove API key..." -ForegroundColor Yellow

# Remove the file from all commits
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch test-pdf-email-complete.js" --prune-empty --tag-name-filter cat -- --all

# Force push to overwrite remote history
Write-Host "Force pushing to remove from remote..." -ForegroundColor Yellow
git push origin --force --all

Write-Host "Git history cleaned successfully!" -ForegroundColor Green 