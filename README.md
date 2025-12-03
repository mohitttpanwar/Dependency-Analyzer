# Dependency-Analyzer
A comprehensive Node.js tool for analyzing node_modules directories, computing package hashes, building dependency graphs, and detecting missing licenses.

Features
🔍 Package Discovery: Automatically discovers all packages in node_modules
🌳 Dependency Graph: Builds a complete dependency graph with version information
🔐 SHA-256 Hashing: Computes SHA-256 hashes for all package files
📄 License Detection: Identifies packages without license files or license information
📊 Comprehensive Reporting: Generates detailed analysis reports
💾 JSON Export: Saves results to JSON files for further processing
Installation
No additional dependencies required! Uses only Node.js built-in modules:

fs/promises - File system operations
path - Path manipulation
crypto - SHA-256 hash computation
url - URL handling for ES modules
Usage
Command Line Interface
# Analyze current directory's node_modules
node dependency-analyzer.js

# Analyze specific node_modules directory
node dependency-analyzer.js /path/to/node_modules

# Analyze and save to custom output file
node dependency-analyzer.js ./node_modules ./my-analysis.json

Programmatic Usage
import { DependencyAnalyzer } from './dependency-analyzer.js';

const analyzer = new DependencyAnalyzer('./node_modules');
const results = await analyzer.analyze();

// Save results
await analyzer.saveResults('./analysis.json');

// Print dependency graph
analyzer.printDependencyGraph();

node test-dependency-analyzer.js
Output
The analyzer provides:

Console Output: Real-time progress and summary
JSON Report: Detailed analysis saved to file
Dependency Graph: Visual representation of package relationships
Sample Output
🔍 Analyzing dependencies in: ./node_modules
📦 Found 15 top-level packages
🔐 Computing package hashes and checking licenses...

📊 Analysis Complete!
==================================================
Total packages analyzed: 127
Packages with licenses: 125
Packages without licenses: 2

⚠️  Packages without licenses:
  - some-package@1.0.0
  - another-package@2.1.0

🔐 Package hashes computed for all packages
📁 Dependency graph built successfully
JSON Report Structure
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "nodeModulesPath": "/path/to/node_modules",
  "totalPackages": 127,
  "packagesWithLicenses": 125,
  "packagesWithoutLicenses": 2,
  "dependencyGraph": {
    "package-name": {
      "version": "1.0.0",
      "path": "/path/to/package",
      "dependencies": [
        {
          "name": "dependency-name",
          "version": "^2.0.0",
          "type": "dependencies"
        }
      ],
      "packageJson": { /* full package.json object */ }
    }
  },
  "packageHashes": {
    "package-name": "sha256-hash-here"
  },
  "missingLicenses": [
    {
      "name": "package-name",
      "version": "1.0.0",
      "path": "/path/to/package"
    }
  ]
}
License Detection
The analyzer checks for licenses in multiple ways:

package.json fields: license or licenses fields
License files: Common license file names:
LICENSE, LICENSE.txt, LICENSE.md
LICENCE, LICENCE.txt, LICENCE.md
COPYING, COPYING.txt
UNLICENSE, UNLICENSE.txt
Hash Computation
Computes SHA-256 hashes for all files in each package
Excludes node_modules subdirectories to avoid infinite recursion
Sorts file hashes for consistent output across runs
Handles file read errors gracefully
Error Handling
Gracefully handles missing packages
Skips unreadable files during hash computation
Provides warnings for problematic packages
Continues analysis even if individual packages fail
Requirements
Node.js 18.0.0 or higher
ES modules support
Read access to node_modules directory
Use Cases
Security Auditing: Identify packages without licenses
Dependency Analysis: Understand project dependency structure
Package Integrity: Verify package contents with hashes
Compliance: Ensure all dependencies have proper licensing
Documentation: Generate dependency documentation
Example Workflow
Run the analyzer on your project
Review packages without licenses
Check dependency graph for security concerns
Use hashes to verify package integrity
Export results for compliance reporting
