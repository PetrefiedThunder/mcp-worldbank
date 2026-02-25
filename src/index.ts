#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://api.worldbank.org/v2";
const RATE_LIMIT_MS = 200;
let last = 0;

async function wbFetch(path: string): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}format=json`);
  if (!res.ok) throw new Error(`World Bank ${res.status}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-worldbank", version: "1.0.0" });

server.tool("get_indicator", "Get indicator data for a country (GDP, population, etc.).", {
  country: z.string().describe("ISO country code (e.g. 'US', 'CN', 'BR') or 'all'"),
  indicator: z.string().describe("Indicator code (e.g. 'NY.GDP.MKTP.CD' for GDP, 'SP.POP.TOTL' for population)"),
  dateRange: z.string().default("2015:2024").describe("Year range (e.g. '2015:2024')"),
}, async ({ country, indicator, dateRange }) => {
  const d = await wbFetch(`/country/${country}/indicator/${indicator}?date=${dateRange}&per_page=100`);
  const data = d[1]?.map((r: any) => ({ country: r.country?.value, year: r.date, value: r.value }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d[0]?.total, data }, null, 2) }] };
});

server.tool("search_indicators", "Search for World Bank indicators.", {
  query: z.string(), perPage: z.number().min(1).max(100).default(20),
}, async ({ query, perPage }) => {
  const d = await wbFetch(`/indicator?per_page=${perPage}`);
  const all = d[1] || [];
  const matches = all.filter((i: any) => i.name?.toLowerCase().includes(query.toLowerCase()) || i.id?.toLowerCase().includes(query.toLowerCase()));
  return { content: [{ type: "text" as const, text: JSON.stringify(matches.map((i: any) => ({ id: i.id, name: i.name, source: i.source?.value })), null, 2) }] };
});

server.tool("get_country_info", "Get country metadata.", {
  country: z.string().describe("ISO code or 'all'"),
}, async ({ country }) => {
  const d = await wbFetch(`/country/${country}?per_page=50`);
  const data = d[1]?.map((c: any) => ({
    id: c.id, name: c.name, region: c.region?.value, incomeLevel: c.incomeLevel?.value,
    capitalCity: c.capitalCity, longitude: c.longitude, latitude: c.latitude,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
});

server.tool("compare_countries", "Compare an indicator across multiple countries.", {
  countries: z.string().describe("Semicolon-separated codes (e.g. 'US;CN;IN;BR')"),
  indicator: z.string(),
  year: z.string().default("2023"),
}, async ({ countries, indicator, year }) => {
  const d = await wbFetch(`/country/${countries}/indicator/${indicator}?date=${year}&per_page=100`);
  const data = d[1]?.map((r: any) => ({ country: r.country?.value, code: r.countryiso3code, year: r.date, value: r.value }));
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
});

server.tool("list_topics", "List World Bank data topics.", {}, async () => {
  const d = await wbFetch("/topic?per_page=50");
  const topics = d[1]?.map((t: any) => ({ id: t.id, value: t.value, sourceNote: t.sourceNote?.slice(0, 200) }));
  return { content: [{ type: "text" as const, text: JSON.stringify(topics, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
