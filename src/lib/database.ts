import Database from 'better-sqlite3'
import path from 'path'

// Handle both main and renderer process
let userDataPath: string = './data' // Default fallback

try {
  // Try to get from Electron main process
  const { app } = require('electron')
  userDataPath = app.getPath('userData')
} catch {
  // In renderer process, we'll handle this in the constructor
}

export interface Project {
  id: string
  name: string
  status: 'draft' | 'in-progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface ProjectStep {
  id: string
  project_id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
  step_order: number
  content?: string
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  step_id?: string
  name: string
  size: number
  type: string
  file_path: string
  created_at: string
}

class DatabaseService {
  private db: Database.Database
  private static instance: DatabaseService

  constructor() {
    try {
      // Ensure directory exists
      const fs = require('fs')
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }

      // Use the userDataPath determined at module level
      const dbPath = path.join(userDataPath, 'specforge.db')
      
      console.log(`Initializing database at: ${dbPath}`)
      
      this.db = new Database(dbPath)
      
      // Enable WAL mode for better performance and concurrent access
      this.db.pragma('journal_mode = WAL')
      
      // Set synchronous mode for immediate writes
      this.db.pragma('synchronous = NORMAL')
      
      this.initializeTables()
      
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private initializeTables() {
    console.log('Initializing database tables...')
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON')

    // Create projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft', 'in-progress', 'completed')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
    console.log('Projects table ready')

    // Create project_steps table
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
    console.log('Project steps table ready')

    // Create project_files table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        step_id TEXT,
        name TEXT NOT NULL,
        size INTEGER NOT NULL,
        type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (step_id) REFERENCES project_steps (id) ON DELETE SET NULL
      )
    `)
    console.log('Project files table ready')

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_project_steps_project_id ON project_steps (project_id);
      CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files (project_id);
      CREATE INDEX IF NOT EXISTS idx_project_files_step_id ON project_files (step_id);
    `)
    console.log('Database indexes created')

    // Initial checkpoint to ensure tables are written to disk
    this.checkpoint()
    console.log('Database initialization complete')
  }

  // Project CRUD operations
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

    // Ensure immediate write to disk
    this.checkpoint()

    console.log(`Created project: ${projectData.name} (${projectData.id})`)
    return projectData
  }

  getProject(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?')
    return stmt.get(id) as Project | null
  }

  getAllProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC')
    return stmt.all() as Project[]
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
      this.checkpoint()
      console.log(`Updated project: ${id}`)
    }
    
    return success
  }

  deleteProject(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?')
    const result = stmt.run(id)
    const success = result.changes > 0
    
    if (success) {
      this.checkpoint()
      console.log(`Deleted project: ${id}`)
    }
    
    return success
  }

  // Project Steps CRUD operations
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

    this.checkpoint()
    console.log(`Created step: ${stepData.title} for project ${stepData.project_id}`)

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
      this.checkpoint()
      console.log(`Updated step: ${id}`)
    }
    
    return success
  }

  // Project Files CRUD operations
  createProjectFile(file: Omit<ProjectFile, 'created_at'>): ProjectFile {
    const now = new Date().toISOString()
    const fileData = {
      ...file,
      created_at: now
    }

    const stmt = this.db.prepare(`
      INSERT INTO project_files (id, project_id, step_id, name, size, type, file_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      fileData.id,
      fileData.project_id,
      fileData.step_id,
      fileData.name,
      fileData.size,
      fileData.type,
      fileData.file_path,
      fileData.created_at
    )

    this.checkpoint()
    console.log(`Created file record: ${fileData.name} for project ${fileData.project_id}`)

    return fileData
  }

  getProjectFiles(projectId: string, stepId?: string): ProjectFile[] {
    let stmt
    if (stepId) {
      stmt = this.db.prepare('SELECT * FROM project_files WHERE project_id = ? AND step_id = ?')
      return stmt.all(projectId, stepId) as ProjectFile[]
    } else {
      stmt = this.db.prepare('SELECT * FROM project_files WHERE project_id = ?')
      return stmt.all(projectId) as ProjectFile[]
    }
  }

  deleteProjectFile(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM project_files WHERE id = ?')
    const result = stmt.run(id)
    const success = result.changes > 0
    
    if (success) {
      this.checkpoint()
      console.log(`Deleted file: ${id}`)
    }
    
    return success
  }

  // Combined operations for convenience
  getProjectWithSteps(projectId: string): (Project & { steps: ProjectStep[] }) | null {
    const project = this.getProject(projectId)
    if (!project) return null

    const steps = this.getProjectSteps(projectId)
    return { ...project, steps }
  }

  getAllProjectsWithSteps(): (Project & { steps: ProjectStep[] })[] {
    const projects = this.getAllProjects()
    return projects.map(project => ({
      ...project,
      steps: this.getProjectSteps(project.id)
    }))
  }

  // Transaction support
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)()
  }

  // Force write to disk
  checkpoint() {
    try {
      this.db.pragma('wal_checkpoint(TRUNCATE)')
    } catch (error) {
      console.warn('Failed to checkpoint database:', error)
    }
  }

  // Save all pending changes to disk
  save() {
    this.checkpoint()
    console.log('Database saved to disk')
  }

  close() {
    try {
      console.log('Closing database...')
      this.save() // Save before closing
      this.db.close()
      console.log('Database closed successfully')
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }
}

export default DatabaseService 