import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { SearchIcon, SaveIcon, SettingsIcon } from 'lucide-react'

// Access Electron APIs
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

interface DefaultTechStack {
  frontend: string
  backend: string
  database: string
  hosting: string
  additional: string
}

interface SettingsProps {
  onClose?: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [defaultTechStack, setDefaultTechStack] = useState<DefaultTechStack>({
    frontend: '',
    backend: '',
    database: '',
    hosting: '',
    additional: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Settings sections that can be searched
  const settingsSections = [
    {
      id: 'tech-stack',
      title: 'Default Tech Stack',
      description: 'Set your preferred default technologies for new projects',
      keywords: ['tech', 'stack', 'technology', 'frontend', 'backend', 'database', 'hosting', 'default']
    },
    // Future sections can be added here
    {
      id: 'future-section',
      title: 'Future Settings',
      description: 'More settings coming soon...',
      keywords: ['future', 'coming', 'soon']
    }
  ]

  // Filter sections based on search query
  const filteredSections = settingsSections.filter(section => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      section.title.toLowerCase().includes(query) ||
      section.description.toLowerCase().includes(query) ||
      section.keywords.some(keyword => keyword.includes(query))
    )
  })

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!ipcRenderer) {
          console.warn('IPC not available - running in non-Electron environment')
          return
        }

        const savedTechStack = await ipcRenderer.invoke('settings-get-default-tech-stack')
        
        if (savedTechStack) {
          setDefaultTechStack(savedTechStack)
        }
      } catch (err) {
        console.error('Failed to load saved settings:', err)
      }
    }

    loadSettings()
  }, [])

  const handleTechStackChange = (field: keyof DefaultTechStack, value: string) => {
    setDefaultTechStack(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (!ipcRenderer) {
        throw new Error('IPC not available - cannot save settings')
      }

      // Save to database via IPC
      const success = await ipcRenderer.invoke('settings-set-default-tech-stack', defaultTechStack)
      
      if (success) {
        setLastSaved(new Date())
      } else {
        throw new Error('Failed to save to database')
      }
      
      // Simulate save delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isDefaultTechStackVisible = filteredSections.some(section => section.id === 'tech-stack')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="size-6" />
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your IdeaGenius experience</p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          type="text"
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {filteredSections.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No settings found matching "{searchQuery}"</p>
          </Card>
        )}

        {/* Default Tech Stack Section */}
        {isDefaultTechStackVisible && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Default Tech Stack</h3>
                <p className="text-muted-foreground text-sm">
                  Set your preferred default technologies. These will be pre-filled when creating new projects.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="default-frontend" className="text-sm font-medium">
                    Frontend
                  </label>
                  <Input
                    id="default-frontend"
                    type="text"
                    value={defaultTechStack.frontend}
                    onChange={(e) => handleTechStackChange('frontend', e.target.value)}
                    placeholder="e.g., React, Vue.js, Angular"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="default-backend" className="text-sm font-medium">
                    Backend
                  </label>
                  <Input
                    id="default-backend"
                    type="text"
                    value={defaultTechStack.backend}
                    onChange={(e) => handleTechStackChange('backend', e.target.value)}
                    placeholder="e.g., Node.js, Python, Java"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="default-database" className="text-sm font-medium">
                    Database
                  </label>
                  <Input
                    id="default-database"
                    type="text"
                    value={defaultTechStack.database}
                    onChange={(e) => handleTechStackChange('database', e.target.value)}
                    placeholder="e.g., PostgreSQL, MongoDB, MySQL"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="default-hosting" className="text-sm font-medium">
                    Hosting
                  </label>
                  <Input
                    id="default-hosting"
                    type="text"
                    value={defaultTechStack.hosting}
                    onChange={(e) => handleTechStackChange('hosting', e.target.value)}
                    placeholder="e.g., AWS, Vercel, Netlify"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="default-additional" className="text-sm font-medium">
                  Additional Technologies
                </label>
                <Input
                  id="default-additional"
                  type="text"
                  value={defaultTechStack.additional}
                  onChange={(e) => handleTechStackChange('additional', e.target.value)}
                  placeholder="e.g., Docker, Redis, GraphQL"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  {lastSaved && (
                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                  )}
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  <SaveIcon className="size-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Future Settings Section */}
        {filteredSections.some(section => section.id === 'future-section') && (
          <Card className="p-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">More Settings Coming Soon</h3>
              <p className="text-muted-foreground text-sm">
                Additional customization options will be added in future updates.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Utility function to get default tech stack from settings
export const getDefaultTechStack = async (): Promise<DefaultTechStack> => {
  try {
    if (!ipcRenderer) {
      console.warn('IPC not available - returning empty tech stack')
      return {
        frontend: '',
        backend: '',
        database: '',
        hosting: '',
        additional: ''
      }
    }

    const savedTechStack = await ipcRenderer.invoke('settings-get-default-tech-stack')
    
    if (savedTechStack) {
      return savedTechStack
    }
  } catch (err) {
    console.error('Failed to load default tech stack:', err)
  }
  
  return {
    frontend: '',
    backend: '',
    database: '',
    hosting: '',
    additional: ''
  }
} 