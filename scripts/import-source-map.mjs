import { mkdir, writeFile } from "node:fs/promises";

const API_URL = "https://ywjyqxjowzaxnqipktfj.supabase.co/rest/v1";
const API_KEY = "sb_publishable_rLlqUor9OeTy_EkqFUBZhQ_rb5ON9aY";
const PAGE_SIZE = 10;

const tables = {
  blocks: "id,data,position_x,position_y,layer",
  transitions:
    "id,from_block_id,to_block_id,from_floor,from_position,to_floor,to_position",
};

async function fetchPage(table, select, offset) {
  const url = new URL(`${API_URL}/${table}`);
  url.searchParams.set("select", select);
  url.searchParams.set("order", "id.asc");
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url, {
    headers: {
      apikey: API_KEY,
      Authorization: "Bearer " + API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${table} at offset ${offset}: ${response.status}`);
  }

  return response.json();
}

async function fetchTable(table, select) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage(table, select, offset);
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

const [blocks, transitions] = await Promise.all(
  Object.entries(tables).map(([table, select]) => fetchTable(table, select)),
);

await mkdir("src/repository", { recursive: true });
await writeFile(
  "src/repository/imported_map.json",
  `${JSON.stringify({ source: "https://mcsamosbor.github.io/map/", blocks, transitions }, null, 2)}\n`,
);

console.log(`Imported ${blocks.length} blocks and ${transitions.length} transitions.`);
