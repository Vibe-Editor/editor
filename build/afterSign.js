const { execSync } = require('child_process');
const path = require('path');

exports.default = async function(context) {
    const { electronPlatformName, appOutDir } = context;
    
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = path.join(appOutDir, `${appName}.app`);
    
    console.log(`🧹 Cleaning extended attributes for: ${appPath}`);
    
    try {
        // Remove all extended attributes that can interfere with signing
        execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' });
        console.log('✅ Extended attributes cleaned');
    } catch (error) {
        console.warn('⚠️  Warning: Could not clean extended attributes:', error.message);
    }
};
