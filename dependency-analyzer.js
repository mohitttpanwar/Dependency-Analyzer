import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_NODE_MODULES = path.join(__dirname, "node_modules");
const DEFAULT_OUTPUT_FILE = path.join(__dirname, "dependency-analysis.json");

class DependencyAnalyzer {
  constructor(nodeModulesPath = DEFAULT_NODE_MODULES) {
    this.nodeModulesPath = path.resolve(nodeModulesPath);
    this.dependencyGraph = new Map();
    this.packageHashes = new Map();
    this.packagesWithoutLicense = [];
    this.analysisResults = {
      totalPackages: 0,
      packagesWithLicenses: 0,
      packagesWithoutLicenses: 0,
      dependencyGraph: {},
      packageHashes: {},
      missingLicenses: []
    };
  }

  async analyze() {
    console.log(`🔍 Analyzing dependencies in: ${this.nodeModulesPath}`);

    try {
      await fs.access(this.nodeModulesPath);
    } catch {
      throw new Error(`❌ node_modules not found at: ${this.nodeModulesPath}`);
    }

    const topLevelPackages = await this.readTopLevelPackages();
    await this.buildDependencyGraph(topLevelPackages);
    await this.analyzePackages();
    this.generateReport();
    return this.analysisResults;
  }

  async readTopLevelPackages() {
    const entries = await fs.readdir(this.nodeModulesPath, { withFileTypes: true });
    const packages = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const pkgPath = path.join(this.nodeModulesPath, entry.name);
        const pkgJsonPath = path.join(pkgPath, "package.json");

        try {
          const pkgJson = await this.readPackageJson(pkgJsonPath);
          if (pkgJson) {
            packages.push({
              name: pkgJson.name || entry.name,
              version: pkgJson.version || "unknown",
              path: pkgPath,
              packageJson: pkgJson
            });
          }
        } catch {}
      }
    }
    return packages;
  }

  async readPackageJson(packageJsonPath) {
    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async buildDependencyGraph(packages, visited = new Set()) {
    for (const pkg of packages) {
      if (visited.has(pkg.name)) continue;
      visited.add(pkg.name);

      const dependencies = this.extractDependencies(pkg.packageJson);

      this.dependencyGraph.set(pkg.name, {
        version: pkg.version,
        path: pkg.path,
        dependencies,
        packageJson: pkg.packageJson
      });

      if (dependencies.length > 0) {
        const resolvedDeps = await this.resolveDependencies(dependencies);
        await this.buildDependencyGraph(resolvedDeps, visited);
      }
    }
  }

  extractDependencies(pkgJson) {
    const deps = [];
    const depTypes = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies"
    ];
    for (const type of depTypes) {
      if (pkgJson[type]) {
        for (const [name, version] of Object.entries(pkgJson[type])) {
          deps.push({ name, version, type });
        }
      }
    }
    return deps;
  }

  async resolveDependencies(deps) {
    const result = [];

    for (const dep of deps) {
      const depPath = path.join(this.nodeModulesPath, dep.name);
      const pkgJsonPath = path.join(depPath, "package.json");

      try {
        const pkgJson = await this.readPackageJson(pkgJsonPath);
        if (pkgJson) {
          result.push({
            name: pkgJson.name || dep.name,
            version: pkgJson.version || "unknown",
            path: depPath,
            packageJson: pkgJson
          });
        }
      } catch {}
    }
    return result;
  }

  async analyzePackages() {
    for (const [name, info] of this.dependencyGraph) {
      const hash = await this.computePackageHash(info.path);
      this.packageHashes.set(name, hash);

      const hasLicense = await this.checkPackageLicense(info.path, info.packageJson);
      if (!hasLicense) {
        this.packagesWithoutLicense.push({ name, version: info.version });
      }

      this.analysisResults.totalPackages++;
      hasLicense
        ? this.analysisResults.packagesWithLicenses++
        : this.analysisResults.packagesWithoutLicenses++;
    }
  }

  async computePackageHash(pkgPath) {
    const hash = crypto.createHash("sha256");
    const files = await this.getAllFiles(pkgPath);
    const hashes = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file);
        const fileHash = crypto.createHash("sha256").update(content).digest("hex");
        hashes.push(`${path.relative(pkgPath, file)}:${fileHash}`);
      } catch {}
    }

    hashes.sort();
    hash.update(hashes.join("\n"));
    return hash.digest("hex");
  }

  async getAllFiles(dir, files = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") {
        await this.getAllFiles(full, files);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
    return files;
  }

  async checkPackageLicense(pkgPath, pkgJson) {
    if (pkgJson.license || pkgJson.licenses) return true;

    const licenseFiles = [
      "LICENSE", "LICENSE.txt", "LICENSE.md",
      "COPYING", "UNLICENSE"
    ];

    for (const file of licenseFiles) {
      try {
        await fs.access(path.join(pkgPath, file));
        return true;
      } catch {}
    }
    return false;
  }

  generateReport() {
    this.analysisResults.dependencyGraph = Object.fromEntries(this.dependencyGraph);
    this.analysisResults.packageHashes = Object.fromEntries(this.packageHashes);
    this.analysisResults.missingLicenses = this.packagesWithoutLicense;
  }

  async saveResults(output = DEFAULT_OUTPUT_FILE) {
    await fs.writeFile(output, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...this.analysisResults
    }, null, 2));

    console.log(`\n💾 Results saved to: ${output}`);
  }
}


async function main() {
  try {
    const analyzer = new DependencyAnalyzer();
    await analyzer.analyze();
    await analyzer.saveResults();
    console.log("\n🎉 Analysis completed successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();
