import { useState, useEffect, useCallback } from 'react'

// Transform database types to match UI types
export interface UIProject {
  id: string
  name: string
  status: 'draft' | 'in-progress' | 'completed'
  createdAt: string
  steps: UIProjectStep[]
}

export interface UIProjectStep {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
  content?: any
}

// IPC helper
const ipc = (window as any).require('electron').ipcRenderer

// Convert database format to UI format
const convertToUIProject = (dbProject: any): UIProject => ({
  id: dbProject.id,
  name: dbProject.name,
  status: dbProject.status,
  createdAt: formatRelativeTime(dbProject.created_at),
  steps: dbProject.steps.map((step: any) => ({
    id: step.id,
    title: step.title,
    status: step.status,
    content: step.content ? JSON.parse(step.content) : undefined
  }))
})

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diffInMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  
  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

export const useDatabase = () => {
  const [projects, setProjects] = useState<UIProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all projects from database via IPC
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dbProjects = await ipc.invoke('db-get-all-projects')
      const uiProjects = dbProjects.map(convertToUIProject)
      
      setProjects(uiProjects)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new project
  const createProject = useCallback(async (name: string = 'New Project'): Promise<UIProject> => {
    try {
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const projectData = {
        id: projectId,
        name,
        status: 'draft'
      }

      // Create project via IPC
      const dbProject = await ipc.invoke('db-create-project', projectData)
      
      // Convert to UI format
      const uiProject = convertToUIProject(dbProject)

      // Update local state
      setProjects(prev => [uiProject, ...prev])
      
      return uiProject
    } catch (err) {
      console.error('Failed to create project:', err)
      setError('Failed to create project')
      throw err
    }
  }, [])

  // Update a project
  const updateProject = useCallback(async (updatedProject: UIProject): Promise<void> => {
    try {
      // Update project basic info via IPC
      await ipc.invoke('db-update-project', updatedProject.id, {
        name: updatedProject.name,
        status: updatedProject.status
      })

      // Update steps via IPC
      for (const step of updatedProject.steps) {
        await ipc.invoke('db-update-step', step.id, {
          title: step.title,
          status: step.status,
          content: step.content ? JSON.stringify(step.content) : undefined
        })
      }

      // Update local state
      setProjects(prev => 
        prev.map(p => p.id === updatedProject.id ? updatedProject : p)
      )
    } catch (err) {
      console.error('Failed to update project:', err)
      setError('Failed to update project')
      throw err
    }
  }, [])

  // Delete a project
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      await ipc.invoke('db-delete-project', projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (err) {
      console.error('Failed to delete project:', err)
      setError('Failed to delete project')
      throw err
    }
  }, [])

  // Update step content without completing the step
  const updateStepContent = useCallback(async (projectId: string, stepId: string, content: any): Promise<void> => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      const updatedSteps = project.steps.map(step => {
        if (step.id === stepId) {
          return { ...step, content: content }
        }
        return step
      })

      const updatedProject = {
        ...project,
        steps: updatedSteps
      }

      await updateProject(updatedProject)
    } catch (err) {
      console.error('Failed to update step content:', err)
      setError('Failed to update step content')
      throw err
    }
  }, [projects, updateProject])

  // Complete a step and advance to next
  const completeStep = useCallback(async (projectId: string, stepId: string, data: any): Promise<void> => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      const updatedSteps = project.steps.map(step => {
        if (step.id === stepId) {
          return { ...step, status: 'completed' as const, content: data }
        }
        return step
      })

      // Find next step and set it to pending
      const currentStepIndex = project.steps.findIndex(s => s.id === stepId)
      if (currentStepIndex < project.steps.length - 1) {
        updatedSteps[currentStepIndex + 1].status = 'pending'
      }

      const updatedProject = {
        ...project,
        steps: updatedSteps,
        status: updatedSteps.every(s => s.status === 'completed') ? 'completed' as const : 'in-progress' as const
      }

      await updateProject(updatedProject)
    } catch (err) {
      console.error('Failed to complete step:', err)
      setError('Failed to complete step')
      throw err
    }
  }, [projects, updateProject])

  // Initialize data on mount
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Periodic save every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      try {
        await ipc.invoke('db-save')
      } catch (error) {
        console.warn('Periodic save failed:', error)
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(saveInterval)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save before unmounting
      ipc.invoke('db-save').catch((error: any) => {
        console.warn('Final save failed:', error)
      })
    }
  }, [])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    updateStepContent,
    completeStep,
    loadProjects
  }
} 