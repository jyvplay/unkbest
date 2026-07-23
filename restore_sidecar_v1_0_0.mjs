/**
 * Programmatic Sidecar Reversion Sentinel
 * Version: v1.0.0-RESTORE-SIDECAR-AUTHORITATIVE
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PKG_NAME = 'veritas-co46t5b';
console.log("🚀 Starting Programmatic Sidecar Reversion Sentinel v1.0.0...");

// 1. Re-install the package to populate node_modules/
console.log("📦 Installing veritas-co46t5b...");
try {
    execSync(`npm install ${PKG_NAME} --save`, { stdio: 'inherit' });
} catch (e) {
    console.error("❌ Failed to install package.");
    process.exit(1);
}

// 2. Scan and identify all .base.ts files
console.log("🔧 Reverting local overrides and removing base files...");
const baseRegex = /\.base\.(ts|tsx)$/;

function revertOverrides(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            revertOverrides(fullPath);
        } else if (baseRegex.test(file)) {
            // Found a .base file!
            const ext = path.extname(file);
            const baseName = file.replace(baseRegex, '');
            const overrideFile = path.join(dir, `${baseName}${ext}`);
            
            if (fs.existsSync(overrideFile)) {
                let content = fs.readFileSync(overrideFile, 'utf-8');
                const relPath = path.relative('src', overrideFile).split(path.sep).join('/');
                const pathNoExt = relPath.replace(/\.(tsx?|js|jsx)$/, '');
                
                // Repoint the local import back to the package
                const baseImport = `./${baseName}.base`;
                const pkgImport = `${PKG_NAME}/src/${pathNoExt}`;
                content = content.replaceAll(baseImport, pkgImport);
                fs.writeFileSync(overrideFile, content, 'utf-8');
                console.log(`  ✅ Reverted override import in: ${path.relative('src', overrideFile)}`);
            }
            
            // Delete the .base file
            fs.rmSync(fullPath);
        }
    }
}
revertOverrides('src');

// 3. Clean copied pristine files from package
console.log("🧹 Cleaning copied package files...");
const pkgSrcDir = path.resolve('node_modules', PKG_NAME, 'src');

function cleanCopiedFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.relative(pkgSrcDir, fullPath);
        const targetPath = path.join('src', relPath);

        if (fs.statSync(fullPath).isDirectory()) {
            cleanCopiedFiles(fullPath);
            // Delete empty directories
            if (fs.existsSync(targetPath) && fs.readdirSync(targetPath).length === 0) {
                fs.rmdirSync(targetPath);
            }
        } else {
            // Delete only if it wasn't overridden (i.e. no .base was created)
            const ext = path.extname(targetPath);
            const basePath = targetPath.replace(new RegExp(`\\${ext}$`), `.base${ext}`);
            if (fs.existsSync(targetPath) && !fs.existsSync(basePath)) {
                fs.rmSync(targetPath);
            }
        }
    }
}
cleanCopiedFiles(pkgSrcDir);

// 4. Re-create App.tsx
console.log("📄 Re-creating App.tsx...");
const appTsx = `import BaseApp from "../node_modules/${PKG_NAME}/src/BaseApp";
import { V15Overlay } from "./components/V15Overlay";

export default function App() {
  return (
    <>
      <BaseApp />
      <V15Overlay />
    </>
  );
}
`;
fs.writeFileSync('src/App.tsx', appTsx);

// 5. Re-create index.css
console.log("📄 Re-creating index.css...");
const indexCss = `@import "tailwindcss";

@source "../node_modules/${PKG_NAME}/src";

@layer base {
  html {
    color-scheme: light;
  }
  body {
    @apply bg-zinc-50 text-zinc-900 antialiased;
  }
}

.text-zinc-900 { color: #18181b; }
.text-zinc-800 { color: #27272a; }
.bg-zinc-900 { background-color: #18181b; }
.text-white { color: #ffffff; }

.bg-zinc-900 .text-zinc-800 { color: #ffffff !important; }
.bg-zinc-900 .text-zinc-400 { color: #a1a1aa !important; }

.z-\\[9999\\] .max-h-56 { max-height: 28rem; }
`;
fs.writeFileSync('src/index.css', indexCss);

// 6. Re-create vite.config.ts
console.log("📄 Re-creating vite.config.ts...");
const viteConfig = `import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { nativeScraperPlugin } from "./node_modules/${PKG_NAME}/src/lib/overrides/vite-native-scraper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [nativeScraperPlugin(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
`;
fs.writeFileSync('vite.config.ts', viteConfig);

// 7. Re-create tsconfig.json paths
console.log("📄 Re-creating tsconfig.json paths...");
if (fs.existsSync('tsconfig.json')) {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    if (tsconfig.compilerOptions) {
        tsconfig.compilerOptions.paths = {
            "@/*": ["src/*"],
            "@/lib/*": [`node_modules/${PKG_NAME}/src/lib/*`, "src/lib/*"]
        };
    }
    fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
}

// 8. Reset package.json
console.log("📄 Resetting package.json...");
const localPkgPath = 'package.json';
if (fs.existsSync(localPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(localPkgPath, 'utf-8'));
    pkg.name = "react-vite-tailwind";
    pkg.private = true;
    pkg.dependencies[PKG_NAME] = "^1.0.0";
    fs.writeFileSync(localPkgPath, JSON.stringify(pkg, null, 2));
}

// 9. Sync packages
console.log("🔄 Syncing package lock...");
execSync('npm install', { stdio: 'inherit' });

console.log("\n✅ REVERSION COMPLETE! The workspace has been programmatically restored to the sidecar baseline.");