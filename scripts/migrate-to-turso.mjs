import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://sumar-etiquettes-uzayumutsag.aws-eu-west-1.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const LOCAL_DB = "file:./dev.db";

const local = createClient({ url: LOCAL_DB });
const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// 1. Créer les tables sur Turso depuis le schéma local
console.log("→ Création du schéma sur Turso...");
const schemaDefs = await local.execute(
  "SELECT name, sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY type DESC"
);
for (const row of schemaDefs.rows) {
  if (row.sql) {
    try {
      await turso.execute(String(row.sql));
      console.log(`  ✓ ${row.name}`);
    } catch (e) {
      console.log(`  ~ ${row.name} (déjà existant)`);
    }
  }
}

// 2. Migrer les données
const tables = [
  "Marque",
  "Modele",
  "TypeProduit",
  "FinitionProduit",
  "ClientLogo",
  "EtiquetteAtelier",
  "EtiquetteClient",
];

for (const table of tables) {
  const data = await local.execute(`SELECT * FROM "${table}"`);
  if (data.rows.length === 0) {
    console.log(`→ ${table} : vide, ignoré`);
    continue;
  }
  console.log(`→ ${table} : ${data.rows.length} ligne(s)...`);
  const cols = data.columns.map((c) => `"${c}"`).join(", ");
  const placeholders = data.columns.map(() => "?").join(", ");
  for (const row of data.rows) {
    const values = data.columns.map((c) => row[c] ?? null);
    try {
      await turso.execute({
        sql: `INSERT OR IGNORE INTO "${table}" (${cols}) VALUES (${placeholders})`,
        args: values,
      });
    } catch (e) {
      console.error(`  ✗ Erreur sur ${table}:`, e.message);
    }
  }
  console.log(`  ✓ ${table} migré`);
}

console.log("\n✓ Migration terminée !");
local.close();
turso.close();
