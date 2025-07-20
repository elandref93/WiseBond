#!/usr/bin/env node

/**
 * Comprehensive storage usage diagnostic tool
 * Identifies all places in the codebase using in-memory storage instead of Azure database
 */

import fs from 'fs';
import path from 'path';

// Patterns that indicate in-memory storage usage
const inMemoryPatterns = [
  { pattern: /new Map\(\)/g, description: 'Direct Map instantiation' },
  { pattern: /MemStorage/g, description: 'In-memory storage class usage' },
  { pattern: /MemoryStore/g, description: 'Session memory store' },
  { pattern: /users:\s*Map/g, description: 'Direct users Map declaration' },
  { pattern: /properties:\s*Map/g, description: 'Direct properties Map declaration' },
  { pattern: /calculationResults:\s*Map/g, description: 'Direct calculations Map declaration' },
  { pattern: /loanScenarios:\s*Map/g, description: 'Direct loan scenarios Map declaration' },
  { pattern: /\.get\(/g, description: 'Map get operations' },
  { pattern: /\.set\(/g, description: 'Map set operations' },
  { pattern: /\.delete\(/g, description: 'Map delete operations (potential)' },
  { pattern: /in-memory storage/gi, description: 'Explicit in-memory storage references' },
  { pattern: /fallback.*storage/gi, description: 'Storage fallback references' },
];

// Database patterns that should be used instead
const databasePatterns = [
  { pattern: /DatabaseStorage/g, description: 'Proper database storage usage' },
  { pattern: /getDatabase\(\)/g, description: 'Database connection calls' },
  { pattern: /testDatabaseConnection/g, description: 'Database connection tests' },
  { pattern: /withRetry/g, description: 'Database retry mechanisms' },
  { pattern: /drizzle.*execute/g, description: 'Drizzle ORM queries' },
];

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    const goodPatterns = [];

    // Check for in-memory patterns
    inMemoryPatterns.forEach(({ pattern, description }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        issues.push({
          type: 'in-memory',
          line: lineNumber,
          pattern: description,
          content: lineContent,
          severity: getSeverity(description)
        });
      }
      pattern.lastIndex = 0; // Reset regex
    });

    // Check for database patterns (good usage)
    databasePatterns.forEach(({ pattern, description }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        goodPatterns.push({
          type: 'database',
          line: lineNumber,
          pattern: description,
          content: lineContent
        });
      }
      pattern.lastIndex = 0; // Reset regex
    });

    return { issues, goodPatterns, totalLines: lines.length };
  } catch (error) {
    return { error: error.message };
  }
}

function getSeverity(description) {
  if (description.includes('Map instantiation') || description.includes('MemStorage')) {
    return 'HIGH';
  }
  if (description.includes('Session memory store')) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function scanDirectory(dir, extensions = ['.ts', '.js']) {
  const results = {};
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
          scan(fullPath);
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name);
        if (extensions.includes(ext)) {
          const relativePath = path.relative(process.cwd(), fullPath);
          results[relativePath] = analyzeFile(fullPath);
        }
      }
    }
  }
  
  scan(dir);
  return results;
}

function generateReport() {
  console.log('🔍 STORAGE USAGE DIAGNOSTIC REPORT');
  console.log('=====================================\n');

  const results = scanDirectory('./server');
  let totalIssues = 0;
  let totalFiles = 0;
  let criticalFiles = [];

  Object.entries(results).forEach(([filePath, analysis]) => {
    if (analysis.error) {
      console.log(`❌ Error analyzing ${filePath}: ${analysis.error}\n`);
      return;
    }

    totalFiles++;
    const { issues, goodPatterns } = analysis;
    
    if (issues.length > 0) {
      totalIssues += issues.length;
      console.log(`📁 ${filePath}`);
      console.log(`   Lines: ${analysis.totalLines} | Issues: ${issues.length} | Database Usage: ${goodPatterns.length}`);
      
      // Group issues by severity
      const highSeverity = issues.filter(i => i.severity === 'HIGH');
      const mediumSeverity = issues.filter(i => i.severity === 'MEDIUM');
      const lowSeverity = issues.filter(i => i.severity === 'LOW');

      if (highSeverity.length > 0) {
        criticalFiles.push(filePath);
        console.log(`   🚨 HIGH PRIORITY (${highSeverity.length}):`);
        highSeverity.forEach(issue => {
          console.log(`      Line ${issue.line}: ${issue.pattern}`);
          console.log(`      Code: ${issue.content}`);
        });
      }

      if (mediumSeverity.length > 0) {
        console.log(`   ⚠️  MEDIUM PRIORITY (${mediumSeverity.length}):`);
        mediumSeverity.forEach(issue => {
          console.log(`      Line ${issue.line}: ${issue.pattern}`);
        });
      }

      if (lowSeverity.length > 0) {
        console.log(`   ℹ️  LOW PRIORITY (${lowSeverity.length}):`);
        lowSeverity.forEach(issue => {
          console.log(`      Line ${issue.line}: ${issue.pattern}`);
        });
      }

      console.log('');
    }
  });

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`Total files analyzed: ${totalFiles}`);
  console.log(`Total in-memory usage issues: ${totalIssues}`);
  console.log(`Critical files requiring immediate attention: ${criticalFiles.length}`);
  
  if (criticalFiles.length > 0) {
    console.log('\n🎯 CRITICAL FILES TO FIX:');
    criticalFiles.forEach(file => console.log(`   • ${file}`));
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  console.log('1. Replace MemStorage usage with DatabaseStorage in storage.ts');
  console.log('2. Ensure proper database connection testing in initialization');
  console.log('3. Consider using PostgreSQL-based session store instead of MemoryStore');
  console.log('4. Verify all routes use the storage abstraction layer');
  console.log('5. Test database connection timeout and retry logic');

  // Check specific components
  console.log('\n🔧 COMPONENT-SPECIFIC ANALYSIS');
  console.log('==============================');
  
  // Session storage
  const routesAnalysis = results['server/routes.ts'];
  if (routesAnalysis && routesAnalysis.issues.some(i => i.pattern.includes('Session memory store'))) {
    console.log('• Session Storage: Using in-memory MemoryStore');
    console.log('  Recommendation: Implement PostgreSQL session store for production');
  }

  // Storage initialization
  const storageAnalysis = results['server/storage.ts'];
  if (storageAnalysis && storageAnalysis.issues.some(i => i.pattern.includes('MemStorage'))) {
    console.log('• Storage Layer: Defaulting to MemStorage');
    console.log('  Recommendation: Fix database connection logic to use DatabaseStorage');
  }

  return {
    totalFiles,
    totalIssues,
    criticalFiles,
    results
  };
}

// Run the analysis
generateReport();