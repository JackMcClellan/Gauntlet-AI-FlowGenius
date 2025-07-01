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

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/specforge.git
   cd specforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
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

## 🎨 Customization

The application supports both light and dark themes, with a customizable blue-based color scheme. Theme preferences are automatically persisted in local storage.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadcnUI](https://ui.shadcn.com/)