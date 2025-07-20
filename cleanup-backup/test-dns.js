// Test DNS resolution
import dns from 'dns';

const hostname = 'wisebond-server.postgres.database.azure.com';

console.log(`Attempting to resolve: ${hostname}`);

dns.lookup(hostname, (err, address, family) => {
  if (err) {
    console.error('DNS lookup failed:', err);
  } else {
    console.log(`Address: ${address}`);
    console.log(`Family: IPv${family}`);
  }
});

// Try resolving with promises
dns.promises.resolve4(hostname)
  .then(addresses => {
    console.log('IPv4 addresses:', addresses);
  })
  .catch(err => {
    console.error('IPv4 resolution failed:', err);
  });

// Try resolving some common domains to check DNS generally
dns.promises.resolve4('google.com')
  .then(addresses => {
    console.log('Google.com IPv4 addresses:', addresses);
  })
  .catch(err => {
    console.error('Google.com resolution failed:', err);
  });