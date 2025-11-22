# Food Inventory Manager & AI Assistant

A smart full-stack application designed to reduce food waste and provide an accessible way to manage home inventory. It features automated receipt parsing and a conversational AI assistant accessible via Discord.

## 💡 Motivation

I built this project to solve two specific problems in my household:

1.  **Reducing Food Waste**: Keeping better track of expiry dates to ensure food is used before it goes bad.
2.  **Accessibility**: My flatmate is physically unable to open heavy fridge doors or reach into high cabinets to check ingredients. This app provides a digital interface (and a Discord bot) that allows them to query our inventory without physical exertion.

## 🚀 Key Features

- **🧾 Automated Ingestion**: Parses PDF receipts (Ocado) to automatically populate the database, categorizing items by storage location (Fridge, Freezer, Pantry).
- **💬 AI Concierge (Discord Bot)**: Interact with your inventory using natural language.
  - _"What is expiring soon?"_
  - _"Delete the milk and eggs"_
  - _"Do I have ingredients for pasta?"_
- **🧠 Local LLM Integration**: Powered by **Ollama** (running Qwen 2.5) to process natural language queries locally without external API costs.
- **⚡ Event-Driven Architecture**: Decoupled services using **Redis** and **BullMQ** for robust message handling between the Discord interface and the AI Agent.

## 🛠️ Tech Stack

- **Frontend**: TypeScript, Next.js, Tailwind CSS, React Query, Shadcn.
- **Backend & AI Agent**: Bun, Ollama, Discord.js.
- **Database**: PostgreSQL, Prisma ORM.
- **Infrastructure**: Docker, Redis (for queues/caching).

## 🏗️ Architecture Overview

The system consists of three main containerized services:

1.  **Web App (Next.js)**: Provides the visual dashboard and API endpoints for the agent. Handles PDF parsing logic.
2.  **Inventory Agent**: A background worker running on **Bun**. It listens to Discord messages via a Redis queue, routes intents (Expiry vs. Deletion vs. General Query) using an LLM, and executes tools to modify the database.
3.  **Database**: PostgreSQL for persistent storage.
