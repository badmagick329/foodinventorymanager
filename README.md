# Food Inventory Manager & AI Assistant

A smart full-stack app designed to reduce food waste and provide an accessible way to manage home inventory. It features automated receipt parsing and a built-in conversational assistant.

## 🚀 Key Features

- **📦 Inventory Management**: Full CRUD capabilities to manually add, edit, and delete items, with filtering by storage type.
- **🧾 Automated Ingestion**: Parses PDF receipts (Ocado) to automatically populate the database, categorizing items by storage location (Fridge, Freezer, Pantry).
- **💬 Built-in AI Assistant**: Interact with your inventory using natural language from within the app.
  - _"What is expiring soon?"_
  - _"Delete the milk and eggs"_
  - _"Do I have ingredients for pasta?"_
- **✅ Confirmed Inventory Changes**: Review assistant-proposed additions, updates, removals, and batch changes before they are applied.
- **📊 Usage Tracking**: Record consumed, discarded, and corrected inventory, including partial quantity usage.
- **🔌 MCP Server**: Let external agents (e.g. Hermes Agent) read and manage the inventory, history, and shopping list.

## 🛠️ How to Run

1. Clone the repository.
2. Create the necessary `.env` files using the provided `.env.sample` templates.
3. Start the app using Docker:
   ```bash
   docker compose up -d
   ```
4. Access the app at [http://localhost:9004](http://localhost:9004).

## 🔌 MCP Server

The app serves a [Model Context Protocol](https://modelcontextprotocol.io) endpoint at `/api/mcp` (Streamable HTTP, stateless). It is disabled until `MCP_API_TOKEN` is set in `frontend/.env`; clients must send it as `Authorization: Bearer <token>`.

It exposes:

- **Inventory tools**: `list_foods`, `get_food`, `expiry_report`, `add_foods`, `update_food`, `use_food`, `remove_foods`, `move_food`
- **Duplicates**: `list_consolidation_candidates`, `consolidate_foods`, `consolidate_all_matching`
- **History**: `list_history`, `history_summary`, `update_history_entry`, `delete_history_entry`
- **Shopping list**: `list_shopping`, `add_shopping_items`, `remove_shopping_item`, `clear_shopping_list`
- **Receipts**: `parse_receipt` (base64 Ocado PDF → items; nothing is saved until `add_foods`)
- **Resources**: `foodinventory://inventory`, `foodinventory://shopping-list`
- **Prompts**: `use_it_up`, `waste_review`

Changes made through MCP apply immediately (no in-app confirmation) and are recorded in history with the source `mcp`. Destructive tools carry the MCP `destructiveHint` annotation.

### Hermes Agent

Add the token to `~/.hermes/.env`:

```bash
FOODINVENTORY_MCP_TOKEN=<same value as MCP_API_TOKEN>
```

Then add the server to `~/.hermes/config.yaml` and run `/reload-mcp`:

```yaml
mcp_servers:
  foodinventory:
    url: "http://<app-host>:9004/api/mcp"
    headers:
      Authorization: "Bearer ${FOODINVENTORY_MCP_TOKEN}"
```

Hermes exposes the tools as `mcp__foodinventory__<tool>`, e.g. `mcp__foodinventory__list_foods`. To have Hermes ask before every write, add `trust: untrusted`; the read-only tools carry `readOnlyHint` and still run freely. To keep an agent read-only, add `tools: { exclude: ["add_*", "update_*", "use_*", "remove_*", "move_*", "consolidate_*", "delete_*", "clear_*"] }`.
