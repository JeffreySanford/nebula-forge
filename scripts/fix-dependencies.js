const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Utility function to update package.json dependencies to fix version incompatibilities
 */
function updatePackageDependencies() {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  
  try {
    // Read the package.json file
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonData);

    console.log('Checking dependencies for updates...');
    
    // Make a backup of the original package.json
    fs.writeFileSync(
      path.resolve(__dirname, '../package.json.backup'),
      packageJsonData,
      'utf8'
    );
    
    // Packages to update (remove and add with specific versions)
    const packagesToRemove = ['@angular/core', '@angular/cli'];
    const packagesToAdd = {
      '@angular/core': '^16.2.0',
      '@angular/cli': '^16.2.0'
    };
    
    // Remove packages
    packagesToRemove.forEach(pkg => {
      if (packageJson.dependencies[pkg]) {
        console.log(`Removing ${pkg}`);
        delete packageJson.dependencies[pkg];
      }
    });
    
    // Add packages with specific versions
    Object.keys(packagesToAdd).forEach(pkg => {
      console.log(`Adding ${pkg}@${packagesToAdd[pkg]}`);
      packageJson.dependencies[pkg] = packagesToAdd[pkg];
    });
    
    // Write the updated package.json
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
    
    console.log('Dependencies updated. Running npm install...');
    
    // Run npm install to update lock file
    exec('npm install', (error) => {
      if (error) {
        console.error(`Error during npm install: ${error}`);
        return;
      }
      console.log('npm install completed successfully');
    });
    
  } catch (error) {
    console.error(`Error updating dependencies: ${error}`);
  }
}

// Execute the function
updatePackageDependencies();
