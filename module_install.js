const moduleToInstall = 'axios';

// Function to check if the module is already installed
function checkModuleInstallation(module) {
  try {
    // Try to check if the module can be imported
    require.resolve(module);
    console.log(`Module '${module}' is already installed.`);
  } catch (err) {
    // If the module cannot be imported, install it
    console.log(`Module '${module}' is not installed. Installing...`);
    installModule(module);
  }
}

// Function to install the module
function installModule(module) {
  // Run shell command to install the module
  const installationProcess = child_process.spawn('npm', ['install', module], { stdio: 'inherit' });

  // Handle events when the installation process is complete
  installationProcess.on('close', (exitCode) => {
    if (exitCode === 0) {
      console.log(`Module '${module}' successfully installed.`);
    } else {
      console.error(`Failed to install module '${module}'.`);
    }
  });
}

// Call the function to check and install the module
checkModuleInstallation(moduleToInstall);
