import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT_DIR = process.argv[2] ?? '.';
const OUTPUT_DIR = process.argv[3] ?? '.';
const VERSION = process.argv[4] ?? '1.0.0';
const ENGINE_VERSION = '3.8.8';
const PACKAGE_URL = process.argv[5] ?? `https://cdn.example.com/hotupdate/${VERSION}/`;

function calculateMd5(filePath) {
  const content = readFileSync(filePath);
  return createHash('md5').update(content).digest('hex');
}

function scanAssets(rootDir) {
  const assets = {};
  const skipDirs = ['node_modules', '.git', 'temp', 'library', 'local', 'profiles'];

  function scan(dir) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relative(rootDir, fullPath).replace(/\\/g, '/');

      if (statSync(fullPath).isDirectory()) {
        if (!skipDirs.includes(entry)) {
          scan(fullPath);
        }
      } else {
        const stat = statSync(fullPath);
        const md5 = calculateMd5(fullPath);
        assets[relPath] = {
          size: stat.size,
          md5: md5,
        };
      }
    }
  }

  scan(rootDir);
  return assets;
}

function generateManifest() {
  console.log(`扫描目录: ${ROOT_DIR}`);
  console.log(`版本号: ${VERSION}`);

  const assets = scanAssets(ROOT_DIR);
  const assetCount = Object.keys(assets).length;
  console.log(`扫描到 ${assetCount} 个文件`);

  const manifest = {
    version: VERSION,
    engineVersion: ENGINE_VERSION,
    minSupportedVersion: VERSION,
    forceUpdate: false,
    packageUrl: PACKAGE_URL,
    remoteManifestUrl: `${PACKAGE_URL}project.manifest`,
    remoteVersionUrl: PACKAGE_URL.replace(/\/$/, '') + '/../version.manifest',
    updateNotes: {
      zh: '',
      en: '',
    },
    searchPaths: [],
    assets: assets,
  };

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifestPath = join(OUTPUT_DIR, 'project.manifest');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`已生成 project.manifest: ${manifestPath}`);

  const versionManifest = {
    version: VERSION,
    engineVersion: ENGINE_VERSION,
    minSupportedVersion: VERSION,
    forceUpdate: false,
    packageUrl: PACKAGE_URL,
    remoteManifestUrl: `${PACKAGE_URL}project.manifest`,
    remoteVersionUrl: PACKAGE_URL.replace(/\/$/, '') + '/../version.manifest',
  };

  const versionPath = join(OUTPUT_DIR, 'version.manifest');
  writeFileSync(versionPath, JSON.stringify(versionManifest, null, 2));
  console.log(`已生成 version.manifest: ${versionPath}`);

  console.log('完成!');
}

generateManifest();
