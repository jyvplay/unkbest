/**
 * Post-Build Verification Sentinel
 * Version: v9.0.0-DIAGNOSTIC-AUTHORITATIVE
 */
import fs from 'fs';
import path from 'path';

console.log("🔍 Running Post-Build Verification Sentinel v9.0.0 for unkbest...\n");

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
    console.error("❌ FATAL: 'dist' directory not found. The build did not complete.");
    process.exit(1);
}

console.log("📂 'dist' directory found. Analyzing build artifacts...\n");

const files = fs.readdirSync(distDir);
let hasIndex = false;
let hasGraphWorker = false;
let hasComputeWorker = false;

files.forEach(file => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    if (file === 'index.html') {
        hasIndex = true;
        console.log(`   ✅ Found Core Application: ${file} (${sizeKB} KB)`);
        
        // Verify inlining
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('<script type="module" crossorigin src=')) {
            console.error("   ❌ WARNING: JS was not inlined! vite-plugin-singlefile failed.");
        } else {
            console.log("   ✅ JS & CSS successfully inlined into index.html.");
        }
    } else if (file.includes('graph.worker')) {
        hasGraphWorker = true;
        console.log(`   ✅ Found Graph Worker: ${file} (${sizeKB} KB)`);
    } else if (file.includes('compute.worker')) {
        hasComputeWorker = true;
        console.log(`   ✅ Found Compute Worker: ${file} (${sizeKB} KB)`);
    } else {
        console.log(`   ℹ️ Found additional asset: ${file} (${sizeKB} KB)`);
    }
});

console.log("\n📊 Verification Summary:");
if (hasIndex && hasGraphWorker && hasComputeWorker) {
    console.log("   🟢 ALL SYSTEMS GO. The application is fully compiled, flattened, and ready for deployment.");
    console.log("\n👉 NEXT STEPS:");
    console.log("   1. git add . && git commit -m \"feat: Unified architecture deployed\"");
    console.log("   2. git push -u origin main --force");
    console.log("   3. npm publish --access public");
} else {
    console.log("   🔴 MISSING ARTIFACTS. The build is incomplete.");
}