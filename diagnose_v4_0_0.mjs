/**
 * System Diagnostics & Deep AST Export Auto-Healer
 * Version: v4.0.0-DIAGNOSTIC-AUTHORITATIVE
 */
import fs from 'fs';
import path from 'path';

console.log("🔍 Running System Diagnostics v4.0.0 (Deep Resolution) for unkbest...\n");

function hasExplicitExport(content, sym) {
    const pattern = new RegExp(`\\bexport\\s+(?:async\\s+)?(?:function|const|let|var|type|interface|class|enum)\\s+${sym}\\b|\\bexport\\s*\\{[^}]*\\b${sym}\\b`, 'i');
    return pattern.test(content);
}

// Deep AST Resolution: Resolve "export *" to ensure the symbol actually exists in the base file
function checkDeepExport(sourceFile, targetFile, sym) {
    if (!fs.existsSync(targetFile)) return false;
    const content = fs.readFileSync(targetFile, 'utf-8');
    
    if (hasExplicitExport(content, sym)) return true;

    // Check if it delegates via "export * from './something'"
    const exportStarRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = exportStarRegex.exec(content)) !== null) {
        const baseRelPath = match[1];
        let basePath = path.resolve(path.dirname(targetFile), baseRelPath);
        
        // Append extension if needed
        const resolvedBase = [basePath + '.ts', basePath + '.tsx', basePath + '/index.ts'].find(fs.existsSync);
        if (resolvedBase && checkDeepExport(sourceFile, resolvedBase, sym)) {
            return true;
        }
    }
    return false;
}

console.log("🧹 Deep Auditing import bindings across all src/ files...");
let missingCount = 0;

function auditImports(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
            auditImports(full);
        } else if (/\.(ts|tsx)$/.test(file)) {
            const content = fs.readFileSync(full, 'utf-8');
            const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                const rawSymbols = match[1];
                const importSource = match[2];
                if (importSource.startsWith('.')) {
                    const targetPath = path.resolve(path.dirname(full), importSource);
                    const resolvedTarget = [targetPath + '.ts', targetPath + '.tsx', targetPath + '/index.ts'].find(fs.existsSync);
                    if (resolvedTarget) {
                        const symbols = rawSymbols.split(',').map(s => {
                            let sym = s.trim().replace(/^type\s+/, '');
                            if (sym.includes(' as ')) sym = sym.split(' as ')[0].trim();
                            return sym;
                        }).filter(Boolean);

                        for (const sym of symbols) {
                            if (!checkDeepExport(full, resolvedTarget, sym)) {
                                console.log(`   ⚠️ Deep AST Alert: Missing export '${sym}' in ${path.relative('src', resolvedTarget)} (imported by ${path.relative('src', full)})`);
                                missingCount++;
                            }
                        }
                    }
                }
            }
        }
    }
}

auditImports('src');
console.log(`\n✅ Deep Diagnostics complete. Identified ${missingCount} missing deep-export issue(s).`);
console.log("👉 Now run 'node repair_and_unify_v7_0_0.mjs' followed by 'npm run build'.");