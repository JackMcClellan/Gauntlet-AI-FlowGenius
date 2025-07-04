# 🧠 IdeaGenius

IdeaGenius is a comprehensive desktop productivity application that transforms rough project ideas into complete, professional-grade Product Requirements Documents (PRDs). Using advanced AI agents powered by LangChain and OpenAI, it guides you through a structured 5-step workflow to analyze ideas, generate solutions, and create detailed project documentation.

## 🚀 Key Features

### **AI-Powered 5-Step Workflow**
1. **Input Analysis** - Analyze your project requirements and context
2. **Idea Generation** - Generate multiple product concepts and tech stack recommendations
3. **Idea Refinement** - Refine your selected idea and customize the tech stack
4. **PRD Generation** - Create comprehensive PRD with detailed sections
5. **Project Finalization** - Review, export, and manage your completed PRD

### **Comprehensive PRD Generation**
- **Executive Summary** - Elevator pitch and project overview
- **User Personas** - Detailed user profiles with goals and frustrations
- **Feature Specifications** - Prioritized feature lists with descriptions
- **Technical Architecture** - Recommended tech stack and implementation details
- **UI/UX Design** - Design principles, color palettes, and screen layouts
- **Implementation Planning** - Timeline, resources, and stakeholder communication

### **Smart Features**
- **Local-First Storage** - All data stored locally in SQLite database
- **Auto-Save** - Real-time saving of your work with visual indicators
- **Project Management** - Create, manage, and track multiple projects
- **Tech Stack Preferences** - Customize default technology preferences
- **Regeneration** - Regenerate specific PRD sections as needed
- **Dark/Light Theme** - Modern UI with theme switching

## 🛠️ Tech Stack

### **Frontend & Desktop**
- **Framework:** Electron + React + TypeScript + Vite
- **UI Library:** Tailwind CSS + shadcn/ui components
- **State Management:** React hooks with IPC communication
- **Styling:** Tailwind CSS with CSS variables for theming

### **AI & Backend**
- **AI Framework:** LangChain.js + LangGraph
- **LLM Provider:** OpenAI GPT-4 (configurable model)
- **AI Architecture:** Multi-agent system with specialized nodes
- **Processing:** Structured JSON outputs with validation

### **Data & Storage**
- **Database:** better-sqlite3 (local SQLite)
- **Data Flow:** IPC (Inter-Process Communication) between main and renderer
- **Persistence:** Local-first with automatic backups

### **Development**
- **Build Tool:** Vite with Electron integration
- **Package Manager:** npm
- **Distribution:** electron-builder for multi-platform builds (M4 Mac optimized)
- **Linting:** ESLint with TypeScript support

## 📋 Getting Started

### Prerequisites

- **Node.js** (v18.x or later recommended)
- **npm** (v9.x or later recommended)
- **OpenAI API Key** - Get yours from [OpenAI Platform](https://platform.openai.com/account/api-keys)
- **M4 Mac** (or other Mac with ARM64 architecture) - Optimized builds available

### Installation & Setup


1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🏗️ Building the Application

### **For M4 Mac (Recommended)**

To build IdeaGenius specifically for M4 Mac with optimal ARM64 performance:

```bash
npm run build:mac-arm64
```

This will create:
- `dist/IdeaGenius-0.1.0-arm64.dmg` - DMG installer for M4 Mac
- `dist/IdeaGenius-0.1.0-arm64-mac.zip` - ZIP file for M4 Mac

### **For All Mac Architectures**

To build for both Intel and ARM64 Macs:

```bash
npm run build:mac
```

### **For All Platforms**

To build for Windows, macOS, and Linux:

```bash
npm run build
```

## 📦 Installing the Application

### **Option 1: Using DMG File (Recommended)**

1. **Download** the `IdeaGenius-0.1.0-arm64.dmg` file from the `dist/` folder after building
2. **Double-click** the DMG file to mount it
3. **Drag** the IdeaGenius app to your Applications folder
4. **Launch** from Applications or Spotlight

### **Option 2: Using ZIP File**

1. **Download** the `IdeaGenius-0.1.0-arm64-mac.zip` file from the `dist/` folder
2. **Unzip** the file
3. **Move** the IdeaGenius app to your Applications folder
4. **Launch** from Applications or Spotlight

### **Security Note**

Since the app is not code-signed, you may see a security warning on first launch:
1. **Control-click** the app and select "Open"
2. **Click "Open"** in the security dialog
3. The app will launch and be trusted for future use

## 🔧 Available Scripts

- `npm run dev` - Start the application in development mode with hot-reloading
- `npm run build` - Build the application for production (all platforms)
- `npm run build:mac` - Build and package for macOS (all Mac architectures)
- `npm run build:mac-arm64` - Build and package specifically for M4 Mac (ARM64)
- `npm run lint` - Run ESLint on the source code
- `npm run preview` - Preview the production build locally

## 📁 Project Structure

```
ideagenius/
├── dist-electron/          # Compiled Electron main process
├── electron/              # Electron main process source
│   ├── main.ts            # Main process entry point & IPC handlers
│   └── preload.ts         # Preload script for renderer process
├── src/
│   ├── ai/                # AI agent implementations
│   │   ├── analysisGraph.ts   # Input analysis & idea generation
│   │   └── prdGraph.ts        # PRD generation with specialized agents
│   ├── components/        # React UI components
│   │   ├── steps/         # 5-step workflow components
│   │   │   ├── InputAnalysis.tsx
│   │   │   ├── IdeaGeneration.tsx
│   │   │   ├── IdeaRefinement.tsx
│   │   │   ├── PrdGeneration.tsx
│   │   │   └── ProjectFinalization.tsx
│   │   ├── ui/            # shadcn/ui components
│   │   ├── AutoSave.tsx   # Auto-save functionality
│   │   ├── Settings.tsx   # User preferences & config
│   │   └── theme-provider.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useDatabase.ts # Database operations via IPC
│   ├── lib/               # Core utilities
│   │   ├── database.ts    # Database service (main process)
│   │   └── utils.ts       # Utility functions
│   ├── types/             # TypeScript type definitions
│   │   └── ai.ts          # AI-related interfaces
│   ├── App.tsx            # Main application component
│   └── main.tsx           # React entry point
├── components.json        # shadcn/ui configuration
├── package.json          # Dependencies and scripts
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── README.md             # This file
```

## 🔧 Configuration

### **OpenAI Settings**
- Model: GPT-4 Turbo (configurable)
- Temperature: 0.2 for consistent outputs
- Max tokens: Optimized per use case

### **Database**
- Location: `{userData}/ideagenius.db`
- Mode: WAL (Write-Ahead Logging)
- Backup: Automatic checkpoints

### **Tech Stack Preferences**
Configure your default technology preferences in the Settings:
- Frontend framework preferences
- Backend technology choices
- Database preferences
- Hosting platform preferences

## 🎯 Workflow Overview

### **Step 1: Input Analysis**
- Enter project name and requirements
- AI analyzes context and generates initial insights
- Auto-save ensures no work is lost

### **Step 2: Idea Generation**
- Review AI-generated product concepts
- Examine recommended tech stack
- Select your preferred product idea

### **Step 3: Idea Refinement**
- Refine the selected idea with additional details
- Customize the tech stack recommendations
- Prepare for comprehensive PRD generation

### **Step 4: PRD Generation**
- Generate complete PRD with all sections
- Review personas, features, and technical specs
- Regenerate individual sections as needed

### **Step 5: Project Finalization**
- Final review of the complete PRD
- Export options for sharing and implementation
- Project completion and archival

## 🤝 Contributing

This project uses modern development practices:
- TypeScript for type safety
- ESLint for code quality
- IPC architecture for security
- Local-first data storage

## 📄 License

[Add your license information here]

## 🚀 Roadmap

- Export to multiple formats (PDF, Word, Markdown)
- Integration with project management tools
- Collaborative features for team projects
- Advanced AI model configurations
- Custom PRD templates