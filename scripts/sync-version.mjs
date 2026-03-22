import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const packageJsonPath = path.join(repoRoot, "package.json");
const cargoTomlPath = path.join(repoRoot, "src-tauri", "Cargo.toml");
const tauriConfPath = path.join(repoRoot, "src-tauri", "tauri.conf.json");

const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
const version = pkg.version;

if (!version || typeof version !== "string") {
  throw new Error(`Invalid version in ${packageJsonPath}`);
}

// Update Cargo.toml version (line: version = "x.y.z")
const cargo = await fs.readFile(cargoTomlPath, "utf8");
const cargoVersionRe = /^(version\s*=\s*")[^"]*(")/m;
if (!cargoVersionRe.test(cargo)) {
  throw new Error(`Could not find a version line in ${cargoTomlPath}`);
}

const cargoUpdated = cargo.replace(cargoVersionRe, `$1${version}$2`);

await fs.writeFile(cargoTomlPath, cargoUpdated, "utf8");

// Update tauri.conf.json version
const tauriConf = JSON.parse(await fs.readFile(tauriConfPath, "utf8"));
tauriConf.version = version;
await fs.writeFile(
  tauriConfPath,
  JSON.stringify(tauriConf, null, 2) + "\n",
  "utf8",
);

console.log(`Synced version -> ${version}`);
