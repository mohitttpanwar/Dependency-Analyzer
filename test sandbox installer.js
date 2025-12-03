import { SandboxInstaller } from './sandbox-installer.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Test the sandbox installer functionality
 */
async function testSandboxInstaller() {
  console.log('🧪 Testing Sandbox Installer...\n');
  
  const installer = new SandboxInstaller();
  
  // Test 1: Install a simple package
  console.log('Test 1: Installing lodash@4.17.21');
  const result1 = await installer.install('lodash', '4.17.21');
  
  if (result1.success) {
    console.log('✅ Test 1 passed');
    console.log(`Checksum: ${result1.checksum}`);
    
    // Verify files exist
    const packageJsonExists = existsSync(join(installer.sandboxDir, 'package.json'));
    const packageLockExists = existsSync(join(installer.sandboxDir, 'package-lock.json'));
    
    console.log(`package.json exists: ${packageJsonExists}`);
    console.log(`package-lock.json exists: ${packageLockExists}`);
    
    // Verify checksum consistency
    const verification = installer.verifyTreeChecksum(result1.checksum);
    console.log(`Checksum verification: ${verification ? 'PASSED' : 'FAILED'}`);
  } else {
    console.log('❌ Test 1 failed:', result1.error);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Install a different package
  console.log('Test 2: Installing express@4.18.2');
  const result2 = await installer.install('express', '4.18.2');
  
  if (result2.success) {
    console.log('✅ Test 2 passed');
    console.log(`Checksum: ${result2.checksum}`);
    
    // Verify different checksum
    if (result1.success && result1.checksum !== result2.checksum) {
      console.log('✅ Different packages produce different checksums');
    }
  } else {
    console.log('❌ Test 2 failed:', result2.error);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Deterministic installation
  console.log('Test 3: Testing deterministic installation (same package twice)');
  const result3a = await installer.install('axios', '1.6.0');
  
  if (result3a.success) {
    const result3b = await installer.install('axios', '1.6.0');
    
    if (result3b.success) {
      if (result3a.checksum === result3b.checksum) {
        console.log('✅ Deterministic installation verified');
        console.log(`Checksum: ${result3a.checksum}`);
      } else {
        console.log('❌ Non-deterministic installation detected');
        console.log(`Checksum 1: ${result3a.checksum}`);
        console.log(`Checksum 2: ${result3b.checksum}`);
      }
    }
  }
  
  console.log('\n🎉 Testing completed!');
}

// Run tests
testSandboxInstaller().catch(console.error);