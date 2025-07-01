import { Button } from './components/ui/button'
import { ThemeProvider, useTheme } from './components/theme-provider'
import { MoonIcon, SunIcon } from 'lucide-react'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      data-slot="theme-toggle"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <SunIcon className="size-5" />
      ) : (
        <MoonIcon className="size-5" />
      )}
    </Button>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div data-slot="app" className="min-h-screen bg-background">
        <header className="border-b">
          <div data-slot="header" className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-bold">SpecForge</h1>
            <ThemeToggle />
          </div>
        </header>
        <main data-slot="main" className="container mx-auto max-w-4xl px-6 py-16">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Welcome to SpecForge
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Turn your ideas into complete, professional-grade Product Requirements Documents.
              </p>
            </div>
            <div className="pt-4">
              <Button size="lg" className="px-8 py-3 text-lg">Get Started</Button>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App 