import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  ScaffolderConfig,
  ProjectSchema,
  type TemplateFile,
  type AIGeneratedTemplate
} from "./types.js";
import { createAnthropicClient } from "../client.js";

// ============================================================================
// Project Scaffolder
// ============================================================================

const DEFAULT_SCAFFOLD_PROMPT = `You are an AI that scaffolds new project structures based on natural language descriptions. Create a complete, production-ready project with:

Rules:
1. Create a well-organized directory structure
2. Include all necessary configuration files (package.json, tsconfig.json, etc.)
3. Create a main entry point (index.ts or index.js)
4. Include a README.md with setup instructions
5. Use modern best practices
6. Include proper TypeScript types
7. Add environment variable examples (.env.example)
8. Include basic scripts in package.json (dev, build, test)

Respond with a valid JSON object containing the project structure.`;

/**
 * Generate a project template using AI
 */
export async function generateProject(
  name: string,
  description: string,
  options: {
    model?: string;
    systemPrompt?: string;
    features?: string[];
  } = {}
): Promise<AIGeneratedTemplate> {
  const client = createAnthropicClient();

  const model = options.model || "claude-sonnet-4-20250514";
  const systemPrompt =
    options.systemPrompt || DEFAULT_SCAFFOLD_PROMPT;

  // Build features list
  const featuresList = options.features?.length
    ? `\n\nRequested features:\n${options.features.map((f) => `- ${f}`).join("\n")}`
    : "";

  const response = await client.createMessage([
    {
      role: "user",
      content: `Create a project named "${name}" with the following description:

${description}${featuresList}

Respond with a valid JSON object matching this schema:
{
  "name": "project-name",
  "description": "Project description",
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "file content here",
      "type": "file"
    }
  ],
  "dependencies": {
    "package-name": "version"
  },
  "scripts": {
    "script-name": "command"
  }
}`,
    },
  ], {
    model,
    maxTokens: 8192,
    temperature: 0.7,
    systemPrompt,
  });

  // Parse the response
  let content = "";
  for (const block of response.content) {
    if (block.type === "text") {
      content += block.text;
    }
  }

  // Extract JSON from the response
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return validateAndEnhanceTemplate(parsed, name);
    } catch {
    // Try to find any JSON object in the content
      const jsonObjects = content.match(/\{[\s\S]*?\}/g);
      for (const match of jsonObjects || []) {
        try {
          const parsed = JSON.parse(match);
          if (parsed.name && parsed.files) {
            return validateAndEnhanceTemplate(parsed, name);
          }
        } catch {
          continue;
        }
      }
    }
  }

  // Fallback: generate a basic template
  return generateFallbackTemplate(name, description);
}

/**
 * Validate and enhance the generated template
 */
function validateAndEnhanceTemplate(
  template: Partial<AIGeneratedTemplate>,
  name: string
): AIGeneratedTemplate {
  // Ensure required files exist
  const requiredFiles = [
    "package.json",
    "tsconfig.json",
    "README.md",
    "src/index.ts",
  ];

  const existingPaths = new Set(template.files?.map((f) => f.path) || []);

  const enhancedFiles = [...(template.files || [])];

  // Add missing required files
  for (const required of requiredFiles) {
    if (!existingPaths.has(required)) {
      enhancedFiles.push(
        createDefaultFile(required, name, template.description || "")
      );
    }
  }

  return {
    name: template.name || name,
    description: template.description || "",
    files: enhancedFiles,
    dependencies: template.dependencies || {
      typescript: "^5.3.3",
      "@types/node": "^20.11.0",
    },
    scripts: template.scripts || {
      dev: "tsx --watch",
      build: "tsc",
      start: "node dist/index.js",
    },
  };
}

/**

/**
 * Create a default file for missing entries
 */
function createDefaultFile(
  path: string,
  projectName: string,
  description: string
): TemplateFile {
  switch (path) {
    case "package.json":
      return {
        path,
        type: "file",
        content: JSON.stringify(
          {
            name: projectName,
            version: "1.0.0",
            description,
            main: "dist/index.js",
            types: "dist/index.d.ts",
            scripts: {
              dev: "tsx watch",
              build: "tsc",
              start: "node dist/index.js",
              test: "vitest",
            },
            dependencies: {},
            devDependencies: {
              typescript: "^5.3.3",
              "@types/node": "^20.11.0",
              vitest: "^1.0.0",
            },
          },
          null,
          2
        ),
      };

    case "tsconfig.json":
      return {
        path,
        type: "file",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "NodeNext",
              moduleResolution: "NodeNext",
              declaration: true,
              declarationMap: true,
              sourceMap: true,
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
              outDir: "./dist",
              rootDir: "./src",
            },
            include: ["src/**/*"],
            exclude: ["node_modules", "dist"],
          },
          null,
          2
        ),
      };

    case "README.md":
      return {
        path,
        type: "file",
        content: `# ${projectName}

${description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Usage

\`\`\`typescript
import { } from '${projectName}';
\`\`\`

## License

MIT
`,
      };

    case "src/index.ts":
      return {
        path,
        type: "file",
        content: `/**
 * ${projectName}
 *
 * ${description}
 */

export const version = "1.0.0";

export function hello(): string {
  return "Hello from ${projectName}!";
}

export default { version, hello };
`,
      };

    default:
      return {
        path,
        type: "file",
        content: `// Auto-generated file`,
      };
  }
}

/**
 * Generate a fallback template if AI generation fails
 */
function generateFallbackTemplate(
  name: string,
  description: string
): AIGeneratedTemplate {
  return {
    name,
    description,
    files: [
      createDefaultFile("package.json", name, description),
      createDefaultFile("tsconfig.json", name, description),
      createDefaultFile("README.md", name, description),
      createDefaultFile("src/index.ts", name, description),
      {
        path: ".env.example",
        type: "file",
        content: `# Environment variables
# Copy this file to .env and fill in your values

API_KEY=your-api-key-here
`,
      },
      {
        path: ".gitignore",
        type: "file",
        content: `node_modules/
dist/
.env
*.log
.DS_Store
`,
      },
    ],
    dependencies: {
      typescript: "^5.3.3",
      "@types/node": "^20.11.0",
    },
    scripts: {
      dev: "tsx watch",
      build: "tsc",
      start: "node dist/index.js",
    },
  };
}

// ============================================================================
// Export Helper Functions
// ============================================================================

/**
 * Create a scaffolder instance with custom configuration
 */
export function createScaffolder(config?: ScaffolderConfig) {
  return {
    generate: (name: string, description: string, options?: { features?: string[] }) =>
      generateProject(name, description, { ...config, ...options }),
  };
}
