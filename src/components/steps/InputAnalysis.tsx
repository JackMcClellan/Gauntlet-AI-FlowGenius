import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AutoSaveProvider, AutoSaveField, AutoSaveIndicator } from '@/components/AutoSave'
import { getDefaultTechStack } from '@/components/Settings'
import type { AgentState } from '@/ai/analysisGraph'

interface Project {
  id: string
  name: string
  status: 'draft' | 'in-progress' | 'completed'
  createdAt: string
  steps: ProjectStep[]
}

interface ProjectStep {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
  content?: any
}

interface InputAnalysisData {
  projectName: string
  textInput: string
  analysis?: Partial<AgentState>
}

export function InputAnalysis({ 
  project, 
  onComplete,
  onProjectUpdate,
  onStepUpdate
}: { 
  project: Project
  onComplete: (data: InputAnalysisData) => void 
  onProjectUpdate?: (updates: { name?: string }) => void
  onStepUpdate?: (stepId: string, content: any) => void
}) {
  // Get the current step (Input Analysis is step 1)
  const currentStep = project.steps.find(step => step.id.includes('step_1'))
  const stepContent = currentStep?.content || {}
  
  const [projectName, setProjectName] = useState(project.name)
  const [textInput, setTextInput] = useState(stepContent.textInput || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Sync component state when project changes
  useEffect(() => {
    setProjectName(project.name)
    const currentStep = project.steps.find(step => step.id.includes('step_1'))
    const stepContent = currentStep?.content || {}
    setTextInput(stepContent.textInput || '')
  }, [project.id]) // Only trigger when project ID changes

  const ipc = (window as any).require('electron').ipcRenderer

  const handleSubmit = async () => {
    try {
      setIsAnalyzing(true)

      // Get user's default tech stack preferences
      const defaultTechStack = await getDefaultTechStack()

      // Call AI analysis via IPC, including default tech stack
      const result: Partial<AgentState> = await ipc.invoke('analyze-project', {
        textInput,
        defaultTechStack
      })
      console.log('Analysis result:', result)

      // Prepare the complete data for this step
      const completeData: InputAnalysisData = {
        projectName,
        textInput,
        analysis: result
      }
      
      // Notify parent component that this step is complete, which will save and advance the state
      onComplete(completeData)

    } catch (err) {
      console.error('Analysis failed:', err)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Updated validation: requires project name AND text input
  const isFormValid = projectName.trim() && textInput.trim()

  // Auto-save handler for project name
  const handleNameSave = async (name: string) => {
    if (onProjectUpdate) {
      await onProjectUpdate({ name })
    }
  }

  // Auto-save handler for text input - save to step content
  const handleTextInputSave = async (text: string) => {
    if (currentStep && onStepUpdate) {
      const updatedContent = {
        ...stepContent,
        textInput: text
      }
      
      console.log('Saving text input to step:', currentStep.id, text)
      await onStepUpdate(currentStep.id, updatedContent)
    }
  }

  return (
    <AutoSaveProvider defaultDebounceMs={1000}>
      <div className="space-y-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Step 1: Input Analysis</h2>
                <p className="text-muted-foreground">
                  Start by defining your project and providing the initial requirements or ideas.
                </p>
              </div>
              
              {/* Save Status Indicator */}
              <AutoSaveIndicator />
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name
              </label>
              <AutoSaveField
                fieldKey="project-name"
                value={projectName}
                onSave={handleNameSave}
              >
                <Input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter your project name..."
                />
              </AutoSaveField>
            </div>

            {/* Text Input Area */}
            <div className="space-y-2">
              <label htmlFor="text-input" className="text-sm font-medium">
                Project Requirements & Ideas
              </label>
              <AutoSaveField
                fieldKey="text-input"
                value={textInput}
                onSave={handleTextInputSave}
                debounceMs={2000} // Save after 2 seconds of no typing
              >
                <Textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="h-48 resize-none"
                  placeholder="Describe your project idea, requirements, features, or any other relevant information..."
                />
              </AutoSaveField>
              <p className="text-xs text-muted-foreground">
                Provide as much detail as possible about what you want to build.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isAnalyzing}
                size="lg"
                className="px-8"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Input'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AutoSaveProvider>
  )
} 