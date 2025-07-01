import dotenv from "dotenv"
dotenv.config()

import { END, StateGraph } from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import { PromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"
import { PRDResult, PRDSummary, UserPersona, Feature, PRDTechStack, UIDesign, FileStructure } from "../types/ai"

/**
 * The state for the PRD generation agent.
 * Each key represents a section of the final PRD.
 */
export interface PRDAgentState {
  refinedIdea: string
  originalContext: string
  summary?: PRDSummary
  personas?: UserPersona[]
  features?: Feature[]
  techStack?: PRDTechStack
  uiDesign?: UIDesign
  fileStructure?: FileStructure
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

const generateTechStack = createSpecialistNode(
  `Based on the refined idea, recommend a detailed "Tech Stack". REFINED IDEA: {refinedIdea}. ORIGINAL CONTEXT: {context}. Respond with a JSON object with keys: "frontend", "backend", "database", "hosting". If any field is not applicable, set its value to "Not specified".`,
  "techStack"
)

const generateUIDesign = createSpecialistNode(
  `Based on the refined idea, describe the "UI/UX Design". REFINED IDEA: {refinedIdea}. ORIGINAL CONTEXT: {context}. Respond with a JSON object with keys "principles" (array), "palette" (object), and "screens" (array of objects with name and description).`,
  "uiDesign"
)

const generateFileStructure = createSpecialistNode(
  `Based on the refined idea and proposed tech stack, generate a "File Structure" for the project. REFINED IDEA: {refinedIdea}. ORIGINAL CONTEXT: {context}. Respond with a simple indented tree (not JSON), showing only the top-level folders and files. Example:\nproject-root/\n  src/\n  public/\n  README.md\n  package.json`,
  "fileStructure"
)

// The PRD generation workflow
const prdWorkflow: any = new StateGraph({
  channels: {
    refinedIdea: { value: (x: any, y: any) => y, default: () => "" },
    originalContext: { value: (x: any, y: any) => y, default: () => "" },
    summary: { value: (x: any, y: any) => y },
    personas: { value: (x: any, y: any) => y },
    features: { value: (x: any, y: any) => y },
    techStack: { value: (x: any, y: any) => y },
    uiDesign: { value: (x: any, y: any) => y },
    fileStructure: { value: (x: any, y: any) => y },
    messages: { value: (x: any, y: any) => x.concat(y), default: () => [] },
  },
})

// Add all nodes to the graph
prdWorkflow.addNode("generateSummary", generateSummary)
prdWorkflow.addNode("generatePersonas", generatePersonas)
prdWorkflow.addNode("generateFeatures", generateFeatures)
prdWorkflow.addNode("generateTechStack", generateTechStack)
prdWorkflow.addNode("generateUIDesign", generateUIDesign)
prdWorkflow.addNode("generateFileStructure", generateFileStructure)

// Set the entrypoint and build a linear sequence of nodes.
prdWorkflow.addEdge("__start__", "generateSummary")
prdWorkflow.addEdge("generateSummary", "generatePersonas")
prdWorkflow.addEdge("generatePersonas", "generateFeatures")
prdWorkflow.addEdge("generateFeatures", "generateTechStack")
prdWorkflow.addEdge("generateTechStack", "generateUIDesign")
prdWorkflow.addEdge("generateUIDesign", "generateFileStructure")
prdWorkflow.addEdge("generateFileStructure", END)

const prdGraph = prdWorkflow.compile()

/**
 * The main function to run the PRD generation.
 */
export const generatePrd = async (refinedIdea: string, originalContext: string): Promise<PRDResult> => {
  const initialState: PRDAgentState = {
    refinedIdea,
    originalContext,
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
    fileStructure: finalState.fileStructure || { fileTree: "Not generated" }
  }
  
  return result
} 