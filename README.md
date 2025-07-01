# 🧠 SpecForge

SpecForge is a desktop productivity application that helps developers, founders, and product teams turn rough project ideas into complete, professional-grade Product Requirements Documents (PRDs).

## 🚀 Features

- 📝 Input Parsing: Accept input as PDF, Markdown, or plain text
- 💡 Idea Generation: Generate and refine product ideas
- 🎨 Customizable Preferences: Persist settings for themes, tech stack, and more
- 📄 PRD Generation: Create comprehensive product requirement documents
- 🔄 Export & Automation: Support for multiple export formats and workflow automation

## 🛠️ Tech Stack

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- ShadcnUI Components

## 📋 Prerequisites

- Node.js 18.x or later
- npm 9.x or later

## 🏗️ Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint to check code quality

## 🏗️ Project Structure

```
specforge/
├── electron/           # Electron main process files
├── src/
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   ├── App.tsx       # Main application component
│   └── main.tsx      # Application entry point
├── public/           # Static assets
└── dist/            # Production build output
```