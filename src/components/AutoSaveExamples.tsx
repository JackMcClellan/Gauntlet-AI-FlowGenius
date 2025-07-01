import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { AutoSaveProvider, AutoSaveField, AutoSaveIndicator, useAutoSaveField, withAutoSave } from './AutoSave'

// Example 1: Using AutoSaveField wrapper with different input types
export function AutoSaveExamples() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    notes: '',
    isPublic: false
  })

  // Mock save functions
  const saveTitle = async (value: string) => {
    console.log('Saving title:', value)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const saveCategory = async (value: string) => {
    console.log('Saving category:', value)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const saveNotes = async (value: string) => {
    console.log('Saving notes:', value)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const savePublicSetting = async (value: boolean) => {
    console.log('Saving public setting:', value)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return (
    <AutoSaveProvider defaultDebounceMs={1000}>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Auto-Save Form Example</h2>
            <AutoSaveIndicator />
          </div>

          <div className="space-y-4">
            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <AutoSaveField
                fieldKey="form-title"
                value={formData.title}
                onSave={saveTitle}
                debounceMs={800} // Custom debounce time
              >
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter title..."
                />
              </AutoSaveField>
            </div>



            {/* Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <AutoSaveField
                fieldKey="form-category"
                value={formData.category}
                onSave={saveCategory}
              >
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category...</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="project">Project</option>
                </select>
              </AutoSaveField>
            </div>

            {/* Checkbox */}
            <div className="flex items-center space-x-2">
              <AutoSaveField
                fieldKey="form-public"
                value={formData.isPublic}
                onSave={savePublicSetting}
              >
                <input
                  type="checkbox"
                  id="public-checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-input"
                />
              </AutoSaveField>
              <label htmlFor="public-checkbox" className="text-sm font-medium">
                Make this public
              </label>
            </div>
          </div>
        </Card>

        {/* Example 2: Using the hook directly */}
        <Card className="p-6">
          <CustomInputWithHook />
        </Card>

        {/* Example 3: Using HOC */}
        <Card className="p-6">
          <EnhancedInput value={formData.notes} onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))} />
        </Card>
      </div>
    </AutoSaveProvider>
  )
}

// Example 2: Custom component using the hook directly
function CustomInputWithHook() {
  const [value, setValue] = useState('')

  const saveValue = async (val: string) => {
    console.log('Saving custom input:', val)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Use the hook directly for more control
  const { triggerSave } = useAutoSaveField('custom-input', value, saveValue, 1500)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Input with Hook</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={triggerSave}
          >
            Save Now
          </Button>
          <AutoSaveIndicator />
        </div>
      </div>
      
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="This auto-saves with 1.5s debounce..."
      />
    </div>
  )
}

// Example 3: Using Higher-Order Component
interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function BasicInput({ value, onChange, placeholder }: InputProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Enhanced Input (HOC)</h3>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enhanced with auto-save..."}
      />
    </div>
  )
}

// Create auto-save enhanced version
const EnhancedInput = withAutoSave(
  BasicInput,
  'enhanced-input',
  (props: InputProps) => props.value, // getValue function
  async (value: string, props: InputProps) => { // onSave function
    console.log('Saving enhanced input:', value)
    await new Promise(resolve => setTimeout(resolve, 500))
  },
  2000 // 2 second debounce
) 