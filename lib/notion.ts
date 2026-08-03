import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_DATABASE_ID!;

const formatClient = (name: string) => name.replace(/_/g, " ").toUpperCase();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ds = (notion as any).dataSources as {
  query: (p: { data_source_id: string; page_size?: number; filter?: unknown }) => Promise<{ results: unknown[] }>;
};

export type CommandeNotion = {
  id: string;
  numeroCommande: string;
  numeroDevis: string;
  client: string;
  notionClients: { id: string; nom: string }[];
  dateCommande: string | null;
  dateReception: string | null;
  dateLivraison: string | null;
  avancement: string;
};

type NotionProp = Record<string, unknown>;

const getText = (prop: unknown): string => {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as NotionProp;
  if (p.type === "title" && Array.isArray(p.title))
    return (p.title as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
  if (p.type === "rich_text" && Array.isArray(p.rich_text))
    return (p.rich_text as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
  return "";
};

const getDate = (prop: unknown): string | null => {
  if (!prop || typeof prop !== "object") return null;
  const p = prop as NotionProp;
  if (p.type === "date" && p.date && typeof p.date === "object")
    return (p.date as Record<string, string>).start ?? null;
  if (p.type === "formula" && p.formula && typeof p.formula === "object") {
    const f = p.formula as Record<string, unknown>;
    if (f.type === "date" && f.date && typeof f.date === "object")
      return (f.date as Record<string, string>).start ?? null;
    if (f.type === "string" && typeof f.string === "string") return f.string || null;
  }
  return null;
};

const getStatus = (prop: unknown): string => {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as NotionProp;
  if (p.type === "status" && p.status && typeof p.status === "object")
    return (p.status as Record<string, string>).name ?? "";
  return "";
};

const getRelationIds = (prop: unknown): string[] => {
  if (!prop || typeof prop !== "object") return [];
  const p = prop as NotionProp;
  if (p.type === "relation" && Array.isArray(p.relation))
    return (p.relation as Array<{ id: string }>).map((r) => r.id);
  return [];
};

async function getPageTitle(pageId: string): Promise<string> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const props = (page as unknown as { properties: Record<string, unknown> }).properties;
    for (const prop of Object.values(props)) {
      const p = prop as Record<string, unknown>;
      if (p.type === "title" && Array.isArray(p.title)) {
        return (p.title as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
      }
    }
  } catch {
    // silently ignore
  }
  return "";
}

export async function getCommandes(): Promise<CommandeNotion[]> {
  const response = await ds.query({
    data_source_id: DATA_SOURCE_ID,
    page_size: 100,
    filter: {
      property: "Avancement",
      status: { does_not_equal: "Livré" },
    },
  });

  const pages = response.results.filter(
    (page): page is { id: string; object: string; properties: Record<string, unknown> } =>
      typeof page === "object" && page !== null && (page as { object: string }).object === "page"
  );

  // Récupère les noms des clients (relations) en parallèle
  const clientIds = pages.flatMap((p) => getRelationIds(p.properties["Client"]));
  const uniqueIds = [...new Set(clientIds)];
  const clientNames: Record<string, string> = {};
  await Promise.all(uniqueIds.map(async (id) => { clientNames[id] = await getPageTitle(id); }));

  return pages.map((page) => {
    const props = page.properties;
    const relIds = getRelationIds(props["Client"]);
    const client = relIds.map((id) => clientNames[id]).filter(Boolean).map(formatClient).join(", ");

    return {
      id: page.id,
      numeroCommande: getText(props["Commande"]),
      numeroDevis: getText(props["N° de devis"]),
      client,
      notionClients: relIds
        .map((id) => ({ id, nom: formatClient(clientNames[id] || "") }))
        .filter((c) => c.nom),
      dateCommande: getDate(props["Date commande"]),
      dateReception: getDate(props["Réception"]),
      dateLivraison: getDate(props["Livraison cible (calc)"]),
      avancement: getStatus(props["Avancement"]),
    };
  });
}
