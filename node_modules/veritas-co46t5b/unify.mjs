import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// --- CONFIGURATION ---
const OLD_PKG_NAME = 'veritas-q35-unified';
const NEW_PKG_NAME = 'veritas-co46t5B';
const OLD_REPO_PATH = 'jyvplay/q35';
const NEW_REPO_PATH = 'jyvplay/co46t5B';
const OLD_REPO_URL = `https://github.com/${OLD_REPO_PATH}`;
const NEW_REPO_URL = `https://github.com/${NEW_REPO_PATH}`;
// ---------------------

console.log(`🚀 Starting Hardened Unified Migration Script for ${NEW_PKG_NAME}...`);

const npmPkgPath = path.resolve('node_modules', OLD_PKG_NAME, 'package.json');
if (!fs.existsSync(npmPkgPath)) {
    console.log("📦 Base package not found. Installing...");
    execSync(`npm install ${OLD_PKG_NAME} --no-save`, { stdio: 'inherit' });
}

console.log("2. Merging package.json dependencies...");
const localPkgPath = path.resolve('package.json');
const localPkg = JSON.parse(fs.readFileSync(localPkgPath, 'utf-8'));
const npmPkg = JSON.parse(fs.readFileSync(npmPkgPath, 'utf-8'));

localPkg.dependencies = { ...npmPkg.dependencies, ...localPkg.dependencies };
delete localPkg.dependencies[OLD_PKG_NAME];
localPkg.name = NEW_PKG_NAME;
localPkg.version = "1.0.0";

if (localPkg.repository) {
    if (typeof localPkg.repository === 'string') localPkg.repository = NEW_REPO_URL;
    else localPkg.repository.url = `git+${NEW_REPO_URL}.git`;
}
if (localPkg.bugs) localPkg.bugs.url = `${NEW_REPO_URL}/issues`;
if (localPkg.homepage) localPkg.homepage = `${NEW_REPO_URL}#readme`;

fs.writeFileSync(localPkgPath, JSON.stringify(localPkg, null, 2));

console.log("3. Fusing src directories...");
if (fs.existsSync('src_advanced')) fs.rmSync('src_advanced', { recursive: true, force: true });
fs.renameSync('src', 'src_advanced');
fs.cpSync(path.join('node_modules', OLD_PKG_NAME, 'src'), 'src', { recursive: true });

console.log("4. Resolving App.tsx collision (Dropping Wrapper)...");
// The local App.tsx is just a wrapper for the sidecar. We delete it so the real App.tsx from the package takes over natively.
if (fs.existsSync(path.join('src_advanced', 'App.tsx'))) {
    fs.rmSync(path.join('src_advanced', 'App.tsx'));
}

console.log("5. Merging Advanced Overlay & Resolving Base Overrides...");
const stubsToDrop = ['compute-sandbox.ts', 'constraints.ts', 'models.ts', 'rpm-governor.ts'];

function copyAdvanced(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.relative('src_advanced', fullPath);
        const targetPath = path.join('src', relPath);

        if (fs.statSync(fullPath).isDirectory()) {
            if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
            copyAdvanced(fullPath);
        } else {
            const normalizedRelPath = relPath.split(path.sep).join('/');
            if (normalizedRelPath.startsWith('lib/') && stubsToDrop.includes(file)) continue;

            // CRITICAL FIX: Check if this local file is an extending override of a base package file
            let content = fs.readFileSync(fullPath, 'utf-8');
            const selfImportPath = `${OLD_PKG_NAME}/src/${normalizedRelPath.replace(/\.tsx?$/, '')}`;

            if (content.includes(selfImportPath)) {
                // 1. Rename the original package file to *.base.ts so it isn't destroyed
                const ext = path.extname(targetPath);
                const basePath = targetPath.replace(new RegExp(`\\${ext}$`), `.base${ext}`);
                if (fs.existsSync(targetPath)) {
                    fs.renameSync(targetPath, basePath);
                }
                // 2. Update the local file's import to point to the preserved .base file
                const baseModuleName = `./${path.basename(basePath).replace(new RegExp(`\\${ext}$`), '')}`;
                content = content.replaceAll(selfImportPath, baseModuleName);
                fs.writeFileSync(fullPath, content, 'utf-8');
            }

            fs.copyFileSync(fullPath, targetPath);
        }
    }
}
copyAdvanced('src_advanced');
fs.rmSync('src_advanced', { recursive: true, force: true });

console.log("6. Scorched Earth Cleanup of Sidecar Artifacts (Tailwind, Vite, TSConfig, Scripts)...");
const cssPath = path.join('src', 'index.css');
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf-8');
    css = css.replace(new RegExp(`@source\\s+"\\.\\./node_modules/${OLD_PKG_NAME}/src";?\\r?\\n?`, 'g'), '');
    fs.writeFileSync(cssPath, css);
}

// Rewrite vite.config.ts to be completely flat and remove workspaceOverrides
const viteConfigPath = 'vite.config.ts';
if (fs.existsSync(viteConfigPath)) {
    const cleanViteConfig = `import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { nativeScraperPlugin } from "./src/lib/overrides/vite-native-scraper";

export default defineConfig({
  plugins: [nativeScraperPlugin(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") }
    ]
  }
});`;
    fs.writeFileSync(viteConfigPath, cleanViteConfig);
}

// Clean up tsconfig.json ghost paths
const tsconfigPath = 'tsconfig.json';
if (fs.existsSync(tsconfigPath)) {
    try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
        if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
            delete tsconfig.compilerOptions.paths['@/lib/*'];
        }
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    } catch (e) {
        console.log("Note: Could not parse tsconfig.json automatically.");
    }
}

// Remove script.js (already executed/patched) and update build script
if (fs.existsSync('script.js')) {
    fs.rmSync('script.js');
}
if (fs.existsSync(localPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(localPkgPath, 'utf-8'));
    if (pkg.scripts && pkg.scripts.build) {
        pkg.scripts.build = "vite build";
    }
    fs.writeFileSync(localPkgPath, JSON.stringify(pkg, null, 2));
}

console.log("7. Rewriting NPM imports...");
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.html', '.json'];

function patchFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            patchFiles(fullPath);
        } else if (EXTENSIONS.includes(path.extname(fullPath))) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;
            const importRegex = new RegExp(`${OLD_PKG_NAME}/src/`, 'g');
            if (importRegex.test(content)) { content = content.replace(importRegex, '@/'); modified = true; }
            if (content.includes(OLD_PKG_NAME)) { content = content.replaceAll(OLD_PKG_NAME, NEW_PKG_NAME); modified = true; }
            if (content.includes(OLD_REPO_PATH) || content.includes(OLD_REPO_URL)) {
                content = content.replaceAll(OLD_REPO_URL, NEW_REPO_URL);
                content = content.replaceAll(OLD_REPO_PATH, NEW_REPO_PATH);
                modified = true;
            }
            if (modified) fs.writeFileSync(fullPath, content, 'utf-8');
        }
    }
}
patchFiles('src');
patchFiles('public');

['README.md', 'index.html'].forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        let modified = false;
        if (content.includes(OLD_PKG_NAME)) { content = content.replaceAll(OLD_PKG_NAME, NEW_PKG_NAME); modified = true; }
        if (content.includes(OLD_REPO_URL)) { content = content.replaceAll(OLD_REPO_URL, NEW_REPO_URL); modified = true; }
        if (content.includes(OLD_REPO_PATH)) { content = content.replaceAll(OLD_REPO_PATH, NEW_REPO_PATH); modified = true; }
        if (modified) fs.writeFileSync(file, content, 'utf-8');
    }
});

console.log("8. Cleaning up...");
fs.rmSync(path.join('node_modules', OLD_PKG_NAME), { recursive: true, force: true });
if (fs.existsSync('package-lock.json')) fs.rmSync('package-lock.json');
execSync('npm install', { stdio: 'inherit' });

console.log(`✅ Unification complete! Push to ${NEW_REPO_PATH} and publish to NPM as ${NEW_PKG_NAME}.`);