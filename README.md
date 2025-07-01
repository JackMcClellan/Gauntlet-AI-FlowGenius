# 🧠 IdeaGenius

IdeaGenius is a desktop productivity application that helps developers, founders, and product teams turn rough project ideas into complete, professional-grade Product Requirements Documents (PRDs). It uses AI agents, powered by LangChain and OpenAI, to analyze your initial thoughts, generate product ideas, recommend a tech stack, and then build out a full PRD.

## 🚀 Features

-   **AI-Powered Analysis:** Takes your raw ideas (text or files) and generates distinct product concepts.
-   **Tech Stack Recommendation:** Suggests a suitable technology stack for your project.
-   **Automated PRD Generation:** Creates a comprehensive PRD with sections like:
    -   Elevator Pitch & Summary
    -   User Personas
    -   Key Features
    -   UI/UX Design Concepts
    -   Proposed File Structure
-   **Local First:** Your projects and data are stored locally in a SQLite database.

## 🛠️ Tech Stack

-   **Framework:** Electron, React, Vite, TypeScript
-   **AI:** LangChain.js, LangGraph, OpenAI
-   **Styling:** Tailwind CSS, shadcn/ui
-   **Database:** better-sqlite3
-   **Packaging:** electron-builder

## 📋 Getting Started

### Prerequisites

-   Node.js (v18.x or later recommended)
-   npm (v9.x or later recommended)
-   An [OpenAI API key](https://platform.openai.com/account/api-keys).

### Installation & Running


1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**

    Create a file named `.env` in the root of the project and add your OpenAI API key:

    ```
    OPENAI_API_KEY="your_openai_api_key_here"
    ```

    The application uses `dotenv` to load this key for the AI services.

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

## 🔧 Available Scripts

-   `npm run dev`: Starts the application in development mode with hot-reloading.
-   `npm run build`: Compiles and builds the application for production.
-   `npm run lint`: Lints the source code using ESLint.
-   `npm run preview`: Previews the production build locally.

## 🏗️ Project Structure

The project is organized as follows:

```
ideagenius/
├── dist-electron/    # Compiled Electron main process code
├── electron/         # Electron main process source code (TypeScript)
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── ai/             # AI agent graphs and logic (LangChain)
│   │   ├── analysisGraph.ts
│   │   └── prdGraph.ts
│   ├── components/     # React UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries (database, utils)
│   │   └── database.ts # better-sqlite3 service
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main React application component
│   └── main.tsx        # React application entry point
├── package.json      # Project metadata and dependencies
└── vite.config.ts    # Vite configuration
```