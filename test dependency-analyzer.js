import { DependencyAnalyzer } from './dependency-analyzer.js';

async function testAnalyzer() {
  console.log('🧪 Testing Dependency Analyzer\n');
  
  try {
    // Test with current node_modules
    const analyzer = new DependencyAnalyzer('./node_modules');
    
    console.log('1. Running full analysis...');
    const results = await analyzer.analyze();
    
    console.log('\n2. Saving results to file...');
    await analyzer.saveResults('./test-analysis.json');
    
    console.log('\n3. Printing dependency graph...');
    analyzer.printDependencyGraph();
    
    console.log('\n4. Summary:');
    console.log(`   - Total packages: ${results.totalPackages}`);
    console.log(`   - With licenses: ${results.packagesWithLicenses}`);
    console.log(`   - Without licenses: ${results.packagesWithoutLicenses}`);
    console.log(`   - Package hashes computed: ${Object.keys(results.packageHashes).length}`);
    
    if (results.missingLicenses.length > 0) {
      console.log('\n⚠️  Packages missing licenses:');
      results.missingLicenses.forEach(pkg => {
        console.log(`   - ${pkg.name}@${pkg.version}`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAnalyzer();