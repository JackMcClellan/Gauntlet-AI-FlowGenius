import dotenv from "dotenv"
dotenv.config()

import { END, StateGraph } from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import { PromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"
import fs from "fs"
import { AnalysisResult, TechStackRecommendation } from "../types/ai"

/**
 * Defines the state of our agent. It's a key-value store that will be updated by the nodes.
 */
export interface AgentState {
  context: string
  ideas?: string[]
  techStack?: TechStackRecommendation
  messages: HumanMessage[]
}

const llm = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 })

/**
 * A node that generates product ideas based on the initial context.
 */
const ideaGenerator = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("--- Generating Ideas ---")
  const ideaPrompt = PromptTemplate.fromTemplate(
    `You are an expert product strategist. Based on the project context, generate 5 distinct product ideas. 
    
    CONTEXT: {context}
    
    Respond with a JSON object with a key "ideas" (an array of strings). Each idea should be 1-2 sentences describing a specific product concept.
    
    Example format:
    {{
      "ideas": [
        "Idea 1 description here",
        "Idea 2 description here",
        "Idea 3 description here",
        "Idea 4 description here",
        "Idea 5 description here"
      ]
    }}`
  )
  const ideaChain = ideaPrompt.pipe(llm).pipe(new JsonOutputParser())
  const result = (await ideaChain.invoke({ context: state.context })) as { ideas: string[] }
  return { ideas: result.ideas || [], messages: [new HumanMessage("Generated ideas.")] }
}

/**
 * A node that recommends a technology stack based on the generated ideas.
 */
const techRecommender = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("--- Recommending Tech Stack ---")
  const stackPrompt = PromptTemplate.fromTemplate(
    `You are a senior software architect. Propose a tech stack for the best idea from the list. 
    
    CONTEXT: {context}
    IDEAS: {ideas}
    
    Respond with a JSON object with exactly these keys: "bestIdea", "frontend", "backend", "database", "hosting".
    All values should be strings describing the recommended technology.
    
    Example format:
    {{
      "bestIdea": "Brief description of the best idea from the list",
      "frontend": "React with TypeScript",
      "backend": "Node.js with Express",
      "database": "PostgreSQL",
      "hosting": "AWS EC2 with CloudFront"
    }}`
  )
  const stackChain = stackPrompt.pipe(llm).pipe(new JsonOutputParser())
  const result = await stackChain.invoke({ context: state.context, ideas: JSON.stringify(state.ideas) }) as TechStackRecommendation
  
  // Ensure the result has the required structure
  const techStack: TechStackRecommendation = {
    bestIdea: result.bestIdea || "No idea selected",
    frontend: result.frontend || "Not specified",
    backend: result.backend || "Not specified", 
    database: result.database || "Not specified",
    hosting: result.hosting || "Not specified"
  }
  
  return { techStack, messages: [new HumanMessage("Recommended tech stack.")] }
}

// The primary workflow graph.
const workflow: any = new (StateGraph as any)({
  channels: {
    context: { value: (x: any, y: any) => y, default: () => "" },
    ideas: { value: (x: any, y: any) => y, default: () => [] },
    techStack: { value: (x: any, y: any) => y, default: () => undefined },
    messages: { value: (x: any, y: any) => x.concat(y), default: () => [] },
  },
})

// Add the nodes to the workflow
workflow.addNode("ideaGenerator", ideaGenerator)
workflow.addNode("techRecommender", techRecommender)

// Set the entrypoint and edges
workflow.addEdge("__start__", "ideaGenerator")
workflow.addEdge("ideaGenerator", "techRecommender")
workflow.addEdge("techRecommender", END)

// Compile the workflow into a runnable graph.
const analysisGraph = workflow.compile()

/**
 * The main function to run the AI analysis.
 */
export const analyzeProjectWithManager = async (context: string): Promise<AnalysisResult> => {
  const initialState = { context, messages: [new HumanMessage("Start analysis")] }
  console.log("--- Starting AI Analysis ---")
  const finalState = await analysisGraph.invoke(initialState)
  console.log("Final state:", finalState)
  console.log("--- AI Analysis Complete ---")
  
  // Convert the state to our expected AnalysisResult format
  const result: AnalysisResult = {
    ideas: finalState.ideas || [],
    techStack: finalState.techStack || {
      bestIdea: "Analysis failed",
      frontend: "Not specified",
      backend: "Not specified",
      database: "Not specified", 
      hosting: "Not specified"
    }
  }
  
  return result
}

/**
 * A utility to build a combined context from text and files.
 */
export async function buildContext(textInput: string, rawFiles: { path: string }[]) {
  let combined = textInput
  for (const f of rawFiles) {
    try {
      combined += "\n\n" + (await fs.promises.readFile(f.path, "utf8"))
    } catch (e) {
      console.warn(`Could not read file ${f.path}, skipping.`)
    }
  }
  return combined.slice(0, 16000) // Keep the context within a reasonable size
}
