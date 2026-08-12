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

## 🛠️ How to Run

1. Clone the repository.
2. Create the necessary `.env` files using the provided `.env.sample` templates.
3. Start the app using Docker:
   ```bash
   docker compose up -d
   ```
4. Access the app at [http://localhost:9004](http://localhost:9004).
