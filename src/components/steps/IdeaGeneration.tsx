import { Card } from '../ui/card'
import { Zap, CheckCircle } from 'lucide-react'
import type { UIProject } from '../../hooks/useDatabase'
import type { AnalysisResult, TechStackRecommendation, DetailedTechSection } from '../../types/ai'
import { useState } from 'react'
import { Button } from '../ui/button'

interface IdeaGenerationProps {
  project: UIProject
  onCompleteStep: (projectId: string, stepId: string, data: any) => void
  onStepUpdate: (projectId: string, stepId: string, content: any) => void
}

export function IdeaGeneration({ project, onCompleteStep, onStepUpdate }: IdeaGenerationProps) {
  // Find the completed Input Analysis step (step_1) to get the results
  const analysisStep = project.steps.find(step => step.id.includes('step_1'))
  // Find the current step (step_2), which is the one we are completing
  const currentStep = project.steps.find(step => step.id.includes('step_2'))

  const analysisResult: AnalysisResult | null = analysisStep?.content?.analysis || null
  
  const [selectedIdea, setSelectedIdea] = useState<string | null>(currentStep?.content?.selectedIdea || null);

  const handleSelectIdea = (idea: string) => {
    setSelectedIdea(idea);
  };

  const handleProceed = async () => {
    // We must have a selected idea and a current step to proceed
    if (!selectedIdea || !currentStep) return;

    // The content for step 2 should include the analysis results from step 1 and the newly selected idea.
    const updatedContent = {
      ...currentStep.content,
      analysis: analysisStep?.content?.analysis, // Carry forward analysis results
      selectedIdea: selectedIdea,
    };
    
    // Complete the CURRENT step (step 2) and pass its data
    onCompleteStep(project.id, currentStep.id, updatedContent);
  };

  if (!analysisResult) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Idea Generation</h3>
        <p className="text-muted-foreground">
          Analysis data not found. Please complete the "Input Analysis" step first.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="size-6 text-green-500" />
            <h2 className="text-2xl font-semibold">Analysis Complete</h2>
          </div>
          <p className="text-muted-foreground">
            Here are the ideas and tech stack recommended by the AI based on your input.
          </p>
        </div>

        {/* Ideas */}
        <div className="space-y-3">
          <h3 className="font-medium text-lg">Generated Ideas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisResult.ideas?.map((idea, index) => (
              <Card 
                key={index} 
                className={`p-4 bg-background/50 flex items-start gap-3 cursor-pointer transition-all ${
                  selectedIdea === idea ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50'
                }`}
                onClick={() => handleSelectIdea(idea)}
              >
                <Zap className="size-4 mt-1 shrink-0 text-yellow-500" />
                <p className="text-sm">{idea}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        {analysisResult.techStack && (
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Recommended Tech Stack</h3>
            <Card className="p-4 bg-background/50">
              {/* Handle simple format (string values) */}
              {typeof analysisResult.techStack.frontend === 'string' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-bold">Frontend</p>
                    <p>{typeof analysisResult.techStack.frontend === 'string' ? analysisResult.techStack.frontend : 'Complex structure - see details below'}</p>
                  </div>
                  <div>
                    <p className="font-bold">Backend</p>
                    <p>{typeof analysisResult.techStack.backend === 'string' ? analysisResult.techStack.backend : 'Complex structure - see details below'}</p>
                  </div>
                  <div>
                    <p className="font-bold">Database</p>
                    <p>{typeof analysisResult.techStack.database === 'string' ? analysisResult.techStack.database : 'Complex structure - see details below'}</p>
                  </div>
                  <div>
                    <p className="font-bold">Hosting</p>
                    <p>{typeof analysisResult.techStack.hosting === 'string' ? analysisResult.techStack.hosting : 'Complex structure - see details below'}</p>
                  </div>
                </div>
              ) : (
                /* Handle complex format (object values) */
                <div className="space-y-4">
                  {analysisResult.techStack.bestIdea && (
                    <div>
                      <p className="font-bold text-base mb-2">Best Idea</p>
                      <p className="text-sm text-muted-foreground">{analysisResult.techStack.bestIdea}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Frontend */}
                    {analysisResult.techStack.frontend && (
                      <div>
                        <p className="font-bold mb-2">Frontend</p>
                        <div className="text-sm space-y-1">
                          {typeof analysisResult.techStack.frontend === 'object' && (analysisResult.techStack.frontend as DetailedTechSection).framework && (
                            <p><span className="font-medium">Framework:</span> {(analysisResult.techStack.frontend as DetailedTechSection).framework}</p>
                          )}
                          {typeof analysisResult.techStack.frontend === 'object' && (analysisResult.techStack.frontend as DetailedTechSection).libraries && (
                            <div>
                              <span className="font-medium">Libraries:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {(analysisResult.techStack.frontend as DetailedTechSection).libraries!.map((lib: string, idx: number) => (
                                  <li key={idx}>{lib}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {typeof analysisResult.techStack.frontend === 'object' && (analysisResult.techStack.frontend as DetailedTechSection).design && (
                            <p><span className="font-medium">Design:</span> {(analysisResult.techStack.frontend as DetailedTechSection).design}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Backend */}
                    {analysisResult.techStack.backend && (
                      <div>
                        <p className="font-bold mb-2">Backend</p>
                        <div className="text-sm space-y-1">
                          {typeof analysisResult.techStack.backend === 'object' && (analysisResult.techStack.backend as DetailedTechSection).framework && (
                            <p><span className="font-medium">Framework:</span> {(analysisResult.techStack.backend as DetailedTechSection).framework}</p>
                          )}
                          {typeof analysisResult.techStack.backend === 'object' && (analysisResult.techStack.backend as DetailedTechSection).libraries && (
                            <div>
                              <span className="font-medium">Libraries:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {(analysisResult.techStack.backend as DetailedTechSection).libraries!.map((lib: string, idx: number) => (
                                  <li key={idx}>{lib}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {typeof analysisResult.techStack.backend === 'object' && (analysisResult.techStack.backend as DetailedTechSection).APIs && (
                            <div>
                              <span className="font-medium">APIs:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {(analysisResult.techStack.backend as DetailedTechSection).APIs!.map((api: string, idx: number) => (
                                  <li key={idx}>{api}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Database */}
                    {analysisResult.techStack.database && (
                      <div>
                        <p className="font-bold mb-2">Database</p>
                        <div className="text-sm space-y-1">
                          {typeof analysisResult.techStack.database === 'object' && (analysisResult.techStack.database as DetailedTechSection).type && (
                            <p><span className="font-medium">Type:</span> {(analysisResult.techStack.database as DetailedTechSection).type}</p>
                          )}
                          {typeof analysisResult.techStack.database === 'object' && (analysisResult.techStack.database as DetailedTechSection).features && (
                            <div>
                              <span className="font-medium">Features:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {(analysisResult.techStack.database as DetailedTechSection).features!.map((feature: string, idx: number) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hosting */}
                    {analysisResult.techStack.hosting && (
                      <div>
                        <p className="font-bold mb-2">Hosting</p>
                        <div className="text-sm space-y-1">
                          {typeof analysisResult.techStack.hosting === 'object' && (analysisResult.techStack.hosting as DetailedTechSection).platform && (
                            <p><span className="font-medium">Platform:</span> {(analysisResult.techStack.hosting as DetailedTechSection).platform}</p>
                          )}
                          {typeof analysisResult.techStack.hosting === 'object' && (analysisResult.techStack.hosting as DetailedTechSection).services && (
                            <div>
                              <span className="font-medium">Services:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {(analysisResult.techStack.hosting as DetailedTechSection).services!.map((service: string, idx: number) => (
                                  <li key={idx}>{service}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleProceed} disabled={!selectedIdea} size="lg">
            Refine Selected Idea
          </Button>
        </div>
      </div>
    </Card>
  )
} 