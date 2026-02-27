import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { TEMPLATES, validateProjectName } from '@eventureai/builder-core';
import {
  startChatCommand,
  generateCommand,
  askCommand,
  scaffoldCommand,
} from './commands/ai.js';

const program = new Command();

program
  .name('eventureai-builder')
  .description('EventureAI App Builder CLI with AI-powered development tools')
  .version('1.0.0');

// ============================================================================
// Global Options
// ============================================================================

program
  .option('-t, --tenant <slug>', 'Tenant slug (e.g., eventureai, lumina, goldey)', 'eventureai')
  .option('--api-key <key>', 'Override API key (instead of env variable)');

// ============================================================================
// Init Command (Original)
// ============================================================================

program
  .command('init')
  .description('Initialize a new EventureAI project')
  .action(async () => {
    console.log(chalk.blue('Welcome to EventureAI App Builder!'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your new app?',
        default: 'my-eventure-app',
        validate: validateProjectName,
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose a template:',
        choices: TEMPLATES.map((t) => ({ name: t.label, value: t.value })),
      },
    ]);

    console.log(
      chalk.green(`
Creating project: ${answers.projectName} using template: ${answers.template}...`)
    );

    const projectPath = path.join(process.cwd(), answers.projectName);

    try {
      if (await fs.pathExists(projectPath)) {
        console.warn(chalk.yellow(`Warning: Directory ${answers.projectName} already exists.`));
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to continue and potentially overwrite files?',
            default: false,
          },
        ]);
        if (!confirm) {
          console.log(chalk.blue('Aborted.'));
          return;
        }
      }

      await fs.ensureDir(projectPath);
      console.log(chalk.dim(`Created directory: ${projectPath}`));
      // TODO: Copy template files here (to be implemented)
      console.log(chalk.green('Project initialized successfully!'));
    } catch (err) {
      console.error(chalk.red('Error creating project:', err));
    }
  });

// ============================================================================
// Chat Command (AI)
// ============================================================================

program
  .command('chat')
  .description('Start an interactive chat session with AI')
  .option('-m, --model <model>', 'Model to use (e.g., claude-sonnet-4-20250514)')
  .option('-t, --tenant <slug>', 'Tenant slug for API key')
  .action(async (options) => {
    await startChatCommand(options);
  });

// ============================================================================
// Generate Command (AI)
// ============================================================================

program
  .command('generate <prompt>')
  .description('Generate code or files based on a natural language prompt')
  .option('-o, --output <file>', 'Output file path')
  .option('-m, --model <model>', 'Model to use')
  .option('-t, --tenant <slug>', 'Tenant slug for API key')
  .action(async (prompt: string, options) => {
    await generateCommand(prompt, options);
  });

// ============================================================================
// Ask Command (AI)
// ============================================================================

program
  .command('ask <question>')
  .description('Ask a single question and get an AI response')
  .option('-m, --model <model>', 'Model to use')
  .option('-j, --json', 'Request JSON formatted response')
  .option('-t, --tenant <slug>', 'Tenant slug for API key')
  .action(async (question: string, options) => {
    await askCommand(question, options);
  });

// ============================================================================
// Scaffold Command (AI)
// ============================================================================

program
  .command('scaffold <description>')
  .description('Create a new project from a natural language description')
  .option('-n, --name <name>', 'Project name')
  .option('-m, --model <model>', 'Model to use')
  .option('-t, --tenant <slug>', 'Tenant slug for API key')
  .action(async (description: string, options) => {
    await scaffoldCommand(description, options);
  });

// ============================================================================
// Tenants Command (List available tenants)
// ============================================================================

program
  .command('tenants')
  .description('List available tenants and their API key status')
  .action(async () => {
    console.log(chalk.blue('\n📋 Available Tenants\n'));

    const tenants = [
      { slug: 'eventureai', name: 'EventureAI', id: 1 },
      { slug: 'ditzl', name: 'Ditzl', id: 3 },
      { slug: 'lumina', name: 'Lumina', id: 4 },
      { slug: 'goldey', name: 'Goldey', id: 5 },
      { slug: 'peggy', name: 'Peggy', id: 6 },
      { slug: 'streeteats', name: 'StreetEats', id: 7 },
      { slug: 'lightchain', name: 'Lightchain', id: 8 },
      { slug: 'rosebud', name: 'Rosebud', id: 9 },
      { slug: 'nifty', name: 'Nifty', id: 10 },
      { slug: 'ditzl_events', name: 'Ditzl Events', id: 11 },
    ];

    console.log(chalk.dim('ID\tSlug\t\t\tName\t\t\tAPI Key Status'));
    console.log(chalk.dim('─'.repeat(70)));

    for (const tenant of tenants) {
      const envKey = `MORI_API_KEY_${tenant.slug.toUpperCase()}`;
      const globalKey = process.env.MORI_API_KEY;
      const hasKey = !!(process.env[envKey] || globalKey);
      const status = hasKey
        ? chalk.green('✓ Configured')
        : chalk.yellow('○ Not set');
      console.log(`${tenant.id}\t${tenant.slug.padEnd(16)}\t${tenant.name.padEnd(16)}\t${status}`);
    }

    console.log(chalk.dim('\nSet tenant-specific keys:'));
    console.log(chalk.cyan('  export MORI_API_KEY_EVENTUREAI=mori_sk_eventureai_xxx'));
    console.log(chalk.dim('\nOr use a global key:'));
    console.log(chalk.cyan('  export MORI_API_KEY=mori_sk_xxx\n'));
  });

program.parse(process.argv);
