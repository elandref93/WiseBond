#!/usr/bin/env node

/**
 * Azure PostgreSQL Connection Diagnostic Tool
 * This script helps diagnose why the Azure PostgreSQL connection is failing
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getPublicIP() {
    try {
        const { stdout } = await execAsync('curl -s https://api.ipify.org');
        return stdout.trim();
    } catch (error) {
        try {
            const { stdout } = await execAsync('curl -s https://icanhazip.com');
            return stdout.trim();
        } catch (fallbackError) {
            return 'Unable to determine';
        }
    }
}

async function testDNSResolution() {
    try {
        const { stdout } = await execAsync('node -e "console.log(require(\'dns\').lookup(\'wisebond-server.postgres.database.azure.com\', (err, address) => { if (err) console.log(\'DNS Error:\', err.message); else console.log(\'Resolved to:\', address); }))"');
        return stdout.trim();
    } catch (error) {
        return `DNS resolution failed: ${error.message}`;
    }
}

async function testBasicConnectivity() {
    try {
        // Test if we can reach the server at all
        const { stdout, stderr } = await execAsync('curl -v --connect-timeout 5 telnet://wisebond-server.postgres.database.azure.com:5432', { timeout: 6000 });
        return { success: true, output: stdout + stderr };
    } catch (error) {
        return { success: false, output: error.message };
    }
}

async function checkAzureRequirements() {
    console.log('\n🔍 AZURE POSTGRESQL CONNECTION DIAGNOSIS');
    console.log('==========================================');
    
    console.log('\n1. Public IP Address:');
    const publicIP = await getPublicIP();
    console.log(`   Replit Public IP: ${publicIP}`);
    
    console.log('\n2. DNS Resolution:');
    console.log('   Testing wisebond-server.postgres.database.azure.com...');
    const dnsResult = await testDNSResolution();
    console.log(`   ${dnsResult}`);
    
    console.log('\n3. Network Connectivity:');
    const connTest = await testBasicConnectivity();
    if (connTest.success) {
        console.log('   ✅ Can reach the server');
    } else {
        console.log('   ❌ Cannot reach the server');
        console.log(`   Error: ${connTest.output}`);
    }
    
    console.log('\n📋 AZURE POSTGRESQL FIREWALL REQUIREMENTS:');
    console.log('==========================================');
    console.log('To fix this connection issue, you need to:');
    console.log('');
    console.log('1. Log into Azure Portal (portal.azure.com)');
    console.log('2. Navigate to your PostgreSQL server: wisebond-server');
    console.log('3. Go to "Connection security" or "Networking" settings');
    console.log('4. Add firewall rules for Replit:');
    console.log(`   - Rule Name: "Replit-Access"`);
    console.log(`   - Start IP: ${publicIP}`);
    console.log(`   - End IP: ${publicIP}`);
    console.log('');
    console.log('5. Alternative: Enable "Allow access to Azure services" if available');
    console.log('6. Ensure "Enforce SSL connection" is enabled');
    console.log('7. Save the firewall configuration');
    console.log('');
    console.log('🔄 After configuring the firewall, restart the application to test the connection.');
    
    // Additional diagnostic information
    console.log('\n🔧 TECHNICAL DETAILS:');
    console.log('=====================');
    console.log('Current connection settings:');
    console.log('- Host: wisebond-server.postgres.database.azure.com');
    console.log('- Port: 5432');
    console.log('- Database: postgres');
    console.log('- User: elandre');
    console.log('- SSL: Required');
    console.log('');
    console.log('Error pattern: Connection timeout (ETIMEDOUT)');
    console.log('Root cause: Azure PostgreSQL firewall blocking external connections');
    console.log('Solution: Add Replit IP to Azure PostgreSQL firewall rules');
}

// Run the diagnostic
checkAzureRequirements().catch(console.error);