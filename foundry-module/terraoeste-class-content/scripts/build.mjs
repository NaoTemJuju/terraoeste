import {ClassicLevel} from "classic-level";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await fs.readFile(path.join(root, "module.json"), "utf8"));
const registry = JSON.parse(await fs.readFile(path.join(root, "registry.json"), "utf8"));
const all = [];
for (const pack of manifest.packs) {
  const dir = path.join(root, "src", pack.name);
  const documents = [];
  for (const file of (await fs.readdir(dir)).filter(name => name.endsWith(".json")).sort()) {
    const data = JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
    if (!/^[a-zA-Z0-9]{16}$/.test(data._id)) throw new Error(`ID inválido: ${file}`);
    if (JSON.stringify(data).includes("REPLACEME")) throw new Error(`Parâmetro pendente: ${file}`);
    if (pack.type === "Item" && !["Class", "Talent", "Class Ability", "Weapon", "Armor", "Basic", "Background"].includes(data.type)) throw new Error(`Tipo inválido: ${file}`);
    documents.push(data);
  }
  if (new Set(documents.map(doc => doc._id)).size !== documents.length) throw new Error(`IDs repetidos: ${pack.name}`);
  all.push({pack, documents});
}
const uuids = new Set(all.flatMap(({pack, documents}) => documents.map(doc =>
  `Compendium.${manifest.id}.${pack.name}.${pack.type}.${doc._id}`)));
for (const uuid of [...Object.values(registry.classes), ...Object.values(registry.bonuses),
  ...Object.values(registry.classBonuses ?? {}).flatMap(aliases => Object.values(aliases)),
  ...Object.values(registry.items ?? {}).flatMap(aliases => Object.values(aliases))]) {
  if (!uuids.has(uuid)) throw new Error(`Registro aponta para documento inexistente: ${uuid}`);
}
for (const {documents} of all) {
  for (const document of documents) {
    const refs = JSON.stringify(document).match(/Compendium\.terraoeste-class-content\.[a-z-]+\.(?:Item|RollTable)\.[a-zA-Z0-9]{16}/g) ?? [];
    for (const uuid of refs) if (!uuids.has(uuid)) throw new Error(`Referência interna inválida: ${uuid}`);
  }
}
// Limpeza restrita a artefatos de build dentro deste módulo; nunca usa Data do Foundry.
const packsRoot = path.join(root, "packs");
await fs.mkdir(packsRoot, {recursive: true});
for (const {pack, documents} of all) {
  const target = path.resolve(root, pack.path);
  if (path.dirname(target) !== packsRoot) throw new Error("Destino fora de packs.");
  await fs.rm(target, {recursive: true, force: true});
  const db = new ClassicLevel(target, {keyEncoding: "utf8", valueEncoding: "json"});
  await db.open();
  try {
    const entries = [];
    const collection = pack.type === "Item" ? "items" : "tables";
    for (const document of documents) {
      const data = structuredClone(document);
      const children = collection === "items" ? "effects" : "results";
      const embedded = data[children] ?? [];
      const ids = new Set();
      for (const child of embedded) {
        if (!/^[a-zA-Z0-9]{16}$/.test(child._id) || ids.has(child._id)) throw new Error(`ID filho inválido: ${data.name}`);
        ids.add(child._id);
        entries.push({type: "put", key: `!${collection}.${children}!${data._id}.${child._id}`, value: child});
      }
      data[children] = embedded.map(child => child._id);
      entries.push({type: "put", key: `!${collection}!${data._id}`, value: data});
    }
    await db.batch(entries);
    await db.compactRange("", "\uffff");
    console.log(`${pack.name}: ${documents.length} documentos, ${entries.length} registros.`);
  } finally {
    await db.close();
  }
}
const distRoot = path.join(root, "dist");
const destination = path.join(distRoot, manifest.id);
await fs.mkdir(distRoot, {recursive: true});
if (path.dirname(destination) !== distRoot) throw new Error("Destino fora de dist.");
await fs.rm(destination, {recursive: true, force: true});
await fs.mkdir(destination);
for (const file of ["module.json", "main.mjs", "registry.json", "README.md"]) {
  await fs.copyFile(path.join(root, file), path.join(destination, file));
}
await fs.cp(packsRoot, path.join(destination, "packs"), {recursive: true});
console.log(`Módulo pronto: ${destination}`);
