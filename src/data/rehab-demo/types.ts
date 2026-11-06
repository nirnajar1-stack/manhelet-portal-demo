export type RehabSnapshot = {
  generatedAt: string
  ids: Record<string, string>
  layers: Array<{ id: number; name_he: string; tables: string[] }>
  tables: Record<string, Array<Record<string, unknown>>>
  erdMermaid: string
  scenarioResults: Array<{
    id: number
    code: string
    title_he: string
    expected_he: string
    actual_he: string
    passed: boolean
    kind: string
    layer: number
  }>
}

export type SimRole = 'matam' | 'companion' | 'patient' | 'guardian' | 'gov'

export type SimActor = {
  id: string
  label_he: string
  role: SimRole
}
