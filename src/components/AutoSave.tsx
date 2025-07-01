import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { CheckIcon } from 'lucide-react'

interface AutoSaveContextType {
  isSaving: boolean
  lastSaved: Date | null
  registerField: (key: string, value: any, onSave: (value: any) => void, debounceMs?: number) => void
  unregisterField: (key: string) => void
  triggerSave: (key: string) => void
}

const AutoSaveContext = createContext<AutoSaveContextType | undefined>(undefined)

interface FieldData {
  value: any
  onSave: (value: any) => void
  timeout: NodeJS.Timeout | null
  debounceMs: number
}

interface AutoSaveProviderProps {
  children: React.ReactNode
  defaultDebounceMs?: number
}

export function AutoSaveProvider({ children, defaultDebounceMs = 1000 }: AutoSaveProviderProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const fieldsRef = useRef<Map<string, FieldData>>(new Map())

  const registerField = useCallback((key: string, value: any, onSave: (value: any) => void, debounceMs = defaultDebounceMs) => {
    const fields = fieldsRef.current
    const existingField = fields.get(key)

    // Clear existing timeout if field is being re-registered
    if (existingField?.timeout) {
      clearTimeout(existingField.timeout)
    }

    // If value hasn't changed, don't set up new save
    if (existingField && existingField.value === value) {
      fields.set(key, { ...existingField, value, onSave, debounceMs })
      return
    }

    // Set up new debounced save
    const timeout = setTimeout(async () => {
      try {
        setIsSaving(true)
        await onSave(value)
        setLastSaved(new Date())
      } catch (error) {
        console.error(`Auto-save failed for field ${key}:`, error)
      } finally {
        setIsSaving(false)
        // Clean up the timeout reference
        const field = fields.get(key)
        if (field) {
          fields.set(key, { ...field, timeout: null })
        }
      }
    }, debounceMs)

    fields.set(key, { value, onSave, timeout, debounceMs })
  }, [defaultDebounceMs])

  const unregisterField = useCallback((key: string) => {
    const fields = fieldsRef.current
    const field = fields.get(key)
    
    if (field?.timeout) {
      clearTimeout(field.timeout)
    }
    
    fields.delete(key)
  }, [])

  const triggerSave = useCallback(async (key: string) => {
    const fields = fieldsRef.current
    const field = fields.get(key)
    
    if (!field) return

    // Clear any pending timeout
    if (field.timeout) {
      clearTimeout(field.timeout)
      fields.set(key, { ...field, timeout: null })
    }

    // Trigger immediate save
    try {
      setIsSaving(true)
      await field.onSave(field.value)
      setLastSaved(new Date())
    } catch (error) {
      console.error(`Manual save failed for field ${key}:`, error)
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const fields = fieldsRef.current
      fields.forEach((field) => {
        if (field.timeout) {
          clearTimeout(field.timeout)
        }
      })
      fields.clear()
    }
  }, [])

  const value: AutoSaveContextType = {
    isSaving,
    lastSaved,
    registerField,
    unregisterField,
    triggerSave
  }

  return (
    <AutoSaveContext.Provider value={value}>
      {children}
    </AutoSaveContext.Provider>
  )
}

export function useAutoSave() {
  const context = useContext(AutoSaveContext)
  if (!context) {
    throw new Error('useAutoSave must be used within an AutoSaveProvider')
  }
  return context
}

// Hook for individual fields
export function useAutoSaveField(
  key: string, 
  value: any, 
  onSave: (value: any) => void, 
  debounceMs?: number
) {
  const { registerField, unregisterField, triggerSave } = useAutoSave()
  const initialValueRef = useRef(value)

  useEffect(() => {
    // Only register if value has changed from initial value
    if (value !== initialValueRef.current) {
      registerField(key, value, onSave, debounceMs)
    }
  }, [key, value, onSave, debounceMs, registerField])

  useEffect(() => {
    return () => unregisterField(key)
  }, [key, unregisterField])

  return {
    triggerSave: () => triggerSave(key)
  }
}

// Auto-save status indicator component
export function AutoSaveIndicator({ className = "" }: { className?: string }) {
  const { isSaving, lastSaved } = useAutoSave()

  if (!isSaving && !lastSaved) return null

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      {isSaving ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <CheckIcon className="size-4 text-green-600" />
          <span>Saved {lastSaved.toLocaleTimeString()}</span>
        </>
      ) : null}
    </div>
  )
}

// Wrapper component for inputs
interface AutoSaveFieldProps {
  fieldKey: string
  value: any
  onSave: (value: any) => void
  debounceMs?: number
  children: React.ReactElement
}

export function AutoSaveField({ fieldKey, value, onSave, debounceMs, children }: AutoSaveFieldProps) {
  useAutoSaveField(fieldKey, value, onSave, debounceMs)
  return children
}

// HOC for wrapping any component with auto-save
export function withAutoSave<T extends object>(
  Component: React.ComponentType<T>,
  fieldKey: string,
  getValue: (props: T) => any,
  onSave: (value: any, props: T) => void,
  debounceMs?: number
) {
  return function AutoSaveWrapped(props: T) {
    const value = getValue(props)
    const handleSave = useCallback((val: any) => onSave(val, props), [props])
    
    useAutoSaveField(fieldKey, value, handleSave, debounceMs)
    
    return <Component {...props} />
  }
} 