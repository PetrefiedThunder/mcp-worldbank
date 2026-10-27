# mcp-worldbank

Query World Bank development indicators (GDP, population, etc.) for 200+ countries.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `get_indicator` | Get indicator data for a country (GDP, population, etc.). |
| `search_indicators` | Search for World Bank indicators. |
| `get_country_info` | Get country metadata. |
| `compare_countries` | Compare an indicator across multiple countries. |
| `list_topics` | List World Bank data topics. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-worldbank.git
cd mcp-worldbank
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "worldbank": {
      "command": "node",
      "args": ["/path/to/mcp-worldbank/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-worldbank
```

## License

Apache-2.0
