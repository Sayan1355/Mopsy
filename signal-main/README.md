# Signal-Main 🚀

**Signal-Main** is a production-ready AI-powered B2B Sales Intelligence Platform. It autonomously ingests raw business signals from across the internet, leverages cascaded Multi-Agent AI (OpenAI GPT) to predict buyer intent, scores leads, recommends actionable sales strategies, and drafts automated outreach—all delivered inside a stunning Enterprise Dashboard.

## 🌟 Project Overview
This platform transforms unstructured data noise into high-value sales pipelines instantly. Using a strict multi-agent architecture with bulletproof fallback redundancy, it scales perfectly from Hackathons to Enterprise Production.

## 🏗️ Architecture

```mermaid
graph TD
    A[Manual Input] --> F
    B[RSS Feeds] --> F
    C[Websites] --> F
    D[JSON Files] --> F
    E[Adscraper Data] --> F
    
    subgraph Signal-Main Core
    F[Signal Collection Agent] --> G[PostgreSQL DB]
    G --> H[Intent Analysis Agent]
    H --> I[Lead Scoring Agent]
    I --> J[Recommendation Agent]
    J --> K[Automation Workflow Agent]
    end
    
    subgraph Interfaces
    K --> L[Enterprise Next.js Dashboard]
    G --> M[AI Business Copilot]
    end
```

## 🛠️ Technology Stack
**Frontend:**
- **Framework**: Next.js 14, React 18
- **Styling**: TailwindCSS, ShadCN UI
- **Data Visualization**: Recharts
- **Icons**: Lucide React

**Backend:**
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL, SQLAlchemy ORM
- **AI Models**: OpenAI GPT (gpt-4-turbo)
- **Validation**: Pydantic

## 📂 Folder Structure
```text
signal-main/
├── backend/
│   ├── app/
│   │   ├── collectors/       # Modular ingestion engines
│   │   ├── database/         # Postgres connections
│   │   ├── models/           # SQLAlchemy schemas (Signal, Lead, Intent, Action)
│   │   ├── prompts/          # Hardened GPT system prompts
│   │   ├── routers/          # FastAPI Routes (/signals, /collect, /copilot, /automation, /demo)
│   │   └── services/         # Multi-Agent AI Core logic
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Main Dashboard
    │   │   ├── layout.tsx
    │   │   └── globals.css   # Dark theme tokens
    │   └── lib/              # Utils (clsx/tailwind-merge)
    ├── tailwind.config.ts
    └── package.json
```

## 🚀 Installation & Setup

1. **Clone & Environment Setup**
```bash
git clone https://github.com/Sayan1355/Mopsy.git
cd Mopsy/signal-main/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Environment Variables (`.env`)**
```env
DATABASE_URL=postgresql://user:password@localhost/signal_main
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo
```

3. **Run Backend**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. **Run Frontend**
```bash
cd ../frontend
npm install
npm run dev
```

## 🔌 API Endpoints
- `POST /api/v1/collect`: Universal ingestion endpoint.
- `POST /api/v1/signals/ingest`: Direct pipeline entry.
- `POST /api/v1/automation/{lead_id}`: Trigger email/CRM automation.
- `POST /api/v1/copilot/chat`: NLP database search.
- `POST /api/v1/demo/populate`: **HACKATHON DEMO MODE** - Generates realistic data instantly!

## 🔮 Future Scope
- Automated direct CRM Syncing (HubSpot/Salesforce).
- Real-time dynamic web scraping pipelines via Playwright integration.
- Full OAuth2 User Authentication.

## 👥 Team Members
Developed as part of the Multi-Agent AI Hackathon Sprint.
