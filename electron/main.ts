import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import Database from 'better-sqlite3'
import fs from 'fs'

import { analyzeProjectWithManager, AgentState } from "../src/ai/analysisGraph"
import { generatePrd, regeneratePrdSection, generateGettingStartedPrompt } from "../src/ai/prdGraph"

/**
 * Normalizes the messy, nested, and inconsistent output from the AI into a clean,
 * predictable, and serializable object that the frontend can easily render.
 * This is crucial to prevent IPC serialization errors.
 */
function normalizePrdData(prdResult: any): any {
  // Safely access potentially nested or inconsistently named properties
  const summary = prdResult.summary || {}
  const personas = prdResult.personas?.personas || prdResult.personas?.user_personas || []
  const features = prdResult.features?.features || prdResult.features?.KeyFeatures || []
  const techStack = prdResult.techStack?.tech_stack || prdResult.techStack || {}
  const uiDesign = prdResult.uiDesign?.UI_UX_Design || prdResult.uiDesign || {}

  // The AI sometimes returns a summary *object* instead of a string. Flatten it.
  const flatSummary = typeof summary.summary === 'object' && summary.summary !== null
    ? Object.entries(summary.summary).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
    : summary.summary

  // Return a clean, flat, and serializable object.
  return {
    refinedIdea: prdResult.refinedIdea || '',
    originalContext: prdResult.originalContext || '',
    summary: {
      elevatorPitch: summary.elevatorPitch || '',
      summary: flatSummary || '',
    },
    personas: personas,
    features: features,
    techStack: techStack,
    uiDesign: {
      principles: uiDesign.principles || uiDesign.Core_Design_Principles || [],
      palette: uiDesign.palette || uiDesign.Color_Palette_Suggestions || {},
      screens: uiDesign.screens || uiDesign.Key_Screens || [],
    },
    // Explicitly exclude the 'messages' array which contains non-serializable class instances
  }
}

// Database interfaces
interface Project {
  id: string
  name: string
  status: 'draft' | 'in-progress' | 'completed'
  created_at: string
  updated_at: string
}

interface ProjectStep {
  id: string
  project_id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
  step_order: number
  content?: string
  created_at: string
  updated_at: string
}

// Database service for main process
class DatabaseService {
  private db!: Database.Database
  private static instance: DatabaseService
  private initialized: boolean = false

  constructor() {
    // Don't initialize synchronously - do it async
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Get user data path
      const userDataPath = app.getPath('userData')
      
      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }

      const dbPath = path.join(userDataPath, 'ideagenius.db')
      console.log(`Initializing database at: ${dbPath}`)
      
      this.db = new Database(dbPath)
      
      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = 10000') // Increase cache size
      
      this.initializeTables()
      this.initialized = true
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  private initializeTables() {
    console.log('Initializing database tables...')
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON')

    // Check if we need to migrate the schema
    this.migrateSchema()

    // Create projects table (new schema without description)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft', 'in-progress', 'completed')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    // Create project_steps table (new schema without description)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_steps (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
        step_order INTEGER NOT NULL,
        content TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `)

    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_project_steps_project_id ON project_steps (project_id);
    `)

    // Only checkpoint once during initialization
    this.checkpoint()
    console.log('Database initialization complete')
  }

  private migrateSchema() {
    try {
      // Check if old schema exists by looking for description column
      const hasProjectsTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get()
      
      if (hasProjectsTable) {
        // Check if description column exists in projects table
        const projectsInfo = this.db.pragma('table_info(projects)') as Array<{ name: string }>
        const hasDescriptionCol = projectsInfo.some((col: any) => col.name === 'description')
        
        if (hasDescriptionCol) {
          console.log('Migrating projects table schema...')
          // Create new table without description
          this.db.exec(`
            CREATE TABLE projects_new (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              status TEXT NOT NULL CHECK (status IN ('draft', 'in-progress', 'completed')),
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `)
          
          // Copy data from old table (excluding description)
          this.db.exec(`
            INSERT INTO projects_new (id, name, status, created_at, updated_at)
            SELECT id, name, status, created_at, updated_at FROM projects
          `)
          
          // Drop old table and rename new one
          this.db.exec('DROP TABLE projects')
          this.db.exec('ALTER TABLE projects_new RENAME TO projects')
          console.log('Projects table migrated successfully')
        }
      }

      // Check and migrate project_steps table
      const hasStepsTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='project_steps'").get()
      
      if (hasStepsTable) {
        const stepsInfo = this.db.pragma('table_info(project_steps)') as Array<{ name: string }>
        const hasDescriptionCol = stepsInfo.some((col: any) => col.name === 'description')
        
        if (hasDescriptionCol) {
          console.log('Migrating project_steps table schema...')
          // Create new table without description
          this.db.exec(`
            CREATE TABLE project_steps_new (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              title TEXT NOT NULL,
              status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
              step_order INTEGER NOT NULL,
              content TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            )
          `)
          
          // Copy data from old table (excluding description)
          this.db.exec(`
            INSERT INTO project_steps_new (id, project_id, title, status, step_order, content, created_at, updated_at)
            SELECT id, project_id, title, status, step_order, content, created_at, updated_at FROM project_steps
          `)
          
          // Drop old table and rename new one
          this.db.exec('DROP TABLE project_steps')
          this.db.exec('ALTER TABLE project_steps_new RENAME TO project_steps')
          console.log('Project steps table migrated successfully')
        }
      }
    } catch (error) {
      console.warn('Schema migration failed, but continuing with initialization:', error)
    }
  }

  checkpoint() {
    try {
      this.db.pragma('wal_checkpoint(PASSIVE)') // Use PASSIVE instead of TRUNCATE for better performance
    } catch (error) {
      console.warn('Failed to checkpoint database:', error)
    }
  }

  save() {
    this.checkpoint()
    console.log('Database saved to disk')
  }

  createProject(project: Omit<Project, 'created_at' | 'updated_at'>): Project {
    const now = new Date().toISOString()
    const projectData = {
      ...project,
      created_at: now,
      updated_at: now
    }

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      projectData.id,
      projectData.name,
      projectData.status,
      projectData.created_at,
      projectData.updated_at
    )

    // Don't checkpoint on every operation - only on save()
    console.log(`Created project: ${projectData.name} (${projectData.id})`)
    return projectData
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>): boolean {
    const now = new Date().toISOString()
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = [...Object.values(updates), now, id]

    const stmt = this.db.prepare(`
      UPDATE projects 
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `)
    
    const result = stmt.run(...values)
    const success = result.changes > 0
    
    if (success) {
      console.log(`Updated project: ${id}`)
    }
    
    return success
  }

  deleteProject(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?')
    const result = stmt.run(id)
    const success = result.changes > 0
    
    if (success) {
      console.log(`Deleted project: ${id}`)
    }
    
    return success
  }

  getAllProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC')
    return stmt.all() as Project[]
  }

  createProjectStep(step: Omit<ProjectStep, 'created_at' | 'updated_at'>): ProjectStep {
    const now = new Date().toISOString()
    const stepData = {
      ...step,
      created_at: now,
      updated_at: now
    }

    const stmt = this.db.prepare(`
      INSERT INTO project_steps (id, project_id, title, status, step_order, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      stepData.id,
      stepData.project_id,
      stepData.title,
      stepData.status,
      stepData.step_order,
      stepData.content,
      stepData.created_at,
      stepData.updated_at
    )

    return stepData
  }

  getProjectSteps(projectId: string): ProjectStep[] {
    const stmt = this.db.prepare('SELECT * FROM project_steps WHERE project_id = ? ORDER BY step_order')
    return stmt.all(projectId) as ProjectStep[]
  }

  updateProjectStep(id: string, updates: Partial<Omit<ProjectStep, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): boolean {
    const now = new Date().toISOString()
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = [...Object.values(updates), now, id]

    const stmt = this.db.prepare(`
      UPDATE project_steps 
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `)
    
    const result = stmt.run(...values)
    const success = result.changes > 0
    
    if (success) {
      console.log(`Updated step: ${id}`)
    }
    
    return success
  }

  getAllProjectsWithSteps(): (Project & { steps: ProjectStep[] })[] {
    const projects = this.getAllProjects()
    return projects.map(project => ({
      ...project,
      steps: this.getProjectSteps(project.id)
    }))
  }

  // Settings CRUD operations
  setSetting(key: string, value: any): boolean {
    const now = new Date().toISOString()
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    
    const result = stmt.run(key, serializedValue, now, now)
    const success = result.changes > 0
    
    if (success) {
      console.log(`Updated setting: ${key}`)
    }
    
    return success
  }

  getSetting(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?')
    const result = stmt.get(key) as { value: string } | undefined
    return result?.value || null
  }

  // Convenience methods for Default Tech Stack
  setDefaultTechStack(techStack: any): boolean {
    return this.setSetting('default-tech-stack', techStack)
  }

  getDefaultTechStack(): any {
    const value = this.getSetting('default-tech-stack')
    if (!value) return null
    
    try {
      return JSON.parse(value)
    } catch (error) {
      console.error('Failed to parse default tech stack:', error)
      return null
    }
  }

  close() {
    try {
      console.log('Closing database...')
      this.save()
      this.db.close()
      console.log('Database closed successfully')
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }
}

// Initialize database
let db: DatabaseService

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ ├─┬ preload
// │ │ └── index.js
// │ ├─┬ renderer
// │ │ └── index.html

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.webContents.openDevTools()

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  // Ensure database is closed before quitting
  try {
    if (db) {
      db.close()
    }
  } catch (error) {
    console.error('Error closing database on app exit:', error)
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  // Ensure database is properly saved before quitting
  try {
    if (db) {
      db.save()
      console.log('Database saved before app quit')
    }
  } catch (error) {
    console.error('Error saving database before quit:', error)
  }
})

// Database IPC handlers
ipcMain.handle('db-get-all-projects', async () => {
  try {
    if (!db) return []
    await db.initialize() // Ensure initialized
    const projects = db.getAllProjectsWithSteps()
    
    // Migrate projects to ensure they have all 5 steps
    const migratedProjects = projects.map(project => {
      if (project.steps.length < 5) {
        // Check if step_5 is missing
        const hasStep5 = project.steps.some(step => step.id.includes('step_5'))
        if (!hasStep5) {
          // Add step_5 to the project
          const newStep = {
            id: `${project.id}_step_5`,
            project_id: project.id,
            title: 'Project Finalization',
            status: 'pending' as const,
            step_order: 5
          }
          
          try {
            const createdStep = db.createProjectStep(newStep)
            return {
              ...project,
              steps: [...project.steps, createdStep]
            }
          } catch (err) {
            console.error('Failed to create step_5 for project:', project.id, err)
            return project
          }
        }
      }
      return project
    })
    
    return migratedProjects
  } catch (error) {
    console.error('Failed to get projects:', error)
    throw error
  }
})

ipcMain.handle('db-create-project', async (_, projectData) => {
  try {
    if (!db) throw new Error('Database not initialized')
    await db.initialize() // Ensure initialized
    
    // Create project
    const project = db.createProject(projectData)
    
    // Create default steps
    const defaultSteps = [
      {
        id: `${project.id}_step_1`,
        project_id: project.id,
        title: 'Input Analysis',
        status: 'pending' as const,
        step_order: 1
      },
      {
        id: `${project.id}_step_2`,
        project_id: project.id,
        title: 'Idea Generation',
        status: 'pending' as const,
        step_order: 2
      },
      {
        id: `${project.id}_step_3`,
        project_id: project.id,
        title: 'Idea Refinement',
        status: 'pending' as const,
        step_order: 3
      },
      {
        id: `${project.id}_step_4`,
        project_id: project.id,
        title: 'PRD Generation',
        status: 'pending' as const,
        step_order: 4
      },
      {
        id: `${project.id}_step_5`,
        project_id: project.id,
        title: 'Project Finalization',
        status: 'pending' as const,
        step_order: 5
      }
    ]

    // Create steps
    const steps = defaultSteps.map(step => db.createProjectStep(step))
    
    return { ...project, steps }
  } catch (error) {
    console.error('Failed to create project:', error)
    throw error
  }
})

ipcMain.handle('db-update-project', async (_, id, updates) => {
  try {
    if (!db) throw new Error('Database not initialized')
    await db.initialize() // Ensure initialized
    return db.updateProject(id, updates)
  } catch (error) {
    console.error('Failed to update project:', error)
    throw error
  }
})

ipcMain.handle('db-delete-project', async (_, id) => {
  try {
    if (!db) throw new Error('Database not initialized')
    await db.initialize() // Ensure initialized
    return db.deleteProject(id)
  } catch (error) {
    console.error('Failed to delete project:', error)
    throw error
  }
})

ipcMain.handle('db-update-step', async (_, id, updates) => {
  try {
    if (!db) throw new Error('Database not initialized')
    await db.initialize() // Ensure initialized
    return db.updateProjectStep(id, updates)
  } catch (error) {
    console.error('Failed to update step:', error)
    throw error
  }
})

ipcMain.handle('db-save', async () => {
  try {
    if (db) {
      await db.initialize() // Ensure initialized
      db.save()
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to save database:', error)
    throw error
  }
})

// Settings IPC handlers
ipcMain.handle('settings-get-default-tech-stack', async () => {
  try {
    if (!db) return null
    await db.initialize() // Ensure initialized
    return db.getDefaultTechStack()
  } catch (error) {
    console.error('Failed to get default tech stack:', error)
    throw error
  }
})

ipcMain.handle('settings-set-default-tech-stack', async (_, techStack) => {
  try {
    if (!db) throw new Error('Database not initialized')
    await db.initialize() // Ensure initialized
    return db.setDefaultTechStack(techStack)
  } catch (error) {
    console.error('Failed to set default tech stack:', error)
    throw error
  }
})

// Other IPC handlers
ipcMain.handle("analyze-project", async (event, payload) => {
  try {
    const { textInput, defaultTechStack } = payload as {
      textInput: string
      defaultTechStack?: {
        frontend: string
        backend: string
        database: string
        hosting: string
        additional: string
      }
    }

    // Truncate for safety
    const context = textInput.slice(0, 16000)

    // Run the LangChain graph analysis with default tech stack
    const result: AgentState = await analyzeProjectWithManager(context, defaultTechStack)

    // Return a serializable part of the result to the UI
    return {
      context: result.context,
      ideas: result.ideas,
      techStack: result.techStack,
    }
  } catch (error) {
    console.error("AI analysis failed:", error)
    throw new Error("AI analysis failed. Please check the main process logs.")
  }
})

ipcMain.handle("ai-generate-prd", async (_, payload) => {
  try {
    await db.initialize()
    const { refinedIdea, originalContext, refinedTechStack } = payload as {
      refinedIdea: string
      originalContext: string
      refinedTechStack?: {
        frontend: string
        backend: string
        database: string
        hosting: string
      }
    }

    // Call the PRD generation graph with refined tech stack
    const prdResult = await generatePrd(refinedIdea, originalContext, refinedTechStack)

    // Normalize the messy AI output into a clean, predictable, serializable structure
    const normalizedResult = normalizePrdData(prdResult)

    // Return the clean, normalized results to the UI
    return normalizedResult
    
  } catch (error) {
    console.error("PRD generation failed:", error)
    throw new Error("PRD generation failed. Please check the main process logs.")
  }
})

ipcMain.handle("ai-regenerate-prd-section", async (_, payload) => {
  try {
    await db.initialize()
    const { refinedIdea, originalContext, refinedTechStack, sectionKey } = payload as {
      refinedIdea: string
      originalContext: string
      refinedTechStack?: {
        frontend: string
        backend: string
        database: string
        hosting: string
      }
      sectionKey: string
    }

    // Call the individual section regeneration function
    const sectionResult = await regeneratePrdSection(sectionKey, refinedIdea, originalContext, refinedTechStack)

    // Return the section result to the UI
    return sectionResult
    
  } catch (error) {
    console.error(`PRD section regeneration failed for ${payload.sectionKey}:`, error)
    throw new Error(`PRD section regeneration failed for ${payload.sectionKey}. Please check the main process logs.`)
  }
})

ipcMain.handle("ai-generate-getting-started", async (_, payload) => {
  try {
    await db.initialize()
    const { prdData } = payload as {
      prdData: any
    }

    // Call the getting started prompt generation function
    const prompt = await generateGettingStartedPrompt(prdData)

    return prompt
    
  } catch (error) {
    console.error("Getting started prompt generation failed:", error)
    throw new Error("Getting started prompt generation failed. Please check the main process logs.")
  }
})

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData')
})

ipcMain.handle('close-database', () => {
  try {
    if (db) {
      db.close()
      return { success: true }
    }
    return { success: false, error: 'Database not initialized' }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Failed to close database:', error)
    return { success: false, error: errorMsg }
  }
})

app.whenReady().then(async () => {
  // Initialize database service instance
  db = DatabaseService.getInstance()
  
  // Create window immediately for faster startup
  createWindow()
  
  // Initialize database asynchronously in background
  try {
    await db.initialize()
    console.log('Database service ready')
  } catch (error) {
    console.error('Failed to initialize database service:', error)
  }
}) 