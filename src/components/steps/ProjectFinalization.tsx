import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { LoaderIcon, Wand2Icon, CopyIcon, CheckIcon, DownloadIcon, FileTextIcon } from 'lucide-react'
import type { UIProject } from '../../hooks/useDatabase'
import type { PRDResult } from '../../types/ai'

interface ProjectFinalizationProps {
  project: UIProject
  onStepUpdate: (projectId: string, stepId: string, content: any) => void
  onCompleteStep: (projectId: string, stepId: string, data: any) => void
}

/**
 * Converts PRD data to formatted markdown
 */
function generateMarkdownFromPRD(prdData: PRDResult): string {
  const { summary, personas, features, techStack, uiDesign, implementation } = prdData;
  
  let markdown = `# Product Requirements Document

## 1. Overview

### Elevator Pitch
${summary?.elevatorPitch || 'Not generated.'}

### Project Summary
${summary?.summary || 'Not generated.'}

---

## 2. Target Audience

${(personas || [])
  .map(
    (p: any, i: number) => {
      const goals = Array.isArray(p.goals) ? p.goals : [];
      const frustrations = Array.isArray(p.frustrations) ? p.frustrations : [];
      
      return `### Persona ${i + 1}: ${p.name || 'N/A'} (${p.role || 'N/A'})

**Goals:**
${goals.map((goal: string) => `- ${goal}`).join('\n')}

**Frustrations:**
${frustrations.map((frustration: string) => `- ${frustration}`).join('\n')}
`;
    }
  )
  .join('\n')}

---

## 3. Key Features

${(features || [])
  .map(
    (f: any) => `### ${f.name || 'N/A'} (Priority: ${f.priority || 'N/A'})
${f.description || 'No description.'}
`
  )
  .join('\n')}

---

## 4. Technical Architecture

- **Frontend:** ${techStack?.frontend || 'N/A'}
- **Backend:** ${techStack?.backend || 'N/A'}
- **Database:** ${techStack?.database || 'N/A'}
- **Hosting:** ${techStack?.hosting || 'N/A'}

---

## 5. UI/UX Design

### Core Principles
${(uiDesign?.principles || []).map(principle => `- ${principle}`).join('\n')}

### Color Palette
${Object.entries(uiDesign?.palette || {})
  .map(([name, value]) => `- **${name}:** ${value}`)
  .join('\n')}

### Key Screens
${(uiDesign?.screens || []).map((s: any) => `\n**${s.name || s}:** ${s.description || ''}`).join('')}
`;

  // Add implementation plan if it exists
  if (implementation) {
    markdown += `\n\n---

## 6. Implementation Plan
`;

    if (implementation.timeline && implementation.timeline.length > 0) {
      markdown += `\n### Timeline
${implementation.timeline.map((phase: any) => `
**${phase.phase}** (${phase.duration})  
${phase.description}  
*Deliverables:* ${Array.isArray(phase.deliverables) ? phase.deliverables.join(', ') : 'None specified'}
`).join('\n')}`;
    }

    if (implementation.resources && implementation.resources.length > 0) {
      markdown += `\n### Resource Allocation
${implementation.resources.map((resource: any) => `
**${resource.role}** - ${resource.commitment}  
*Responsibilities:* ${Array.isArray(resource.responsibilities) ? resource.responsibilities.join(', ') : 'None specified'}
`).join('\n')}`;
    }

    if (implementation.stakeholders && implementation.stakeholders.length > 0) {
      markdown += `\n### Stakeholder Communication
${implementation.stakeholders.map((stakeholder: any) => `
**${stakeholder.stakeholder}** - ${stakeholder.communication} (${stakeholder.frequency})  
*Updates:* ${Array.isArray(stakeholder.deliverables) ? stakeholder.deliverables.join(', ') : 'None specified'}
`).join('\n')}`;
    }
  }

  return markdown.trim()
}

/**
 * Downloads text content as a file
 */
function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ProjectFinalization({ project, onStepUpdate, onCompleteStep }: ProjectFinalizationProps) {
  const currentStep = project.steps.find(step => step.id.includes('step_5'))
  const prdStep = project.steps.find(step => step.id.includes('step_4'))

  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [gettingStartedPrompt, setGettingStartedPrompt] = useState<string>('')
  const [markdownContent, setMarkdownContent] = useState<string>('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedMarkdown, setCopiedMarkdown] = useState(false)

  const ipc = (window as any).require('electron').ipcRenderer

  // Generate markdown from PRD data
  useEffect(() => {
    const prdData = prdStep?.content?.prdData
    if (prdData) {
      const markdown = generateMarkdownFromPRD(prdData)
      setMarkdownContent(markdown)
    }
  }, [prdStep?.content?.prdData])

  // Load existing getting started prompt or generate new one
  useEffect(() => {
    const existingContent = currentStep?.content
    if (existingContent?.gettingStartedPrompt) {
      setGettingStartedPrompt(existingContent.gettingStartedPrompt)
    } else {
      // Auto-generate the prompt when the component loads
      const generatePrompt = async () => {
        const prdData = prdStep?.content?.prdData

        if (!prdData || !currentStep) {
          console.error('Missing required data for getting started prompt generation.')
          return
        }

        setIsGeneratingPrompt(true)

        try {
          const prompt = await ipc.invoke('ai-generate-getting-started', {
            prdData
          })
          
          setGettingStartedPrompt(prompt)
          
          // Save the prompt to step content
          const updatedContent = {
            ...currentStep.content,
            gettingStartedPrompt: prompt,
          }
          
          await onStepUpdate(project.id, currentStep.id, updatedContent)
        } catch (error) {
          console.error('Failed to generate getting started prompt:', error)
        } finally {
          setIsGeneratingPrompt(false)
        }
      }
      
      generatePrompt()
    }
  }, [currentStep?.content, prdStep?.content?.prdData, currentStep, project.id, onStepUpdate, ipc])

  const handleGeneratePrompt = async () => {
    const prdData = prdStep?.content?.prdData

    if (!prdData || !currentStep) {
      console.error('Missing required data for getting started prompt generation.')
      return
    }

    setIsGeneratingPrompt(true)

    try {
      const prompt = await ipc.invoke('ai-generate-getting-started', {
        prdData
      })
      
      setGettingStartedPrompt(prompt)
      
      // Save the prompt to step content
      const updatedContent = {
        ...currentStep.content,
        gettingStartedPrompt: prompt,
      }
      
      await onStepUpdate(project.id, currentStep.id, updatedContent)
    } catch (error) {
      console.error('Failed to generate getting started prompt:', error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(gettingStartedPrompt)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdownContent)
    setCopiedMarkdown(true)
    setTimeout(() => setCopiedMarkdown(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    const projectName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    downloadTextFile(markdownContent, `${projectName}_prd.md`, 'text/markdown')
  }

  const handleCompleteProject = async () => {
    if (!currentStep) return
    
    const finalData = {
      gettingStartedPrompt,
      markdownContent,
      completedAt: new Date().toISOString(),
    }
    
    await onCompleteStep(project.id, currentStep.id, finalData)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Step 5: Project Finalization</h2>
            <p className="text-muted-foreground">
              Your project is ready! Get your getting started guide and download your complete PRD.
            </p>
          </div>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Getting Started Prompt */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Getting Started Guide</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePrompt}
                  disabled={isGeneratingPrompt}
                >
                  {isGeneratingPrompt ? (
                    <LoaderIcon className="size-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2Icon className="size-3 mr-1" />
                  )}
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                  disabled={!gettingStartedPrompt}
                >
                  {copiedPrompt ? (
                    <CheckIcon className="size-3 mr-1" />
                  ) : (
                    <CopyIcon className="size-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
            
            {isGeneratingPrompt ? (
              <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
                <div className="text-center">
                  <LoaderIcon className="size-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Generating your getting started guide...</p>
                </div>
              </div>
            ) : (
              <Textarea
                value={gettingStartedPrompt}
                readOnly
                className="min-h-[300px] font-mono text-sm"
                placeholder="Your AI-generated getting started guide will appear here..."
              />
            )}
          </Card>

          {/* PRD Markdown Preview */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">PRD Markdown</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMarkdown}
                  disabled={!markdownContent}
                >
                  <DownloadIcon className="size-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  disabled={!markdownContent}
                >
                  {copiedMarkdown ? (
                    <CheckIcon className="size-3 mr-1" />
                  ) : (
                    <CopyIcon className="size-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
            
            {markdownContent ? (
              <Textarea
                value={markdownContent}
                readOnly
                className="min-h-[300px] font-mono text-sm"
                placeholder="Your PRD markdown will appear here..."
              />
            ) : (
              <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
                <div className="text-center">
                  <FileTextIcon className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Complete the PRD generation step to see the markdown preview
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Project Summary */}
        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckIcon className="size-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Project Complete!</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your Product Requirements Document has been successfully generated. Use the getting started guide to begin development 
                and download the markdown file for documentation purposes.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  )
} 