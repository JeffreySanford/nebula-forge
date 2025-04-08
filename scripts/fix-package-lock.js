const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Utility function to fix package-lock.json issues
 */
function fixPackageLock() {
  const packageLockPath = path.resolve(__dirname, '../package-lock.json');
  
  try {
    // Check if package-lock.json exists
    if (!fs.existsSync(packageLockPath)) {
      console.log('No package-lock.json found. Nothing to fix.');
      return;
    }
    
    console.log('Making backup of package-lock.json...');
    
    // Create backup
    fs.copyFileSync(
      packageLockPath,
      path.resolve(__dirname, '../package-lock.json.backup')
    );
    
    console.log('Running npm install to regenerate package-lock.json...');
    
    // Run npm install to regenerate package-lock
    exec('npm install --package-lock-only', (error, stdout) => {
      if (error) {
        console.error(`Error regenerating package-lock.json: ${error}`);
        return;
      }
      
      console.log('Successfully regenerated package-lock.json');
      
      // Validate the new package-lock.json
      try {
        const newPackageLock = fs.readFileSync(packageLockPath, 'utf8');
        JSON.parse(newPackageLock);
        console.log('Verified package-lock.json is valid JSON.');
      } catch (error) {
        console.error(`Generated package-lock.json is invalid: ${error.message}`);
      }
    });
    
  } catch (error) {
    console.error(`Error fixing package-lock.json: ${error}`);
  }
}

// Execute the function
fixPackageLock();
