export type TemplateType = 'nextjs' | 'react-native' | 'empty' | 'custom';

export interface ProjectConfig {
  name: string;
  template: TemplateType;
  description?: string;
  version?: string;
  author?: string;
  features?: string[];
  aiGenerated?: boolean;
}

export interface ScaffoldOptions {
  name: string;
  description: string;
  template?: TemplateType;
  features?: string[];
  outputPath?: string;
}

export interface ScaffoldResult {
  success: boolean;
  projectPath?: string;
  filesCreated?: string[];
  error?: string;
}

export const TEMPLATES: { value: TemplateType; label: string }[] = [
  { value: 'nextjs', label: 'Standard Next.js' },
  { value: 'react-native', label: 'Mobile App (React Native)' },
  { value: 'empty', label: 'Empty' },
  { value: 'custom', label: 'Custom (AI Generated)' },
];

export function validateProjectName(name: string): boolean | string {
  if (name.length < 3) return 'Project name must be at least 3 characters long';
  if (!/^[a-z0-9-_]+$/i.test(name)) return 'Project name can only contain alphanumeric characters, hyphens, and underscores';
  return true;
}

/**
 * Template file structure for scaffolding
 */
export interface TemplateFile {
  path: string;
  content: string;
  type: 'file' | 'directory';
}

/**
 * AI-generated template structure
 */
export interface AIGeneratedTemplate {
  name: string;
  description: string;
  files: TemplateFile[];
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}
