import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';
import {
  createMoriGateway,
  createMoriGatewayFromEnv,
  MoriGatewayClient,
} from '@eventureai/builder-llm';

// ============================================================================
// Gateway Client Setup
// ============================================================================

function getGatewayClient(options?: { tenant?: string }): MoriGatewayClient {
  // Check for tenant-specific API key
  const tenant = options?.tenant || process.env.MORI_TENANT || 'eventureai';
  const tenantKey = process.env[`MORI_API_KEY_${tenant.toUpperCase()}`];
  const globalKey = process.env.MORI_API_KEY || process.env.ANTHROPIC_API_KEY;

  const apiKey = tenantKey || globalKey;

  if (!apiKey) {
    console.error(chalk.red('\n❌ No API key found!'));
    console.error(chalk.dim('\nSet one of these environment variables:'));
    console.error(chalk.dim('  MORI_API_KEY=mori_sk_xxx'));
    console.error(chalk.dim('  ANTHROPIC_API_KEY=sk-ant-xxx'));
    console.error(chalk.dim('\nOr for tenant-specific keys:'));
    console.error(chalk.dim(`  MORI_API_KEY_${tenant.toUpperCase()}=mori_sk_xxx\n`));
    process.exit(1);
  }

  return createMoriGateway({
    apiKey,
    baseUrl: process.env.MORI_GATEWAY_URL,
    defaultModel: process.env.MORI_DEFAULT_MODEL || 'claude-sonnet-4-20250514',
  });
}

// ============================================================================
// Chat Command
// ============================================================================

export async function startChatCommand(options: { model?: string; tenant?: string }): Promise<void> {
  const gateway = getGatewayClient({ tenant: options.tenant });
  const tenantSlug = gateway.getTenantSlug();

  console.log(chalk.blue('\n🤖 EventureAI Chat'));
  console.log(chalk.dim(`   Tenant: ${tenantSlug}`));
  console.log(chalk.dim('   Type your message and press Enter. Type "exit" or "quit" to end.\n'));

  const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  const systemPrompt = `You are a helpful AI assistant for the EventureAI Builder. You help developers with:
- Writing and explaining code
- Debugging issues
- Answering questions about web development
- Providing best practices and suggestions

Be concise but thorough. Use markdown formatting for code blocks.`;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  while (true) {
    const userInput = await question(chalk.green('You: '));

    if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
      console.log(chalk.blue('\n👋 Goodbye!\n'));
      rl.close();
      break;
    }

    if (!userInput.trim()) continue;

    conversationHistory.push({ role: 'user', content: userInput });

    process.stdout.write(chalk.magenta('Assistant: '));

    try {
      const response = await gateway.chatStream(
        {
          messages: conversationHistory,
          model: options.model,
          system: systemPrompt,
          max_tokens: 4096,
        },
        {
          onDelta: (text) => {
            process.stdout.write(text);
          },
          onError: (error) => {
            console.error(chalk.red(`\nError: ${error.message}\n`));
          },
        }
      );

      conversationHistory.push({ role: 'assistant', content: response.content });
      process.stdout.write('\n\n');
    } catch (error) {
      console.error(
        chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
      );
    }
  }
}

// ============================================================================
// Generate Command
// ============================================================================

export async function generateCommand(
  prompt: string,
  options: { output?: string; model?: string; tenant?: string }
): Promise<void> {
  const gateway = getGatewayClient({ tenant: options.tenant });
  const tenantSlug = gateway.getTenantSlug();

  console.log(chalk.blue('\n🔨 EventureAI Generator'));
  console.log(chalk.dim(`   Tenant: ${tenantSlug}`));
  console.log(chalk.dim(`   Prompt: ${prompt}\n`));

  const workingDir = process.cwd();
  const systemPrompt = `You are an AI assistant helping developers build applications with the EventureAI Builder.

When asked to generate code or create files, provide complete, working code examples.
Always be helpful, concise, and provide working code. Explain what you're doing as you work.`;

  const fullPrompt = `Working directory: ${workingDir}

Task: ${prompt}${options.output ? `\n\nOutput file: ${options.output}` : ''}`;

  process.stdout.write(chalk.dim(''));

  try {
    const response = await gateway.chatStream(
      {
        messages: [{ role: 'user', content: fullPrompt }],
        model: options.model,
        system: systemPrompt,
        max_tokens: 8192,
      },
      {
        onDelta: (text) => {
          process.stdout.write(text);
        },
        onError: (error) => {
          console.error(chalk.red(`\nError: ${error.message}`));
        },
      }
    );

    console.log(chalk.green('\n\n✨ Generation complete!\n'));
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    );
  }
}

// ============================================================================
// Ask Command (Single Question)
// ============================================================================

export async function askCommand(
  question: string,
  options: { model?: string; json?: boolean; tenant?: string }
): Promise<void> {
  const gateway = getGatewayClient({ tenant: options.tenant });

  const systemPrompt = options.json
    ? 'You are a helpful AI assistant. Always respond with valid JSON.'
    : `You are a helpful AI assistant for the EventureAI Builder. Be concise but thorough.`;

  const fullQuestion = options.json ? `${question}\n\nRespond in JSON format.` : question;

  try {
    await gateway.askStream(
      fullQuestion,
      (text) => {
        process.stdout.write(options.json ? text : chalk.dim(text));
      },
      {
        model: options.model,
        system: systemPrompt,
      }
    );
    console.log('\n');
  } catch (error) {
    console.error(
      chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    );
  }
}

// ============================================================================
// Scaffold Command (AI-Powered Project Creation)
// ============================================================================

export async function scaffoldCommand(
  description: string,
  options: { name?: string; model?: string; tenant?: string }
): Promise<void> {
  const gateway = getGatewayClient({ tenant: options.tenant });
  const tenantSlug = gateway.getTenantSlug();

  console.log(chalk.blue('\n🏗️  EventureAI Project Scaffolder'));
  console.log(chalk.dim(`   Tenant: ${tenantSlug}`));
  console.log(chalk.dim(`   Description: ${description}\n`));

  let projectName = options.name;

  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What would you like to name your project?',
        default: 'my-eventure-app',
        validate: (input: string) => {
          if (input.length < 3) return 'Project name must be at least 3 characters';
          if (!/^[a-z0-9-_]+$/i.test(input))
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          return true;
        },
      },
    ]);
    projectName = answers.projectName;
  }

  const projectPath = path.join(process.cwd(), projectName!);

  if (await fs.pathExists(projectPath)) {
    console.error(chalk.red(`Directory "${projectName}" already exists.`));
    return;
  }

  const systemPrompt = `You are an AI that scaffolds new project structures. Create a complete project based on the user's description.

CRITICAL: You MUST format each file like this:
\`\`\`language filename
// path/to/filename.ext
actual code content here
\`\`\`

Example:
\`\`\`json package.json
// package.json
{
  "name": "my-project",
  "version": "1.0.0"
}
\`\`\`

\`\`\`typescript src/index.ts
// src/index.ts
console.log("Hello!");
\`\`\`

Rules:
1. ALWAYS include the filename after the language in the code fence
2. Include path in the first comment line
3. Create a well-organized directory structure
4. Include all necessary configuration files
5. Use modern best practices`;

  const prompt = `Create a project named "${projectName}" with the following description:

${description}

Provide all the files needed. Format each file with the filename in the code fence header.`;

  try {
    await fs.ensureDir(projectPath);

    console.log(chalk.dim('Generating project structure...\n'));

    // Use streaming for better UX
    let fullResponse = '';
    await gateway.askStream(prompt, (text) => {
      fullResponse += text;
    }, {
      model: options.model,
      system: systemPrompt,
    });

    // Parse the response and extract code blocks with filenames
    // Format: ```language filename or ```language\n// filename
    const codeBlockRegex = /```(\w+)?\s*(?:([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    let filesCreated = 0;

    while ((match = codeBlockRegex.exec(fullResponse)) !== null) {
      const [, lang, filenameHeader, code] = match;

      // Try to get filename from header or first line
      let filename = filenameHeader?.trim();

      if (!filename || filename.length > 50) {
        // Try first line of code
        const firstLine = code.split('\n')[0];
        const pathMatch = firstLine.match(/(?:\/\/|#|<!--)\s*(.+?\.\w+)/);
        if (pathMatch) {
          filename = pathMatch[1].trim();
        }
      }

      if (filename && filename.includes('.')) {
        // Clean up filename
        filename = filename.replace(/^(\/\/|#|<!--)\s*/, '').trim();

        // Skip if it looks like code not a filename
        if (filename.includes('{') || filename.includes('(') || filename.includes('const')) {
          continue;
        }

        const filePath = path.join(projectPath, filename);
        await fs.ensureDir(path.dirname(filePath));

        // Clean up the code - remove filename comment if present
        let cleanCode = code.trim();
        const firstLine = cleanCode.split('\n')[0];
        if (firstLine.match(/^(\/\/|#|<!--)\s*.+?\.\w+$/)) {
          cleanCode = cleanCode.split('\n').slice(1).join('\n').trim();
        }

        await fs.writeFile(filePath, cleanCode);
        console.log(chalk.cyan(`📝 Created: ${filename}`));
        filesCreated++;
      }
    }

    if (filesCreated === 0) {
      console.log(chalk.yellow('\n⚠️  No files were parsed from the response.'));
      console.log(chalk.dim('Saving full response to NOTES.md...'));
      await fs.writeFile(path.join(projectPath, 'NOTES.md'), fullResponse);
      console.log(chalk.cyan(`📝 Created: NOTES.md`));
    }

    console.log(chalk.green(`\n\n✨ Project "${projectName}" created successfully!`));
    console.log(chalk.dim(`   ${filesCreated} files generated`));
    console.log(chalk.blue(`\n   cd ${projectName}`));
    console.log(chalk.blue(`   npm install`));
    console.log(chalk.blue(`   npm run dev\n`));
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    );
    // Clean up on error
    await fs.remove(projectPath);
  }
}
