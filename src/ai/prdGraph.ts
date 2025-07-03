import dotenv from "dotenv"
dotenv.config()

import { END, StateGraph } from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import { PromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"
import { PRDResult, PRDSummary, UserPersona, Feature, PRDTechStack, UIDesign } from "../types/ai"

/**
 * The state for the PRD generation agent.
 * Each key represents a section of the final PRD.
 */
export interface PRDAgentState {
  refinedIdea: string
  originalContext: string
  refinedTechStack?: PRDTechStack
  summary?: PRDSummary
  personas?: UserPersona[]
  features?: Feature[]
  techStack?: PRDTechStack
  uiDesign?: UIDesign
  messages: HumanMessage[]
}

const llm = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.2 })

// A helper to create specialist nodes
const createSpecialistNode = (promptTemplate: string, outputKey: keyof PRDAgentState) => {
  return async (state: PRDAgentState): Promise<Partial<PRDAgentState>> => {
    console.log(`--- PRD AGENT: Generating ${outputKey}... ---`)
    const finalPrompt = `${promptTemplate}
    
Your response MUST be a single, valid JSON object with a flat structure. Do not nest the response inside other keys. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

    const prompt = PromptTemplate.fromTemplate(finalPrompt)
    const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
    const result = await chain.invoke({
      refinedIdea: state.refinedIdea,
      context: state.originalContext,
    })
    return { [outputKey]: result }
  }
}

// Individual section generation functions
const generateSummaryOnly = async (refinedIdea: string, originalContext: string): Promise<PRDSummary> => {
  console.log("--- PRD AGENT: Generating summary only... ---")
  const promptTemplate = `Based on the refined idea, create an "Elevator Pitch" and a "Project Summary". REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. Respond with a JSON object with keys "elevatorPitch" and "summary".

Your response MUST be a single, valid JSON object with a flat structure. Do not nest the response inside other keys. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  })
  return result
}

const generatePersonasOnly = async (refinedIdea: string, originalContext: string): Promise<UserPersona[]> => {
  console.log("--- PRD AGENT: Generating personas only... ---")
  const promptTemplate = `Based on the refined idea, define 2-3 detailed "User Personas". REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. Respond with a JSON object with a key "personas" (an array of persona objects). Each persona must have: name, role, goals (array), frustrations (array).

Your response MUST be a single, valid JSON object with a flat structure. Do not nest the response inside other keys. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  }) as any
  return result.personas || result
}

const generateFeaturesOnly = async (refinedIdea: string, originalContext: string): Promise<Feature[]> => {
  console.log("--- PRD AGENT: Generating features only... ---")
  const promptTemplate = `Based on the refined idea, list 5-7 "Key Features" with priority. REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. Respond with a JSON object with a key "features" (an array of feature objects). Each feature must have: name, description, priority ("High", "Medium", or "Low").

Your response MUST be a single, valid JSON object with a flat structure. Do not nest the response inside other keys. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  }) as any
  return result.features || result
}

const generateTechStackOnly = async (refinedIdea: string, originalContext: string, refinedTechStack?: PRDTechStack): Promise<PRDTechStack> => {
  console.log("--- PRD AGENT: Generating tech stack only... ---")
  
  // Use the refined tech stack if provided, otherwise generate a new one
  if (refinedTechStack) {
    return refinedTechStack
  }
  
  const promptTemplate = `Based on the refined idea, recommend a "Technical Architecture" including frontend, backend, database, and hosting technologies. REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. Respond with a JSON object with keys "frontend", "backend", "database", and "hosting".

Your response MUST be a single, valid JSON object with a flat structure. Do not nest the response inside other keys. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  })
  return result
}

const generateUIDesignOnly = async (refinedIdea: string, originalContext: string): Promise<UIDesign> => {
  console.log("--- PRD AGENT: Generating UI design only... ---")
  const promptTemplate = `Based on the refined idea, describe the "UI/UX Design". REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. Respond with a JSON object with keys "principles" (array), "palette" (object), and "screens" (array of objects with name and description).

Your response MUST be a single, valid JSON object with a flat structure. Do not nest the response inside other keys. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  })
  return result
}

const generateImplementationOnly = async (refinedIdea: string, originalContext: string): Promise<any> => {
  console.log("--- PRD AGENT: Generating implementation plan only... ---")
  const promptTemplate = `Based on the refined idea, create a comprehensive "Implementation Plan" with timeline, resource allocation, and stakeholder communication workflows. REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. 

Respond with a JSON object with keys:
- "timeline" (array of objects with phase, duration, description, deliverables)
- "resources" (array of objects with role, commitment, responsibilities)  
- "stakeholders" (array of objects with stakeholder, communication, frequency, deliverables)

Your response MUST be a single, valid JSON object with a flat structure. Do not nest the response inside other keys. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  })
  return result
}

const generateImplementationTimelineOnly = async (refinedIdea: string, originalContext: string): Promise<any> => {
  console.log("--- PRD AGENT: Generating implementation timeline only... ---")
  const promptTemplate = `Based on the refined idea, create a detailed "Implementation Timeline" with project phases. REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. 

Respond with a JSON array of timeline objects, each with:
- "phase" (string: phase name)
- "duration" (string: time estimate)
- "description" (string: what happens in this phase)
- "deliverables" (array of strings: key deliverables)

Your response MUST be a single, valid JSON array. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  })
  return result
}

const generateImplementationResourcesOnly = async (refinedIdea: string, originalContext: string): Promise<any> => {
  console.log("--- PRD AGENT: Generating implementation resources only... ---")
  const promptTemplate = `Based on the refined idea, create a detailed "Resource Allocation" plan with roles and responsibilities. REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. 

Respond with a JSON array of resource objects, each with:
- "role" (string: job title or role)
- "commitment" (string: time commitment like "20 hours/week")
- "responsibilities" (array of strings: key responsibilities)

Your response MUST be a single, valid JSON array. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  })
  return result
}

const generateImplementationStakeholdersOnly = async (refinedIdea: string, originalContext: string): Promise<any> => {
  console.log("--- PRD AGENT: Generating implementation stakeholders only... ---")
  const promptTemplate = `Based on the refined idea, create a detailed "Stakeholder Communication" plan. REFINED IDEA: ${refinedIdea}. ORIGINAL CONTEXT: ${originalContext}. 

Respond with a JSON array of stakeholder objects, each with:
- "stakeholder" (string: stakeholder name or group)
- "communication" (string: communication method like "Email", "Weekly meetings")
- "frequency" (string: how often like "Weekly", "Monthly")
- "deliverables" (array of strings: what they receive/need)

Your response MUST be a single, valid JSON array. All property names (keys) must be camelCase and enclosed in double quotes. All string values must also be in double quotes.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await chain.invoke({
    refinedIdea,
    context: originalContext,
  })
  return result
}

// Define the specialist nodes using the helper
const generateSummary = createSpecialistNode(
  `Based on the refined idea, create an "Elevator Pitch" and a "Project Summary". REFINED IDEA: {refinedIdea}. ORIGINAL CONTEXT: {context}. Respond with a JSON object with keys "elevatorPitch" and "summary".`,
  "summary"
)

const generatePersonas = createSpecialistNode(
  `Based on the refined idea, define 2-3 detailed "User Personas". REFINED IDEA: {refinedIdea}. ORIGINAL CONTEXT: {context}. Respond with a JSON object with a key "personas" (an array of persona objects). Each persona must have: name, role, goals (array), frustrations (array).`,
  "personas"
)

const generateFeatures = createSpecialistNode(
  `Based on the refined idea, list 5-7 "Key Features" with priority. REFINED IDEA: {refinedIdea}. ORIGINAL CONTEXT: {context}. Respond with a JSON object with a key "features" (an array of feature objects). Each feature must have: name, description, priority ("High", "Medium", or "Low").`,
  "features"
)

const generateUIDesign = createSpecialistNode(
  `Based on the refined idea, describe the "UI/UX Design". REFINED IDEA: {refinedIdea}. ORIGINAL CONTEXT: {context}. Respond with a JSON object with keys "principles" (array), "palette" (object), and "screens" (array of objects with name and description).`,
  "uiDesign"
)

// Use the refined tech stack from the previous step
const useRefinedTechStack = async (state: PRDAgentState): Promise<Partial<PRDAgentState>> => {
  console.log("--- PRD AGENT: Using refined tech stack from previous step... ---")
  
  // Use the refined tech stack if provided, otherwise use defaults
  const techStack = state.refinedTechStack || {
    frontend: "Not specified",
    backend: "Not specified", 
    database: "Not specified",
    hosting: "Not specified"
  }
  
  console.log("Tech stack being used:", techStack)
  return { techStack }
}

// The PRD generation workflow
const prdWorkflow: any = new (StateGraph as any)({
  channels: {
    refinedIdea: { value: (x: any, y: any) => y, default: () => "" },
    originalContext: { value: (x: any, y: any) => y, default: () => "" },
    refinedTechStack: { value: (x: any, y: any) => y, default: () => undefined },
    summary: { value: (x: any, y: any) => y },
    personas: { value: (x: any, y: any) => y },
    features: { value: (x: any, y: any) => y },
    techStack: { value: (x: any, y: any) => y },
    uiDesign: { value: (x: any, y: any) => y },
    messages: { value: (x: any, y: any) => x.concat(y), default: () => [] },
  },
})

// Add all nodes to the graph
prdWorkflow.addNode("generateSummary", generateSummary)
prdWorkflow.addNode("generatePersonas", generatePersonas)
prdWorkflow.addNode("generateFeatures", generateFeatures)
prdWorkflow.addNode("useRefinedTechStack", useRefinedTechStack)
prdWorkflow.addNode("generateUIDesign", generateUIDesign)

// Set the entrypoint and build a linear sequence of nodes.
prdWorkflow.addEdge("__start__", "generateSummary")
prdWorkflow.addEdge("generateSummary", "generatePersonas")
prdWorkflow.addEdge("generatePersonas", "generateFeatures")
prdWorkflow.addEdge("generateFeatures", "useRefinedTechStack")
prdWorkflow.addEdge("useRefinedTechStack", "generateUIDesign")
prdWorkflow.addEdge("generateUIDesign", END)

const prdGraph = prdWorkflow.compile()

/**
 * The main function to run the PRD generation.
 */
export const generatePrd = async (
  refinedIdea: string, 
  originalContext: string,
  refinedTechStack?: PRDTechStack
): Promise<PRDResult> => {
  const initialState: PRDAgentState = {
    refinedIdea,
    originalContext,
    refinedTechStack,
    messages: [new HumanMessage("Start PRD generation")],
  }
  console.log("--- Starting PRD Generation ---")
  const finalState = await prdGraph.invoke(initialState)
  console.log("--- PRD Generation Complete ---")
  console.log("Final PRD State:", finalState)
  
  // Convert the state to our expected PRDResult format
  const result: PRDResult = {
    summary: finalState.summary || { elevatorPitch: "Not generated", summary: "Not generated" },
    personas: finalState.personas || [],
    features: finalState.features || [],
    techStack: finalState.techStack || { frontend: "Not specified", backend: "Not specified", database: "Not specified", hosting: "Not specified" },
    uiDesign: finalState.uiDesign || { principles: [], palette: {}, screens: [] },
  }
  
  return result
}

/**
 * Function to generate a getting started prompt based on the PRD.
 */
export const generateGettingStartedPrompt = async (
  prdData: any
): Promise<string> => {
  console.log("--- PRD AGENT: Generating getting started prompt... ---")
  
  const promptTemplate = `Based on the completed Product Requirements Document, create a comprehensive coding initialization prompt that a developer can paste into a coding agent (like Cursor, Claude, or GitHub Copilot) to start building this project from scratch.

PRD DATA: {prdData}

Create a detailed prompt that includes:
1. Project overview and elevator pitch
2. Complete technical stack specification
3. UI/UX requirements including color palette and design principles
4. All key features with descriptions and priorities
5. Target audience and user personas
6. Implementation timeline if available
7. Specific coding instructions and setup steps
8. File structure recommendations
9. Key considerations and best practices

The output should be a single, comprehensive prompt that a developer can copy and paste directly into a coding agent to initialize the entire project. Make it actionable, specific, and include all important details from the PRD.

Format this as a clear, well-structured prompt that starts with "Please help me build a [project type] with the following specifications:" and includes all relevant details.`

  const prompt = PromptTemplate.fromTemplate(promptTemplate)
  const chain = prompt.pipe(llm)
  const result = await chain.invoke({
    prdData: JSON.stringify(prdData, null, 2)
  })
  
  return typeof result === 'string' ? result : String(result.content || '')
}

/**
 * Function to regenerate a specific section of the PRD.
 */
export const regeneratePrdSection = async (
  sectionKey: string,
  refinedIdea: string,
  originalContext: string,
  refinedTechStack?: PRDTechStack
): Promise<any> => {
  console.log(`--- Starting ${sectionKey} Regeneration ---`)
  
  switch (sectionKey) {
    case 'summary':
      return await generateSummaryOnly(refinedIdea, originalContext)
    case 'personas':
      return await generatePersonasOnly(refinedIdea, originalContext)
    case 'features':
      return await generateFeaturesOnly(refinedIdea, originalContext)
    case 'techStack':
      return await generateTechStackOnly(refinedIdea, originalContext, refinedTechStack)
    case 'uiDesign':
      return await generateUIDesignOnly(refinedIdea, originalContext)
    case 'implementation':
      return await generateImplementationOnly(refinedIdea, originalContext)
    case 'implementationTimeline':
      return await generateImplementationTimelineOnly(refinedIdea, originalContext)
    case 'implementationResources':
      return await generateImplementationResourcesOnly(refinedIdea, originalContext)
    case 'implementationStakeholders':
      return await generateImplementationStakeholdersOnly(refinedIdea, originalContext)
    default:
      throw new Error(`Unknown section key: ${sectionKey}`)
  }
} 