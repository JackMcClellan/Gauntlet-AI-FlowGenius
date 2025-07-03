// Shared interfaces for AI-generated content

// Analysis Graph Output Types
export interface AnalysisResult {
  ideas: string[]
  techStack: TechStackRecommendation
}

export interface TechStackRecommendation {
  frontend: string | DetailedTechSection
  backend: string | DetailedTechSection  
  database: string | DetailedTechSection
  hosting: string | DetailedTechSection
}

export interface DetailedTechSection {
  framework?: string
  libraries?: string[]
  design?: string
  APIs?: string[]
  type?: string
  features?: string[]
  platform?: string
  services?: string[]
}

// PRD Graph Output Types
export interface PRDResult {
  summary: PRDSummary
  personas: UserPersona[]
  features: Feature[]
  techStack: PRDTechStack
  uiDesign: UIDesign
  implementation?: ImplementationPlan
}

export interface PRDSummary {
  elevatorPitch: string
  summary: string
}

export interface UserPersona {
  name: string
  role: string
  goals: string[]
  frustrations: string[]
}

export interface Feature {
  name: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
}

export interface PRDTechStack {
  frontend: string
  backend: string
  database: string
  hosting: string
  additional?: string[]
}

export interface UIDesign {
  principles: string[]
  palette: ColorPalette
  screens: Screen[]
}

export interface ColorPalette {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  text?: string
  [key: string]: string | undefined
}

export interface Screen {
  name: string
  description: string
}

export interface ImplementationPlan {
  timeline: Timeline[]
  resources: ResourceAllocation[]
  stakeholders: StakeholderWorkflow[]
}

export interface Timeline {
  phase: string
  duration: string
  description: string
  deliverables: string[]
}

export interface ResourceAllocation {
  role: string
  commitment: string
  responsibilities: string[]
}

export interface StakeholderWorkflow {
  stakeholder: string
  communication: string
  frequency: string
  deliverables: string[]
}



// Step content interfaces for consistent storage
export interface Step1Content {
  textInput: string
  files: any[]
  analysis: AnalysisResult
}

export interface Step2Content {
  analysis: AnalysisResult
  selectedIdea: string
}

export interface Step3Content {
  refinedIdea: string
  refinedTechStack: TechStackRecommendation
}

export interface Step4Content {
  prdData: PRDResult
  prdText: string
} 