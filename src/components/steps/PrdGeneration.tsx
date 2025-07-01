import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { LoaderIcon, Wand2Icon } from 'lucide-react'
import type { UIProject } from '../../hooks/useDatabase'
import type { PRDResult, UserPersona, Feature } from '../../types/ai'

interface PrdGenerationProps {
  project: UIProject
  onStepUpdate: (projectId: string, stepId: string, content: any) => void
  onCompleteStep: (projectId: string, stepId: string, data: any) => void
}

/**
 * Normalizes the messy, nested, and inconsistent output from the AI into a clean,
 * predictable object that the component can safely render.
 */
function normalizePrdData(prdData: any): PRDResult {
  const summary = prdData.summary || {}

  // Personas
  let personas = [];
  if (prdData.personas?.personas && Array.isArray(prdData.personas.personas)) {
    personas = prdData.personas.personas;
  } else if (Array.isArray(prdData.personas)) {
    personas = prdData.personas;
  }
  personas = (personas || []).map((p: any, i: number) => ({
    name: p.name || `Persona ${i+1}`,
    role: p.role || 'N/A',
    goals: Array.isArray(p.goals) ? p.goals : (p.goals ? [p.goals] : []),
    frustrations: Array.isArray(p.frustrations) ? p.frustrations : (p.frustrations ? [p.frustrations] : []),
  }))

  // Features
  let features = [];
  if (prdData.features?.features && Array.isArray(prdData.features.features)) {
    features = prdData.features.features;
  } else if (Array.isArray(prdData.features)) {
    features = prdData.features;
  }
  features = (features || []).map((f: any) => ({
    name: f.name || 'N/A',
    description: f.description || '',
    priority: f.priority || 'N/A',
  }))

  // Tech Stack
  const techStack = {
    frontend: prdData.techStack?.frontend || 'Not specified',
    backend: prdData.techStack?.backend || 'Not specified',
    database: prdData.techStack?.database || 'Not specified',
    hosting: prdData.techStack?.hosting || 'Not specified',
  }

  // UI Design
  const uiDesign = prdData.uiDesign || {}
  const rawPrinciples = uiDesign.principles;
  const normalizedPrinciples = Array.isArray(rawPrinciples)
    ? rawPrinciples
    : (typeof rawPrinciples === 'string' ? [rawPrinciples] : []);
  const rawPalette = uiDesign.palette;
  const normalizedPalette = typeof rawPalette === 'string'
    ? { colors: rawPalette }
    : (rawPalette || {});
  // Screens: always array of {name, description}
  let screens = [];
  if (Array.isArray(uiDesign.screens)) {
    screens = uiDesign.screens.map((s: any) =>
      typeof s === 'string' ? { name: s, description: '' } : { name: s.name || '', description: s.description || '' }
    );
  } else if (typeof uiDesign.screens === 'string') {
    screens = uiDesign.screens.split(/\n|,|;/).map((s: string) => ({ name: s.trim(), description: '' }));
  }

  // File Structure: show only top-level folders/files as a tree string
  let fileTree = '';
  if (typeof prdData.fileStructure?.fileTree === 'object') {
    fileTree = Object.keys(prdData.fileStructure.fileTree).join('\n');
  } else if (typeof prdData.fileStructure?.fileTree === 'string') {
    // If it's a JSON string, try to parse and show top-level
    try {
      const obj = JSON.parse(prdData.fileStructure.fileTree);
      fileTree = Object.keys(obj).join('\n');
    } catch {
      fileTree = prdData.fileStructure.fileTree;
    }
  } else {
    fileTree = 'Not generated.';
  }

  return {
    summary: {
      elevatorPitch: summary.elevatorPitch || '',
      summary: summary.summary || '',
    },
    personas,
    features,
    techStack,
    uiDesign: {
      principles: normalizedPrinciples,
      palette: normalizedPalette,
      screens,
    },
    fileStructure: {
      fileTree,
    },
  }
}

function formatPrd(prdData: PRDResult): string {
  // This function now expects clean, normalized data.
  const { summary, personas, features, techStack, uiDesign, fileStructure } = prdData;
  
  let output = `
# Product Requirements Document

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
      // Handle goals - could be string or array
      const goals = Array.isArray(p.goals) ? p.goals : (typeof p.goals === 'string' ? [p.goals] : []);
      // Handle frustrations - could be string or array  
      const frustrations = Array.isArray(p.frustrations) ? p.frustrations : (typeof p.frustrations === 'string' ? [p.frustrations] : []);
      
      return `
### Persona ${i + 1}: ${p.name || 'N/A'} (${p.role || 'N/A'})
**Goals:**
- ${goals.join('\n- ')}

**Frustrations:**
- ${frustrations.join('\n- ')}
`;
    }
  )
  .join('\n')}

---

## 3. Key Features
${(features || [])
  .map(
    (f: any) => `
### ${f.name || 'N/A'} (Priority: ${f.priority || 'N/A'})
${f.description || 'No description.'}
`
  )
  .join('\n')}

---

## 4. Technical Architecture
### Frontend: ${techStack?.frontend || 'N/A'}
### Backend: ${techStack?.backend || 'N/A'}
### Database: ${techStack?.database || 'N/A'}
### Hosting: ${techStack?.hosting || 'N/A'}

---

## 5. UI/UX Design
### Core Principles
- ${(uiDesign?.principles || []).join('\n- ')}

### Color Palette
${Object.entries(uiDesign?.palette || {})
  .map(([name, value]) => `- **${name}:** ${value}`)
  .join('\n')}

### Key Screens
${(uiDesign?.screens || []).map((s: any) => `\n**${s.name || s}:** ${s.description || ''}`).join('')}

---

## 6. Proposed File Structure
\`\`\`
${fileStructure?.fileTree || 'Not generated.'}
\`\`\`
`
  return output.trim()
}

export function PrdGeneration({ project, onStepUpdate, onCompleteStep }: PrdGenerationProps) {
  const currentStep = project.steps.find(step => step.id.includes('step_4'))
  const refinementStep = project.steps.find(step => step.id.includes('step_3'))
  const analysisStep = project.steps.find(step => step.id.includes('step_1'))

  const [isLoading, setIsLoading] = useState(false)
  const [prdContent, setPrdContent] = useState(currentStep?.content?.prdText || '')

  const ipc = (window as any).require('electron').ipcRenderer

  // Sync component state when project changes
  useEffect(() => {
    const currentStep = project.steps.find(step => step.id.includes('step_4'))
    const stepContent = currentStep?.content || {}
    setPrdContent(stepContent.prdText || '')
  }, [project.id]) // Only trigger when project ID changes

  const handleGenerate = async () => {
    const refinedIdea = refinementStep?.content?.refinedIdea
    const originalContext = analysisStep?.content?.textInput
    const refinedTechStack = refinementStep?.content?.refinedTechStack

    if (!refinedIdea || !currentStep) {
      console.error('Missing refined idea or current step.')
      return
    }

    setIsLoading(true)
    setPrdContent('')

    try {
      const result: PRDResult = await ipc.invoke('ai-generate-prd', {
        refinedIdea,
        originalContext,
        refinedTechStack,
      })
      
      const normalizedData = normalizePrdData(result)
      const formattedText = formatPrd(normalizedData)
      setPrdContent(formattedText)

      const updatedContent = {
        ...currentStep.content,
        prdData: normalizedData,
        prdText: formattedText,
      }
      await onStepUpdate(project.id, currentStep.id, updatedContent)
      
      // Mark this step as completed, which will update the project status to "completed"
      await onCompleteStep(project.id, currentStep.id, updatedContent)
    } catch (error) {
      console.error('Failed to generate PRD:', error)
      setPrdContent('// An error occurred while generating the PRD. Please check the logs.\n\n' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!prdContent && !isLoading) {
      handleGenerate()
    }
  }, [])

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Step 4: PRD Generation</h2>
            <p className="text-muted-foreground">
              The AI has generated the full Product Requirements Document based on your refined idea.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <LoaderIcon className="size-4 mr-2 animate-spin" />
            ) : (
              <Wand2Icon className="size-4 mr-2" />
            )}
            Regenerate PRD
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 border rounded-lg bg-muted/20">
            <LoaderIcon className="size-10 text-primary animate-spin mb-4" />
            <p className="font-semibold text-lg">Generating your PRD...</p>
            <p className="text-sm text-muted-foreground">This may take a minute. Please wait.</p>
          </div>
        ) : (
          <Textarea
            value={prdContent}
            readOnly
            className="h-[600px] resize-none font-mono text-sm"
            placeholder="Your generated PRD will appear here..."
          />
        )}
      </div>
    </Card>
  )
}
