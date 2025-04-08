const { exec } = require('child_process');

/**
 * Script to check and notify about Node.js version requirements
 */
function checkNodeVersion() {
  // Get current Node version
  const currentNodeVersion = process.version;
  console.log(`Current Node.js version: ${currentNodeVersion}`);
  
  // Define the required version
  const requiredNodeVersion = 'v16.14.0';
  
  // Extract numeric versions for comparison
  const currentNumeric = currentNodeVersion.substring(1).split('.');
  const requiredNumeric = requiredNodeVersion.substring(1).split('.');
  
  // Compare major version
  if (parseInt(currentNumeric[0]) < parseInt(requiredNumeric[0])) {
    console.warn(`WARNING: Your Node.js version ${currentNodeVersion} is below the required ${requiredNodeVersion}`);
    console.warn('Some features may not work as expected.');
    console.warn('Please consider upgrading Node.js using your package manager or from https://nodejs.org/');
    return;
  }
  
  console.log(`Node.js version ${currentNodeVersion} meets requirements.`);
  
  // Check for npm version
  exec('npm --version', (error, stdout) => {
    if (!error) {
      console.log(`npm version: ${stdout.trim()}`);
    } else {
      console.warn('Could not determine npm version.');
    }
  });
}

// Run the check
checkNodeVersion();
