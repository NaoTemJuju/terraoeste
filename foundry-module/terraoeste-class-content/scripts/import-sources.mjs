import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const file = process.argv[2];
if (!file) throw new Error("Uso: npm run import-sources -- caminho/terraoeste-content-sources.json");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await fs.readFile(path.join(root, "module.json"), "utf8"));
const sources = JSON.parse(await fs.readFile(path.resolve(file), "utf8"));
// Primeiro valida tudo; depois grava. O backup permanece em dist.
const writes = [];
for (const pack of manifest.packs) {
  if (!Array.isArray(sources[pack.name])) throw new Error(`Compêndio ausente: ${pack.name}`);
  for (const data of sources[pack.name]) {
    const id = data.flags?.[manifest.id]?.contentId;
    if (!/^[a-z0-9-]+$/.test(id || "") || !/^[a-zA-Z0-9]{16}$/.test(data._id)) throw new Error("Documento sem contentId/ID estável.");
    const existing = JSON.parse(await fs.readFile(path.join(root, "src", pack.name, `${id}.json`), "utf8"));
    if (existing._id !== data._id) throw new Error(`ID alterado: ${id}`);
    writes.push({target: path.join(root, "src", pack.name, `${id}.json`), data});
  }
}
const backup = path.join(root, "dist", `source-backup-${Date.now()}`);
await fs.mkdir(backup, {recursive: true});
await fs.cp(path.join(root, "src"), backup, {recursive: true});
for (const {target, data} of writes) await fs.writeFile(target, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`${writes.length} documentos atualizados; backup: ${backup}. Execute npm run build.`);
