# Azure PostgreSQL Database Integration

This document explains the necessary steps to set up and connect to an Azure PostgreSQL Flexible Server with Private Link integration, used by the WiseBond application.

## Connection Requirements

The Azure PostgreSQL Flexible Server is configured with VNet integration for enhanced security, which means:

1. The database is not directly accessible from the internet
2. The database server uses private endpoints for secure connectivity
3. SSL is required for all connections
4. A valid Azure-issued certificate is required to verify the SSL connection

## Connection Configuration

### Local Development

During local development, the following occurs:

- The application attempts to connect to the Azure PostgreSQL server
- Since the Azure server is using private endpoints, DNS resolution fails as expected
- The application gracefully falls back to using the local PostgreSQL database or in-memory storage
- This allows development and testing without direct access to the production database

### Production Deployment

When deployed to Azure App Service:

1. The application will run within the same Virtual Network as the PostgreSQL server
2. DNS resolution will work correctly within Azure's VNet
3. SSL connections will be established using the provided certificates
4. The application will use the production database with full functionality

## SSL Certificate Configuration

The application includes three certificates to ensure compatibility:

- `DigiCertGlobalRootG2.crt.pem` - Main certificate for Azure PostgreSQL
- `DigiCertGlobalRootCA.crt` - Alternative certificate for compatibility
- `Microsoft RSA Root Certificate Authority 2017.crt` - Microsoft's root certificate

These certificates are loaded at runtime, and the connection uses the available certificates to establish a secure connection.

## Environment Variables

The following environment variables must be set in the Azure App Service configuration:

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Complete connection string for PostgreSQL |
| PGHOST | PostgreSQL server hostname |
| PGPORT | PostgreSQL server port |
| PGUSER | PostgreSQL username |
| PGPASSWORD | PostgreSQL password |
| PGDATABASE | PostgreSQL database name |

## Connection Testing

A test script `test-azure-connection.js` is provided to verify connectivity to the Azure PostgreSQL server. This script:

1. Checks if all required environment variables are set
2. Attempts to connect to the database server
3. Uses the available SSL certificates
4. Provides detailed diagnostics if connection fails

## Troubleshooting

If you encounter connection issues when deployed to Azure:

1. Verify the App Service and PostgreSQL server are in the same Virtual Network
2. Check that the Private Link endpoint for PostgreSQL is configured correctly
3. Verify the firewall rules allow the App Service to connect to PostgreSQL
4. Ensure all environment variables are set correctly in the Azure App Service configuration
5. Check the App Service logs for detailed error messages

## Additional Resources

- [Azure PostgreSQL Flexible Server Documentation](https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [Private Link for Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/concepts-data-access-and-security-private-link)
- [App Service VNet Integration](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet)