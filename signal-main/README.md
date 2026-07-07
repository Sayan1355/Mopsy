# Signal-Main 🚀

> **Hackathon Project** — A real-time signals harvesting and lead intelligence engine.

---

## 📌 Project Name

**Signal-Main** — Signals Harvesting Engine

---

## 📖 Overview

Signal-Main is an end-to-end pipeline that continuously harvests intent signals from the
open web (job postings, press releases, social content, funding announcements), classifies
them with AI, scores the resulting leads by priority, and surfaces actionable intelligence
to sales and growth teams through a live dashboard.

It combines a headless browser-based collection layer, an AI-powered intent classification
agent, a rule-and-ML scoring engine, and an automation layer that can trigger outreach
workflows automatically — all presented through a modern real-time dashboard.

---

## 🔍 Problem Statement

Sales and growth teams waste enormous time manually monitoring competitor moves, funding
news, and hiring signals across dozens of sources. By the time a signal is noticed and acted
on, the window has closed. There is no unified, automated system that:

- Continuously collects signals from multiple sources
- Understands the *intent* behind each signal (hiring? fundraising? expansion?)
- Prioritises leads by recency, relevance, and company fit
- Triggers the right outreach at the right moment

Signal-Main solves this by automating the full pipeline from raw signal to prioritised,
actionable lead.

---

## 🎯 Goals

- [ ] Harvest signals from ≥3 sources (web scraping, LinkedIn, news feeds)
- [ ] Classify each signal's intent using AI (OpenAI + regex fallback)
- [ ] Score and rank leads using a multi-factor model
- [ ] Expose a clean REST API for signal ingestion and lead retrieval
- [ ] Display live lead queue and analytics in a real-time dashboard
- [ ] Trigger stub automation actions (email draft, CRM log) per lead
- [ ] Deploy as a single-command runnable stack

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Signal-Main Pipeline                       │
│                                                                     │
│   ┌───────────┐    ┌───────────┐    ┌───────────────┐              │
│   │ Collection │───▶│  Intent   │───▶│ Prioritization│              │
│   │   Agent   │    │   Agent   │    │    Agent      │              │
│   │(scraper + │    │(OpenAI +  │    │ (scoring model│              │
│   │  ingestion│    │  regex)   │    │  + filters)   │              │
│   └───────────┘    └───────────┘    └──────┬────────┘              │
│                                            │                        │
│                                     ┌──────▼────────┐              │
│                                     │  Automation   │              │
│                                     │    Agent      │              │
│                                     │ (action log,  │              │
│                                     │  outreach stub│              │
│                                     └──────┬────────┘              │
│                                            │                        │
│                                     ┌──────▼────────┐              │
│                                     │   Dashboard   │              │
│                                     │ (Next.js SPA, │              │
│                                     │  real-time    │              │
│                                     │  lead queue)  │              │
│                                     └───────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
signal-main/
├── backend/               # FastAPI backend — REST API, agents, DB models
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── db.py
│   │   ├── routers/
│   │   └── services/
│   └── requirements.txt
│
├── frontend/              # Next.js dashboard — real-time lead intelligence UI
│   ├── app/
│   ├── components/
│   └── package.json
│
├── docs/                  # Architecture diagrams, API docs, design notes
│
├── sample_signals/        # Sample JSON payloads for testing ingestion
│
├── README.md              # This file
└── .gitignore
```

---

## 🛠️ Tech Stack (Planned)

| Layer | Technology |
|---|---|
| **Backend API** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic |
| **Database** | PostgreSQL 16 |
| **AI / NLP** | OpenAI GPT-4o (intent classification), regex fallback |
| **Web Collection** | Playwright (headless browser scraping) |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Real-time** | Server-Sent Events (SSE) or WebSocket |
| **Infra** | Docker Compose (optional), nvm for Node, venv for Python |
| **Testing** | pytest (backend), Vitest (frontend) |

---

## 👥 Team Members

| Name | Role |
|---|---|
| *(placeholder)* | *(placeholder)* |

---

## 📄 License

*(License placeholder — to be decided)*
