import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { AutoSaveProvider, AutoSaveField, AutoSaveIndicator } from '../AutoSave'
import { getDefaultTechStack } from '../Settings'
import type { UIProject } from '../../hooks/useDatabase'
import type { TechStackRecommendation } from '../../types/ai'

interface IdeaRefinementProps {
  project: UIProject
  onCompleteStep: (projectId: string, stepId: string, data: any) => void
  onStepUpdate: (projectId: string, stepId: string, content: any) => void
}

export function IdeaRefinement({ project, onCompleteStep, onStepUpdate }: IdeaRefinementProps) {
  const currentStep = project.steps.find(step => step.id.includes('step_3'))
  const ideaGenStep = project.steps.find(step => step.id.includes('step_2'))
  
  const initialIdea = ideaGenStep?.content?.selectedIdea || ''
  const initialTechStack: TechStackRecommendation = ideaGenStep?.content?.analysis?.techStack || {
    frontend: '',
    backend: '',
    database: '',
    hosting: ''
  }
  const stepContent = currentStep?.content || {}

  const [refinedIdea, setRefinedIdea] = useState(stepContent.refinedIdea || initialIdea)
  const [refinedTechStack, setRefinedTechStack] = useState<TechStackRecommendation>(stepContent.refinedTechStack || initialTechStack)
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false)

  const handleTechStackChange = (field: string, value: string) => {
    setRefinedTechStack((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleAutopopulateFromPreferred = async () => {
    setIsLoadingDefaults(true)
    try {
      const defaultTechStack = await getDefaultTechStack()
      
      // Only override fields that have values in the default settings
      setRefinedTechStack(prev => ({
        frontend: defaultTechStack.frontend || prev.frontend,
        backend: defaultTechStack.backend || prev.backend,
        database: defaultTechStack.database || prev.database,
        hosting: defaultTechStack.hosting || prev.hosting,
        // Note: additional field from settings is not used in TechStackRecommendation
      }))
    } catch (error) {
      console.error('Failed to load default tech stack:', error)
    } finally {
      setIsLoadingDefaults(false)
    }
  }
  
  const handleSave = async () => {
    if (currentStep && onStepUpdate) {
      const updatedContent = {
        ...stepContent,
        refinedIdea,
        refinedTechStack,
      }
      await onStepUpdate(project.id, currentStep.id, updatedContent)
    }
  }

  const handleGeneratePrd = async () => {
    if (currentStep) {
        // First, ensure the latest text is saved.
        await handleSave();
        // Then, complete the step.
        onCompleteStep(project.id, currentStep.id, { ...currentStep.content, refinedIdea, refinedTechStack });
    }
  }

  if (!initialIdea) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Idea Refinement</h3>
        <p className="text-muted-foreground">
          No idea selected. Please go back to the "Idea Generation" step and select an idea to refine.
        </p>
      </Card>
    )
  }

  return (
    <AutoSaveProvider defaultDebounceMs={1000}>
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Step 3: Idea Refinement</h2>
              <p className="text-muted-foreground">
                Refine the selected idea. The AI will use this text to generate the full PRD.
              </p>
            </div>
            <AutoSaveIndicator />
          </div>

          <AutoSaveField
            fieldKey="refined-data"
            value={JSON.stringify({ refinedIdea, refinedTechStack })}
            onSave={handleSave}
            debounceMs={1500}
          >
            <>
              <div className="space-y-2">
                <label htmlFor="refined-idea" className="text-sm font-medium">
                  Your Refined Idea
                </label>
                <Textarea
                  id="refined-idea"
                  value={refinedIdea}
                  onChange={(e) => setRefinedIdea(e.target.value)}
                  className="h-48 resize-y"
                  placeholder="Refine your idea here..."
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Your Refined Tech Stack</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAutopopulateFromPreferred}
                    disabled={isLoadingDefaults}
                  >
                    {isLoadingDefaults ? 'Loading...' : 'Autopopulate from Preferred'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label htmlFor="frontend" className="text-xs text-muted-foreground">Frontend</label>
                        <Input id="frontend" value={typeof refinedTechStack.frontend === 'string' ? refinedTechStack.frontend : ''} onChange={(e) => handleTechStackChange('frontend', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="backend" className="text-xs text-muted-foreground">Backend</label>
                        <Input id="backend" value={typeof refinedTechStack.backend === 'string' ? refinedTechStack.backend : ''} onChange={(e) => handleTechStackChange('backend', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="database" className="text-xs text-muted-foreground">Database</label>
                        <Input id="database" value={typeof refinedTechStack.database === 'string' ? refinedTechStack.database : ''} onChange={(e) => handleTechStackChange('database', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="hosting" className="text-xs text-muted-foreground">Hosting</label>
                        <Input id="hosting" value={typeof refinedTechStack.hosting === 'string' ? refinedTechStack.hosting : ''} onChange={(e) => handleTechStackChange('hosting', e.target.value)} />
                    </div>
                </div>
              </div>
            </>
          </AutoSaveField>
          
          <p className="text-xs text-muted-foreground -mt-4">
            Your changes are saved automatically.
          </p>

          <div className="flex justify-end pt-4">
            <Button onClick={handleGeneratePrd} size="lg">
              Generate PRD
            </Button>
          </div>
        </div>
      </Card>
    </AutoSaveProvider>
  )
} 