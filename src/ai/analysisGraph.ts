import dotenv from "dotenv"
dotenv.config()

import { END, StateGraph } from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import { PromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"
import { TechStackRecommendation } from "../types/ai"

/**
 * Defines the state of our agent. It's a key-value store that will be updated by the nodes.
 */
export interface AgentState {
  context: string
  defaultTechStack?: {
    frontend: string
    backend: string
    database: string
    hosting: string
    additional: string
  }
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
    
    Focus ONLY on the context provided. Generate creative and practical product ideas based on what the user has described.
    
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
  const result = (await ideaChain.invoke({ 
    context: state.context

  })) as { ideas: string[] }
  return { ideas: result.ideas || [], messages: [new HumanMessage("Generated ideas.")] }
}

/**
 * A node that recommends a technology stack based on the generated ideas.
 */
const techRecommender = async (state: AgentState): Promise<Partial<AgentState>> => {
  
  // Ask AI for recommendations
  const stackPrompt = PromptTemplate.fromTemplate(
    `You are a senior software architect. Recommend a tech stack that would work well for ALL of these product ideas.
    
    CONTEXT: {context}
    IDEAS: {ideas}
    USER PREFERENCES: {defaultTechStack}
    
    Consider that the tech stack should be versatile enough to support any of the generated ideas.
    If the user has provided a default tech stack or preferences, use it as a starting point. Do not ignore it. 
    
    Respond with a JSON object with exactly these keys: "frontend", "backend", "database", "hosting".
    All values should be strings describing the recommended technology.
    
    Example format:
    {{
      "frontend": "React with TypeScript",
      "backend": "Node.js with Express",
      "database": "PostgreSQL",
      "hosting": "AWS"
    }}`
  )
  
  const stackChain = stackPrompt.pipe(llm).pipe(new JsonOutputParser())
  const aiResult = await stackChain.invoke({ 
    context: state.context, 
    ideas: JSON.stringify(state.ideas),
    defaultTechStack: JSON.stringify(state.defaultTechStack)
  }) as any
  
  // Priority order: User preferences > Context mentions > AI suggestions
  const techStack: TechStackRecommendation = {
    frontend: (aiResult.frontend || 'Not specified'),
    backend: (aiResult.backend || 'Not specified'),
    database: (aiResult.database || 'Not specified'),
    hosting: (aiResult.hosting || 'Not specified')
  }
  
  return { techStack, messages: [new HumanMessage("Recommended tech stack based on priorities.")] }
}

// The primary workflow graph.
const workflow: any = new (StateGraph as any)({
  channels: {
    context: { value: (x: any, y: any) => y, default: () => "" },
    defaultTechStack: { value: (x: any, y: any) => y, default: () => undefined },
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
export const analyzeProjectWithManager = async (
  context: string, 
  defaultTechStack?: {
    frontend: string
    backend: string
    database: string
    hosting: string
    additional: string
  }
): Promise<AgentState> => {
  const initialState = { 
    context, 
    defaultTechStack,
    messages: [new HumanMessage("Start analysis")] 
  }
  console.log("--- Starting AI Analysis ---")
  console.log("Default tech stack:", defaultTechStack)
  const finalState = await analysisGraph.invoke(initialState)
  console.log("Final state:", finalState)
  console.log("--- AI Analysis Complete ---")
  
  return finalState as AgentState
}
