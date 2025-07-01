import { useState, useCallback, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { UploadIcon, XIcon, FileIcon, ImageIcon } from 'lucide-react'
import { AutoSaveProvider, AutoSaveField, AutoSaveIndicator } from '../AutoSave'
import type { AgentState } from '../../ai/analysisGraph'

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

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

interface InputAnalysisData {
  projectName: string
  textInput: string
  files: UploadedFile[]
  analysis?: AgentState
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
  const [files, setFiles] = useState<UploadedFile[]>(stepContent.files || [])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Sync component state when project changes
  useEffect(() => {
    setProjectName(project.name)
    const currentStep = project.steps.find(step => step.id.includes('step_1'))
    const stepContent = currentStep?.content || {}
    setTextInput(stepContent.textInput || '')
    setFiles(stepContent.files || [])
  }, [project.id]) // Only trigger when project ID changes

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }))
    
    setFiles(prev => [...prev, ...uploadedFiles])
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="size-4" />
    }
    return <FileIcon className="size-4" />
  }

  const ipc = (window as any).require('electron').ipcRenderer

  const handleSubmit = async () => {
    try {
      setIsAnalyzing(true)

      // Call AI analysis via IPC
      const result: AgentState = await ipc.invoke('ai-analyze-input', {
        textInput,
        files: files.map(f => ({ path: (f.file as any).path, name: f.name })) // Pass file paths
      })
      console.log('Analysis result:', result)

      // Prepare the complete data for this step
      const completeData: InputAnalysisData = {
        projectName,
        textInput,
        files,
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

  // Updated validation: requires project name AND (text input OR files)
  const isFormValid = projectName.trim() && (textInput.trim() || files.length > 0)

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
        textInput: text,
        files: files // Keep current files
      }
      
      console.log('Saving text input to step:', currentStep.id, text)
      await onStepUpdate(currentStep.id, updatedContent)
    }
  }

  // Auto-save when files change
  useEffect(() => {
    if (currentStep && onStepUpdate && files.length !== (stepContent.files || []).length) {
      const updatedContent = {
        ...stepContent,
        textInput: textInput,
        files: files
      }
      
      console.log('Auto-saving files to step:', currentStep.id, files.length)
      onStepUpdate(currentStep.id, updatedContent)
    }
  }, [files, currentStep, onStepUpdate, stepContent, textInput])

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

            {/* File Upload Area */}
            <div className="space-y-4">
              <label className="text-sm font-medium">
                Supporting Documents <span className="text-muted-foreground">(Optional)</span>
              </label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <UploadIcon className="size-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Drop your files here</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF, DOC, TXT, MD or images (max. 10MB each)
                </p>
                <Button variant="outline" asChild>
                  <label>
                    Select files
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif"
                    />
                  </label>
                </Button>
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Uploaded Files ({files.length})</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiles([])}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Remove all
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20"
                      >
                        <div className="text-muted-foreground">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <XIcon className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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