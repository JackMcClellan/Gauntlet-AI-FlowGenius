import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { ThemeProvider, useTheme } from './components/theme-provider'
import { MoonIcon, SunIcon, PlusIcon, FileTextIcon, FolderIcon, LoaderIcon, TrashIcon } from 'lucide-react'
import React, { useState } from 'react'
import { InputAnalysis } from './components/steps/InputAnalysis'
import { IdeaGeneration } from './components/steps/IdeaGeneration'
import { IdeaRefinement } from './components/steps/IdeaRefinement'
import { PrdGeneration } from './components/steps/PrdGeneration'
import { useDatabase, UIProject } from './hooks/useDatabase'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './components/ui/alert-dialog'

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

function ProjectSidebar({ projects, currentProject, onSelectProject, onNewProject, onDeleteProject, loading }: {
  projects: UIProject[]
  currentProject: UIProject | null
  onSelectProject: (project: UIProject) => void
  onNewProject: () => void
  onDeleteProject: (projectId: string) => void
  loading: boolean
}) {
  return (
    <div className="w-80 border-r bg-muted/10 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Projects</h3>
          <Button size="sm" onClick={onNewProject} disabled={loading}>
            <PlusIcon className="size-4 mr-2" />
            New
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            <LoaderIcon className="size-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FolderIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No projects yet</p>
            <p className="text-xs">Create your first project to get started</p>
          </div>
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              className={`p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                currentProject?.id === project.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectProject(project)}
            >
              <div className="flex items-start gap-3">
                <FileTextIcon className="size-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{project.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      project.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {project.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {project.createdAt}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TrashIcon className="size-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{project.name}"? This will permanently remove all project data including steps, analysis results, and PRD content. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteProject(project.id)}>
                              Delete Project
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function ProjectWorkspace({ project, onCompleteStep, onProjectUpdate, onStepUpdate }: { 
  project: UIProject | null
  onCompleteStep: (projectId: string, stepId: string, data: unknown) => void
  onProjectUpdate: (projectId: string, updates: { name?: string }) => void
  onStepUpdate: (projectId: string, stepId: string, content: any) => void
}) {
  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome to SpecForge
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Turn your ideas into complete, professional-grade Product Requirements Documents.
            </p>
          </div>
          <div className="text-muted-foreground">
            <p className="mb-2">Create a new project to get started</p>
            <p className="text-sm">Upload files, enter prompts, or describe your idea</p>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = project.steps.find(step => 
    step.status === 'pending' || step.status === 'in-progress'
  ) || project.steps[project.steps.length - 1] // Fall back to the last step if all are completed



  const handleProjectUpdate = (updates: { name?: string }) => {
    onProjectUpdate(project.id, updates)
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">Project ID: {project.id}</p>
        </div>

        {/* Render current step component */}
        {currentStep?.id.includes('step_1') && (
          <InputAnalysis 
            project={project}
            onComplete={(data) => onCompleteStep(project.id, currentStep.id, data)}
            onProjectUpdate={handleProjectUpdate}
            onStepUpdate={(stepId, content) => onStepUpdate(project.id, stepId, content)}
          />
        )}
        
        {currentStep?.id.includes('step_2') && (
          <IdeaGeneration 
            project={project}
            onCompleteStep={onCompleteStep}
            onStepUpdate={onStepUpdate}
          />
        )}
        
        {currentStep?.id.includes('step_3') && (
          <IdeaRefinement 
            project={project}
            onCompleteStep={onCompleteStep}
            onStepUpdate={onStepUpdate}
          />
        )}
        
        {currentStep?.id.includes('step_4') && (
          <PrdGeneration 
            project={project} 
            onStepUpdate={onStepUpdate}
            onCompleteStep={onCompleteStep}
          />
        )}

        {/* Fallback for debugging */}
        {!currentStep && (
          <Card className="p-6">
            <h3 className="font-semibold mb-2 text-red-600">Debug: No Current Step Found</h3>
            <p className="text-muted-foreground mb-4">
              No current step could be determined. This might indicate a data issue.
            </p>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify({ 
                projectId: project.id,
                projectName: project.name,
                steps: project.steps.map(s => ({ id: s.id, title: s.title, status: s.status }))
              }, null, 2)}
            </pre>
          </Card>
        )}

        {/* Fallback for unknown step */}
        {currentStep && !currentStep.id.includes('step_1') && !currentStep.id.includes('step_2') && !currentStep.id.includes('step_3') && !currentStep.id.includes('step_4') && (
          <Card className="p-6">
            <h3 className="font-semibold mb-2 text-red-600">Debug: Unknown Step</h3>
            <p className="text-muted-foreground mb-4">
              Current step doesn't match any known step pattern.
            </p>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(currentStep, null, 2)}
            </pre>
          </Card>
        )}

        {/* Progress Overview */}
        <div className="mt-12 space-y-4">
          <h3 className="font-semibold text-lg">Progress Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.steps.map((step, index) => (
              <Card key={step.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    step.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    completeStep,
    updateProject,
    updateStepContent,
    deleteProject
  } = useDatabase()
  
  const [currentProject, setCurrentProject] = useState<UIProject | null>(null)

  // Update current project when projects change
  React.useEffect(() => {
    if (projects.length === 0) {
      // No projects left, clear selection
      setCurrentProject(null)
    } else if (!currentProject) {
      // No project selected but projects exist, select the first one
      setCurrentProject(projects[0])
    } else {
      // Check if current project still exists
      const updated = projects.find(p => p.id === currentProject.id)
      if (updated) {
        // Current project still exists, update with latest data
        setCurrentProject(updated)
      } else {
        // Current project was deleted, select the first available project
        setCurrentProject(projects[0])
      }
    }
  }, [projects]) // Remove currentProject dependency to avoid override loops

  const handleNewProject = async () => {
    try {
      const newProject = await createProject()
      setCurrentProject(newProject)
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  const handleSelectProject = (project: UIProject) => {
    console.log('Selecting project:', project.name, project.id)
    setCurrentProject(project)
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      // If we deleted the current project, clear the selection
      if (currentProject?.id === projectId) {
        setCurrentProject(null)
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const handleCompleteStep = async (projectId: string, stepId: string, data: unknown) => {
    try {
      await completeStep(projectId, stepId, data)
    } catch (err) {
      console.error('Failed to complete step:', err)
    }
  }

  const handleProjectUpdate = async (projectId: string, updates: { name?: string }) => {
    try {
      // Find the current project
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      // Create updated project object
      const updatedProject = {
        ...project,
        ...updates
      }

      await updateProject(updatedProject)
    } catch (err) {
      console.error('Failed to update project:', err)
    }
  }

  const handleStepUpdate = async (projectId: string, stepId: string, content: any) => {
    try {
      await updateStepContent(projectId, stepId, content)
    } catch (err) {
      console.error('Failed to update step content:', err)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Database Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div data-slot="app" className="min-h-screen bg-background flex flex-col">
        <header className="border-b">
          <div data-slot="header" className="container mx-auto max-w-none flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-bold">SpecForge</h1>
            <ThemeToggle />
          </div>
        </header>
        
        <div className="flex-1 flex">
          <ProjectSidebar 
            projects={projects}
            currentProject={currentProject}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            loading={loading}
          />
          <ProjectWorkspace 
            project={currentProject} 
            onCompleteStep={handleCompleteStep}
            onProjectUpdate={handleProjectUpdate}
            onStepUpdate={handleStepUpdate}
          />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App 