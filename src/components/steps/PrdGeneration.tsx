import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { LoaderIcon, Wand2Icon, PlusIcon, XIcon, ArrowRightIcon } from 'lucide-react'
import type { UIProject } from '../../hooks/useDatabase'
import type { PRDResult, Feature, ImplementationPlan } from '../../types/ai'

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

  // Implementation Plan
  let implementation: ImplementationPlan | undefined = undefined;
  if (prdData.implementation) {
    const timeline = Array.isArray(prdData.implementation.timeline) 
      ? prdData.implementation.timeline.map((phase: any) => ({
          phase: phase.phase || '',
          duration: phase.duration || '',
          description: phase.description || '',
          deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : (phase.deliverables ? [phase.deliverables] : []),
        }))
      : [];

    const resources = Array.isArray(prdData.implementation.resources)
      ? prdData.implementation.resources.map((resource: any) => ({
          role: resource.role || '',
          commitment: resource.commitment || '',
          responsibilities: Array.isArray(resource.responsibilities) ? resource.responsibilities : (resource.responsibilities ? [resource.responsibilities] : []),
        }))
      : [];

    const stakeholders = Array.isArray(prdData.implementation.stakeholders)
      ? prdData.implementation.stakeholders.map((stakeholder: any) => ({
          stakeholder: stakeholder.stakeholder || '',
          communication: stakeholder.communication || '',
          frequency: stakeholder.frequency || '',
          deliverables: Array.isArray(stakeholder.deliverables) ? stakeholder.deliverables : (stakeholder.deliverables ? [stakeholder.deliverables] : []),
        }))
      : [];

    implementation = {
      timeline,
      resources,
      stakeholders,
    };
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
    implementation,
  }
}

function formatPrd(prdData: PRDResult): string {
  const { summary, personas, features, techStack, uiDesign } = prdData;
  
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
      const goals = Array.isArray(p.goals) ? p.goals : (typeof p.goals === 'string' ? [p.goals] : []);
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
${prdData.implementation ? `

---

## 6. Implementation Plan

### Timeline
${(prdData.implementation.timeline || []).map((phase: any) => `
**${phase.phase}** (${phase.duration})
${phase.description}
Deliverables: ${Array.isArray(phase.deliverables) ? phase.deliverables.join(', ') : 'None specified'}
`).join('\n')}

### Resource Allocation
${(prdData.implementation.resources || []).map((resource: any) => `
**${resource.role}** - ${resource.commitment}
Responsibilities: ${Array.isArray(resource.responsibilities) ? resource.responsibilities.join(', ') : 'None specified'}
`).join('\n')}

### Stakeholder Communication
${(prdData.implementation.stakeholders || []).map((stakeholder: any) => `
**${stakeholder.stakeholder}** - ${stakeholder.communication} (${stakeholder.frequency})
Updates: ${Array.isArray(stakeholder.deliverables) ? stakeholder.deliverables.join(', ') : 'None specified'}
`).join('\n')}` : ''}
`
  return output.trim()
}

export function PrdGeneration({ project, onStepUpdate, onCompleteStep }: PrdGenerationProps) {
  const currentStep = project.steps.find(step => step.id.includes('step_4'))
  const refinementStep = project.steps.find(step => step.id.includes('step_3'))
  const analysisStep = project.steps.find(step => step.id.includes('step_1'))

  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({})
  const [prdData, setPrdData] = useState<PRDResult | null>(null)

  const ipc = (window as any).require('electron').ipcRenderer

  // Load existing data or generate new PRD when project changes
  useEffect(() => {
    const currentStep = project.steps.find(step => step.id.includes('step_4'))
    const stepContent = currentStep?.content || {}
    
    if (stepContent.prdData) {
      // Load existing PRD data
      setPrdData(stepContent.prdData)
    } else if (!isLoading.all) {
      // No existing data and not already loading - generate new PRD
      handleGenerateAll()
    }
  }, [project.id])

  const updatePrdData = async (newData: PRDResult) => {
    if (!currentStep) return
    
    const formattedText = formatPrd(newData)
    const updatedContent = {
      ...currentStep.content,
      prdData: newData,
      prdText: formattedText,
    }
    
    setPrdData(newData)
    // NOTE: This only saves the content, does NOT complete the step or navigate to step 5
    await onStepUpdate(project.id, currentStep.id, updatedContent)
  }

  const handleGenerateAll = async () => {
    const refinedIdea = refinementStep?.content?.refinedIdea
    const originalContext = analysisStep?.content?.textInput
    const refinedTechStack = refinementStep?.content?.refinedTechStack

    if (!refinedIdea || !currentStep) {
      console.error('Missing refined idea or current step.')
      return
    }

    setIsLoading({ all: true })

    try {
      const result: PRDResult = await ipc.invoke('ai-generate-prd', {
        refinedIdea,
        originalContext,
        refinedTechStack,
      })
      
      const normalizedData = normalizePrdData(result)
      // NOTE: This only saves the PRD data, does NOT complete the step or navigate to step 5
      await updatePrdData(normalizedData)
    } catch (error) {
      console.error('Failed to generate PRD:', error)
    } finally {
      setIsLoading({})
    }
  }

  const handleRegenerateSection = async (sectionKey: string) => {
    const refinedIdea = refinementStep?.content?.refinedIdea
    const originalContext = analysisStep?.content?.textInput
    const refinedTechStack = refinementStep?.content?.refinedTechStack

    if (!refinedIdea || !currentStep || !prdData) {
      console.error('Missing required data for regeneration.')
      return
    }

    setIsLoading({ [sectionKey]: true })

    try {
      const result = await ipc.invoke('ai-regenerate-prd-section', {
        refinedIdea,
        originalContext,
        refinedTechStack,
        sectionKey,
      })
      
      console.log(`AI ${sectionKey} Response:`, result)
      
      const normalizedResult = normalizePrdData({ [sectionKey]: result })
      
      console.log(`Normalized ${sectionKey}:`, normalizedResult[sectionKey as keyof PRDResult])
      
      const updatedPrdData = {
        ...prdData,
        [sectionKey]: normalizedResult[sectionKey as keyof PRDResult],
      }
      
      // NOTE: This only saves the regenerated section data, does NOT complete the step or navigate to step 5
      await updatePrdData(updatedPrdData)
    } catch (error) {
      console.error(`Failed to regenerate ${sectionKey}:`, error)
    } finally {
      setIsLoading({ [sectionKey]: false })
    }
  }

  const handleSummaryChange = (field: 'elevatorPitch' | 'summary', value: string) => {
    if (!prdData) return
    const updatedData = {
      ...prdData,
      summary: {
        ...prdData.summary,
        [field]: value,
      },
    }
    updatePrdData(updatedData)
  }

  const handleFeatureChange = (index: number, field: string, value: string) => {
    if (!prdData) return
    const updatedFeatures = [...prdData.features]
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value,
    }
    const updatedData = {
      ...prdData,
      features: updatedFeatures,
    }
    updatePrdData(updatedData)
  }

  const handleDeleteFeature = (index: number) => {
    if (!prdData) return
    const updatedFeatures = prdData.features.filter((_, i) => i !== index)
    const updatedData = {
      ...prdData,
      features: updatedFeatures,
    }
    updatePrdData(updatedData)
  }

  const handleAddFeature = () => {
    if (!prdData) return
    const newFeature: Feature = {
      name: 'New Feature',
      description: '',
      priority: 'Medium' as const,
    }
    const updatedData = {
      ...prdData,
      features: [...prdData.features, newFeature],
    }
    updatePrdData(updatedData)
  }

  const handlePersonaChange = (index: number, field: string, value: string | string[]) => {
    if (!prdData) return
    const updatedPersonas = [...prdData.personas]
    updatedPersonas[index] = {
      ...updatedPersonas[index],
      [field]: value,
    }
    const updatedData = {
      ...prdData,
      personas: updatedPersonas,
    }
    updatePrdData(updatedData)
  }

  const handleDeletePersona = (index: number) => {
    if (!prdData) return
    const updatedPersonas = prdData.personas.filter((_, i) => i !== index)
    const updatedData = {
      ...prdData,
      personas: updatedPersonas,
    }
    updatePrdData(updatedData)
  }

  const handleAddPersona = () => {
    if (!prdData) return
    const newPersona = {
      name: 'New Persona',
      role: '',
      goals: [],
      frustrations: [],
    }
    const updatedData = {
      ...prdData,
      personas: [...prdData.personas, newPersona],
    }
    updatePrdData(updatedData)
  }

  const handleTechStackChange = (field: string, value: string) => {
    if (!prdData) return
    const updatedData = {
      ...prdData,
      techStack: {
        ...prdData.techStack,
        [field]: value,
      },
    }
    updatePrdData(updatedData)
  }

  const handleUIDesignChange = (field: string, value: any) => {
    if (!prdData) return
    const updatedData = {
      ...prdData,
      uiDesign: {
        ...prdData.uiDesign,
        [field]: value,
      },
    }
    updatePrdData(updatedData)
  }

  const handleGenerateImplementation = async () => {
    const refinedIdea = refinementStep?.content?.refinedIdea
    const originalContext = analysisStep?.content?.textInput
    const refinedTechStack = refinementStep?.content?.refinedTechStack

    if (!refinedIdea || !currentStep || !prdData) {
      console.error('Missing required data for implementation generation.')
      return
    }

    setIsLoading({ implementation: true })

    try {
      const result = await ipc.invoke('ai-regenerate-prd-section', {
        refinedIdea,
        originalContext,
        refinedTechStack,
        sectionKey: 'implementation',
      })
      
      console.log('AI Implementation Response:', result)
      
      // Normalize the implementation data
      const normalizedImplementation = normalizePrdData({ implementation: result }).implementation
      
      console.log('Normalized Implementation:', normalizedImplementation)
      
      const updatedData = {
        ...prdData,
        implementation: normalizedImplementation,
      }
      
      await updatePrdData(updatedData)
    } catch (error) {
      console.error('Failed to generate implementation plan:', error)
    } finally {
      setIsLoading({ implementation: false })
    }
  }

  const handleImplementationChange = (field: string, value: any) => {
    if (!prdData || !prdData.implementation) return
    const updatedData = {
      ...prdData,
      implementation: {
        ...prdData.implementation,
        [field]: value,
      },
    }
    updatePrdData(updatedData)
  }

  const handleProceedToNext = async () => {
    if (!currentStep || !prdData) return
    
    // NOTE: This is the ONLY function that completes the step and navigates to step 5
    // It is only triggered by the "Next Step" button, not by any data changes
    await onCompleteStep(project.id, currentStep.id, {
      prdData,
      prdText: formatPrd(prdData),
    })
  }

     const handleGenerateImplementationSection = async (sectionKey: 'timeline' | 'resources' | 'stakeholders') => {
     const refinedIdea = refinementStep?.content?.refinedIdea
     const originalContext = analysisStep?.content?.textInput
     const refinedTechStack = refinementStep?.content?.refinedTechStack

     if (!refinedIdea || !currentStep || !prdData) {
       console.error('Missing required data for implementation section generation.')
       return
     }

     setIsLoading({ [`implementation${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`]: true })

     try {
       const result = await ipc.invoke('ai-regenerate-prd-section', {
         refinedIdea,
         originalContext,
         refinedTechStack,
         sectionKey: `implementation${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`,
       })
       
       console.log(`AI Implementation ${sectionKey} Response:`, result)
       
       // The result is already the normalized section data
       const normalizedSection = result
       
       console.log(`Normalized Implementation ${sectionKey}:`, normalizedSection)
       
       const currentImplementation = prdData.implementation || {
         timeline: [],
         resources: [],
         stakeholders: [],
       }
       
       const updatedData = {
         ...prdData,
         implementation: {
           timeline: currentImplementation.timeline,
           resources: currentImplementation.resources,
           stakeholders: currentImplementation.stakeholders,
           [sectionKey]: normalizedSection,
         },
       }
       
       await updatePrdData(updatedData)
     } catch (error) {
       console.error(`Failed to generate implementation ${sectionKey}:`, error)
     } finally {
       setIsLoading({ [`implementation${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`]: false })
     }
   }

     const handleRegenerateImplementationSection = async (sectionKey: 'timeline' | 'resources' | 'stakeholders') => {
     const refinedIdea = refinementStep?.content?.refinedIdea
     const originalContext = analysisStep?.content?.textInput
     const refinedTechStack = refinementStep?.content?.refinedTechStack

     if (!refinedIdea || !currentStep || !prdData) {
       console.error('Missing required data for implementation section regeneration.')
       return
     }

     setIsLoading({ [`implementation${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`]: true })

     try {
       const result = await ipc.invoke('ai-regenerate-prd-section', {
         refinedIdea,
         originalContext,
         refinedTechStack,
         sectionKey: `implementation${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`,
       })
       
       console.log(`AI Implementation ${sectionKey} Response:`, result)
       
       // The result is already the normalized section data
       const normalizedSection = result
       
       console.log(`Normalized Implementation ${sectionKey}:`, normalizedSection)
       
       const currentImplementation = prdData.implementation || {
         timeline: [],
         resources: [],
         stakeholders: [],
       }
       
       const updatedData = {
         ...prdData,
         implementation: {
           timeline: currentImplementation.timeline,
           resources: currentImplementation.resources,
           stakeholders: currentImplementation.stakeholders,
           [sectionKey]: normalizedSection,
         },
       }
       
       await updatePrdData(updatedData)
     } catch (error) {
       console.error(`Failed to regenerate implementation ${sectionKey}:`, error)
     } finally {
       setIsLoading({ [`implementation${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`]: false })
     }
   }



  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Step 4: PRD Generation</h2>
            <p className="text-muted-foreground">
              Your Product Requirements Document is broken down into editable sections. You can regenerate any section individually.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateAll} disabled={isLoading.all}>
              {isLoading.all ? (
                <LoaderIcon className="size-4 mr-2 animate-spin" />
              ) : (
                <Wand2Icon className="size-4 mr-2" />
              )}
              Regenerate All
            </Button>
            <Button 
              onClick={handleProceedToNext} 
              disabled={isLoading.all || !prdData}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRightIcon className="size-4 mr-2" />
              Next Step
            </Button>
          </div>
        </div>

        {isLoading.all ? (
          <div className="flex flex-col items-center justify-center h-96 border rounded-lg bg-muted/20">
            <LoaderIcon className="size-10 text-primary animate-spin mb-4" />
            <p className="font-semibold text-lg">Generating your PRD...</p>
            <p className="text-sm text-muted-foreground">This may take a minute. Please wait.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Overview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateSection('summary')}
                  disabled={isLoading.summary}
                >
                  {isLoading.summary ? (
                    <LoaderIcon className="size-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2Icon className="size-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Elevator Pitch</label>
                  <Textarea
                    value={prdData?.summary?.elevatorPitch || ''}
                    onChange={(e) => handleSummaryChange('elevatorPitch', e.target.value)}
                    className="min-h-[80px]"
                    placeholder="Brief elevator pitch..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Summary</label>
                  <Textarea
                    value={prdData?.summary?.summary || ''}
                    onChange={(e) => handleSummaryChange('summary', e.target.value)}
                    className="min-h-[120px]"
                    placeholder="Detailed project summary..."
                  />
                </div>
              </div>
            </Card>

            {/* Target Audience Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Target Audience</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPersona}
                  >
                    <PlusIcon className="size-3 mr-1" />
                    Add Persona
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateSection('personas')}
                    disabled={isLoading.personas}
                  >
                    {isLoading.personas ? (
                      <LoaderIcon className="size-3 mr-1 animate-spin" />
                    ) : (
                      <Wand2Icon className="size-3 mr-1" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {prdData?.personas?.map((persona, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium">Persona {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePersona(index)}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Name</label>
                        <Input
                          value={persona.name}
                          onChange={(e) => handlePersonaChange(index, 'name', e.target.value)}
                          placeholder="Persona name..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Role</label>
                        <Input
                          value={persona.role}
                          onChange={(e) => handlePersonaChange(index, 'role', e.target.value)}
                          placeholder="Role/title..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Goals</label>
                        <Textarea
                          value={Array.isArray(persona.goals) ? persona.goals.join('\n') : persona.goals}
                          onChange={(e) => handlePersonaChange(index, 'goals', e.target.value.split('\n').filter(g => g.trim()))}
                          className="min-h-[80px]"
                          placeholder="One goal per line..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Frustrations</label>
                        <Textarea
                          value={Array.isArray(persona.frustrations) ? persona.frustrations.join('\n') : persona.frustrations}
                          onChange={(e) => handlePersonaChange(index, 'frustrations', e.target.value.split('\n').filter(f => f.trim()))}
                          className="min-h-[80px]"
                          placeholder="One frustration per line..."
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Key Features Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Key Features</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddFeature}
                  >
                    <PlusIcon className="size-3 mr-1" />
                    Add Feature
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateSection('features')}
                    disabled={isLoading.features}
                  >
                    {isLoading.features ? (
                      <LoaderIcon className="size-3 mr-1 animate-spin" />
                    ) : (
                      <Wand2Icon className="size-3 mr-1" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {prdData?.features?.map((feature, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium">Feature {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeature(index)}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="col-span-2">
                        <label className="text-sm font-medium mb-1 block">Feature Name</label>
                        <Input
                          value={feature.name}
                          onChange={(e) => handleFeatureChange(index, 'name', e.target.value)}
                          placeholder="Feature name..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Priority</label>
                        <select
                          value={feature.priority}
                          onChange={(e) => handleFeatureChange(index, 'priority', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Textarea
                        value={feature.description}
                        onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                        className="min-h-[80px]"
                        placeholder="Feature description..."
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Technical Architecture Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Technical Architecture</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateSection('techStack')}
                  disabled={isLoading.techStack}
                >
                  {isLoading.techStack ? (
                    <LoaderIcon className="size-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2Icon className="size-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Frontend</label>
                  <Input
                    value={prdData?.techStack?.frontend || ''}
                    onChange={(e) => handleTechStackChange('frontend', e.target.value)}
                    placeholder="Frontend technology..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Backend</label>
                  <Input
                    value={prdData?.techStack?.backend || ''}
                    onChange={(e) => handleTechStackChange('backend', e.target.value)}
                    placeholder="Backend technology..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Database</label>
                  <Input
                    value={prdData?.techStack?.database || ''}
                    onChange={(e) => handleTechStackChange('database', e.target.value)}
                    placeholder="Database technology..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Hosting</label>
                  <Input
                    value={prdData?.techStack?.hosting || ''}
                    onChange={(e) => handleTechStackChange('hosting', e.target.value)}
                    placeholder="Hosting platform..."
                  />
                </div>
              </div>
            </Card>

            {/* UI/UX Design Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">UI/UX Design</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateSection('uiDesign')}
                  disabled={isLoading.uiDesign}
                >
                  {isLoading.uiDesign ? (
                    <LoaderIcon className="size-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2Icon className="size-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Core Principles</label>
                  <Textarea
                    value={Array.isArray(prdData?.uiDesign?.principles) ? prdData.uiDesign.principles.join('\n') : ''}
                    onChange={(e) => handleUIDesignChange('principles', e.target.value.split('\n').filter(p => p.trim()))}
                    className="min-h-[80px]"
                    placeholder="One principle per line..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Color Palette</label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(prdData?.uiDesign?.palette || {}).map(([colorName, colorValue]) => (
                      <div key={colorName} className="flex items-center gap-3 p-3 border rounded">
                        <input
                          type="color"
                          value={colorValue as string}
                          onChange={(e) => {
                            const currentPalette = prdData?.uiDesign?.palette || {}
                            handleUIDesignChange('palette', {
                              ...currentPalette,
                              [colorName]: e.target.value
                            })
                          }}
                          className="w-12 h-8 rounded border cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm capitalize">{colorName}</div>
                          <div className="text-xs text-muted-foreground">{colorValue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(prdData?.uiDesign?.palette || {}).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No colors defined. Regenerate this section to get AI-suggested colors.
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Key Screens</label>
                  <Textarea
                    value={prdData?.uiDesign?.screens?.map((s: any) => `${s.name}: ${s.description || ''}`).join('\n') || ''}
                    onChange={(e) => {
                      const screens = e.target.value.split('\n').map(line => {
                        const [name, ...descParts] = line.split(':')
                        return {
                          name: name?.trim() || '',
                          description: descParts.join(':').trim() || ''
                        }
                      }).filter(s => s.name)
                      handleUIDesignChange('screens', screens)
                    }}
                    className="min-h-[80px]"
                    placeholder="Screen Name: Description (one per line)"
                  />
                </div>
              </div>
            </Card>

            {/* Implementation Timeline Section - Optional */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Implementation Timeline</h3>
                <div className="flex gap-2">
                  {!prdData?.implementation?.timeline && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateImplementationSection('timeline')}
                      disabled={isLoading.implementationTimeline}
                    >
                      {isLoading.implementationTimeline ? (
                        <LoaderIcon className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2Icon className="size-3 mr-1" />
                      )}
                      Generate Timeline
                    </Button>
                  )}
                  {prdData?.implementation?.timeline && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateImplementationSection('timeline')}
                      disabled={isLoading.implementationTimeline}
                    >
                      {isLoading.implementationTimeline ? (
                        <LoaderIcon className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2Icon className="size-3 mr-1" />
                      )}
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>
              
              {!prdData?.implementation?.timeline ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2">No implementation timeline generated yet.</p>
                  <p className="text-sm">Click "Generate Timeline" to create project phases and deliverables.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prdData.implementation.timeline?.map((phase, index) => (
                    <Card key={index} className="p-3">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Phase</label>
                          <Input
                            value={phase.phase}
                            onChange={(e) => {
                              const updatedTimeline = [...(prdData.implementation?.timeline || [])]
                              updatedTimeline[index] = { ...phase, phase: e.target.value }
                              handleImplementationChange('timeline', updatedTimeline)
                            }}
                            className="text-sm"
                            placeholder="Phase name..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Duration</label>
                          <Input
                            value={phase.duration}
                            onChange={(e) => {
                              const updatedTimeline = [...(prdData.implementation?.timeline || [])]
                              updatedTimeline[index] = { ...phase, duration: e.target.value }
                              handleImplementationChange('timeline', updatedTimeline)
                            }}
                            className="text-sm"
                            placeholder="Duration..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Description</label>
                          <Input
                            value={phase.description}
                            onChange={(e) => {
                              const updatedTimeline = [...(prdData.implementation?.timeline || [])]
                              updatedTimeline[index] = { ...phase, description: e.target.value }
                              handleImplementationChange('timeline', updatedTimeline)
                            }}
                            className="text-sm"
                            placeholder="Description..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Deliverables</label>
                        <Textarea
                          value={Array.isArray(phase.deliverables) ? phase.deliverables.join('\n') : ''}
                          onChange={(e) => {
                            const updatedTimeline = [...(prdData.implementation?.timeline || [])]
                            updatedTimeline[index] = { 
                              ...phase, 
                              deliverables: e.target.value.split('\n').filter(d => d.trim()) 
                            }
                            handleImplementationChange('timeline', updatedTimeline)
                          }}
                          className="min-h-[60px] text-sm"
                          placeholder="One deliverable per line..."
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Resource Allocation Section - Optional */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Resource Allocation</h3>
                <div className="flex gap-2">
                  {!prdData?.implementation?.resources && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateImplementationSection('resources')}
                      disabled={isLoading.implementationResources}
                    >
                      {isLoading.implementationResources ? (
                        <LoaderIcon className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2Icon className="size-3 mr-1" />
                      )}
                      Generate Resources
                    </Button>
                  )}
                  {prdData?.implementation?.resources && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateImplementationSection('resources')}
                      disabled={isLoading.implementationResources}
                    >
                      {isLoading.implementationResources ? (
                        <LoaderIcon className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2Icon className="size-3 mr-1" />
                      )}
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>
              
              {!prdData?.implementation?.resources ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2">No resource allocation generated yet.</p>
                  <p className="text-sm">Click "Generate Resources" to define roles and responsibilities.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prdData.implementation.resources?.map((resource, index) => (
                    <Card key={index} className="p-3">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Role</label>
                          <Input
                            value={resource.role}
                            onChange={(e) => {
                              const updatedResources = [...(prdData.implementation?.resources || [])]
                              updatedResources[index] = { ...resource, role: e.target.value }
                              handleImplementationChange('resources', updatedResources)
                            }}
                            className="text-sm"
                            placeholder="Role/title..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Commitment</label>
                          <Input
                            value={resource.commitment}
                            onChange={(e) => {
                              const updatedResources = [...(prdData.implementation?.resources || [])]
                              updatedResources[index] = { ...resource, commitment: e.target.value }
                              handleImplementationChange('resources', updatedResources)
                            }}
                            className="text-sm"
                            placeholder="Time commitment..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Responsibilities</label>
                        <Textarea
                          value={Array.isArray(resource.responsibilities) ? resource.responsibilities.join('\n') : ''}
                          onChange={(e) => {
                            const updatedResources = [...(prdData.implementation?.resources || [])]
                            updatedResources[index] = { 
                              ...resource, 
                              responsibilities: e.target.value.split('\n').filter(r => r.trim()) 
                            }
                            handleImplementationChange('resources', updatedResources)
                          }}
                          className="min-h-[60px] text-sm"
                          placeholder="One responsibility per line..."
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Stakeholder Communication Section - Optional */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Stakeholder Communication</h3>
                <div className="flex gap-2">
                  {!prdData?.implementation?.stakeholders && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateImplementationSection('stakeholders')}
                      disabled={isLoading.implementationStakeholders}
                    >
                      {isLoading.implementationStakeholders ? (
                        <LoaderIcon className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2Icon className="size-3 mr-1" />
                      )}
                      Generate Communication Plan
                    </Button>
                  )}
                  {prdData?.implementation?.stakeholders && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateImplementationSection('stakeholders')}
                      disabled={isLoading.implementationStakeholders}
                    >
                      {isLoading.implementationStakeholders ? (
                        <LoaderIcon className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2Icon className="size-3 mr-1" />
                      )}
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>
              
              {!prdData?.implementation?.stakeholders ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2">No stakeholder communication plan generated yet.</p>
                  <p className="text-sm">Click "Generate Communication Plan" to define stakeholder workflows.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prdData.implementation.stakeholders?.map((stakeholder, index) => (
                    <Card key={index} className="p-3">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Stakeholder</label>
                          <Input
                            value={stakeholder.stakeholder}
                            onChange={(e) => {
                              const updatedStakeholders = [...(prdData.implementation?.stakeholders || [])]
                              updatedStakeholders[index] = { ...stakeholder, stakeholder: e.target.value }
                              handleImplementationChange('stakeholders', updatedStakeholders)
                            }}
                            className="text-sm"
                            placeholder="Stakeholder name/group..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Communication Method</label>
                          <Input
                            value={stakeholder.communication}
                            onChange={(e) => {
                              const updatedStakeholders = [...(prdData.implementation?.stakeholders || [])]
                              updatedStakeholders[index] = { ...stakeholder, communication: e.target.value }
                              handleImplementationChange('stakeholders', updatedStakeholders)
                            }}
                            className="text-sm"
                            placeholder="Email, meetings, etc..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                          <Input
                            value={stakeholder.frequency}
                            onChange={(e) => {
                              const updatedStakeholders = [...(prdData.implementation?.stakeholders || [])]
                              updatedStakeholders[index] = { ...stakeholder, frequency: e.target.value }
                              handleImplementationChange('stakeholders', updatedStakeholders)
                            }}
                            className="text-sm"
                            placeholder="Weekly, monthly, etc..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Deliverables/Updates</label>
                        <Textarea
                          value={Array.isArray(stakeholder.deliverables) ? stakeholder.deliverables.join('\n') : ''}
                          onChange={(e) => {
                            const updatedStakeholders = [...(prdData.implementation?.stakeholders || [])]
                            updatedStakeholders[index] = { 
                              ...stakeholder, 
                              deliverables: e.target.value.split('\n').filter(d => d.trim()) 
                            }
                            handleImplementationChange('stakeholders', updatedStakeholders)
                          }}
                          className="min-h-[60px] text-sm"
                          placeholder="One deliverable/update per line..."
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </Card>
  )
}
