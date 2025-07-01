# 🧠 IdeaGenius — AI PRD & Requirements Assistant

## 📌 Overview

IdeaGenius is a desktop productivity application that helps developers, founders, and product teams turn rough project ideas into complete, professional-grade Product Requirements Documents (PRDs). By analyzing base input files like prompts, user stories, or PDFs, it generates potential product ideas, allows refinement, and outputs fully customized PRDs. It supports default user preferences and integrates with automation workflows via LangGraph and N8N.

---

## 🎯 Goals

- Help users go from vague ideas to actionable product definitions
- Automate the creation of detailed PRDs using AI
- Support user preferences like tech stack, theming, and application type and tech stack
- Enable further workflow automation (e.g. GitHub repo creation, File/ReadMe export)

---

## 👤 Target User

- Indie developers
- Startup founders
- Product managers
- Students working on capstone or bootcamp projects

---

## 🧩 Core Features

### 1. Input Parsing
- Accepts input as:
  - PDF, Markdown, or plain text
- Uses NLP to extract key context:
  - Goals
  - Constraints
  - Target user
  - Feature hints
  - Tech Stack Hints

### 2. Idea Generation
- Generates 3–5 product ideas based on the input
- User selects or tweaks an idea
- Optional additional options: “Make this more technical / consumer-facing / etc.”

### 3. Customizable User Preferences
- Persistent settings panel per project for:
  - Color theme / branding
  - Preferred tech stack
  - Target platform (web, mobile, desktop)
  - Project scope: MVP / v1 / advanced
  - Output format: PDF, Markdown, Notion

### 4. PRD Generation
- Generates a full PRD including:
  - Elevator pitch / summary
  - Target personas
  - Key features (with priorities)
  - Technical architecture recommendation
  - Milestones or timeline
  - Success metrics

### 5. Export & Automation
- Export formats: PDF, Markdown, Notion sync
- Integrations via N8N:
  - GitHub: Create repo + README
  - Email: Send PRD to self or team
  - Twitter/X Post to advertise project

---

## 🔁 Intelligent Workflows (LangGraph/N8N)

### LangGraph Agent Loop
- Memory of selected preferences and project goals
- Prompt-chain for idea generation, refinement, and PRD writing
- Adaptive generation based on feedback

### N8N Automations
- Webhook or local trigger on PRD export
- Zap-style integrations:
  - Save file to cloud storage
  - Push PRD content to Notion or GitHub
  - Schedule next steps in a calendar or to-do app

---

## 🖥️ Desktop-Specific Features

- Persistent settings stored locally
- File drag-and-drop support
- Offline-friendly mode (local LLM option)
- System tray or background process for fast startup

---

## 🧪 Success Criteria

| Category               | Criteria                                                                 |
|------------------------|--------------------------------------------------------------------------|
| Problem Definition     | Clearly solves the “vague idea to structured PRD” problem                 |
| Solution Effectiveness| Users can generate high-quality PRDs in < 5 minutes                       |
| Technical Implementation | Uses LangGraph and N8N effectively for AI flow and automation         |
| User Experience        | Intuitive UI, minimal input required, fast iteration                     |
| Innovation             | Personalized PRD generation + automation integration                     |

---

## 🛠️ Technical Stack

| Component        | Choice                        |
|------------------|-------------------------------|
| UI Framework     | Electron + React              |
| AI Flow Engine   | LangGraph                     |
| Automation       | N8N                           |
| Language Models  | OpenAI API                    |
| Database         | SQLite (local)                |
| Styling          | Tailwind CSS and ShadCN       |
| Export Formats   | Markdown, PDF                 |

---


## 🔚 Final Notes

IdeaGenius is designed to be the *“first stop”* in any serious project — helping you go from a messy prompt to a clear product vision in just minutes. It’s your co-pilot for product ideation and planning, built for desktop power users who want to move fast and start smart.

