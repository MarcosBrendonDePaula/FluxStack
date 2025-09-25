#!/usr/bin/env bun

/**
 * FluxStack CLI - Comando nativo `flux`
 * Permite criar projetos sem dependências externas ou configurações manuais
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface CreateProjectOptions {
  name: string;
  template?: 'basic' | 'minimal' | 'full';
}

async function createProject(options: CreateProjectOptions) {
  const { name, template = 'basic' } = options;
  const projectPath = path.resolve(name);
  
  console.log(`🚀 Creating FluxStack project: ${name}`);
  console.log(`📋 Template: ${template}`);
  console.log(`📁 Location: ${projectPath}`);
  console.log();
  
  // Check if directory exists
  try {
    await fs.access(projectPath);
    console.error(`❌ Directory "${name}" already exists`);
    process.exit(1);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Create project directory
  await fs.mkdir(projectPath, { recursive: true });
  
  // Copy template
  const templatePath = path.resolve(__dirname, 'templates', template);
  await copyDirectory(templatePath, projectPath);
  
  // Process placeholders
  await processTemplateFiles(projectPath, {
    PROJECT_NAME: name,
    PROJECT_DESCRIPTION: `A FluxStack application named ${name}`
  });
  
  console.log('✅ Project structure created!');
  console.log('📦 Installing dependencies...');
  
  // Install dependencies
  await installDependencies(projectPath);
  
  console.log();
  console.log('🎉 Project created successfully!');
  console.log();
  console.log('Next steps:');
  console.log(`  cd ${name}`);
  console.log('  bun run dev');
  console.log();
  console.log('Happy coding! 🚀');
}

async function copyDirectory(src: string, dest: string, exclude: string[] = ['node_modules', '.git', 'dist']) {
  await fs.mkdir(dest, { recursive: true });
  
  try {
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      if (exclude.includes(entry.name)) continue;
      
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath, exclude);
      } else {
        const content = await fs.readFile(srcPath, 'utf-8');
        await fs.writeFile(destPath, content, 'utf-8');
      }
    }
  } catch (error) {
    console.error(`❌ Template not found at: ${src}`);
    console.error('Make sure you have the templates directory in your FluxStack installation.');
    process.exit(1);
  }
}

async function processTemplateFiles(
  projectPath: string, 
  replacements: Record<string, string>
) {
  const files = await getAllFiles(projectPath);
  
  for (const file of files) {
    // Skip binary files
    if (isBinaryFile(file)) continue;
    
    let content = await fs.readFile(file, 'utf-8');
    
    // Replace placeholders
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }
    
    await fs.writeFile(file, content, 'utf-8');
  }
}

async function getAllFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
}

async function installDependencies(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const install = spawn('bun', ['install'], {
      cwd: projectPath,
      stdio: 'inherit'
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Dependencies installation failed with code ${code}`));
      }
    });
    
    install.on('error', reject);
  });
}

function showHelp() {
  console.log(`
🚀 FluxStack CLI

Usage:
  flux create <project-name>              Create a new FluxStack project
  flux create <project-name> --template   Specify template (basic, minimal, full)
  flux --help                             Show this help

Examples:
  flux create my-app                      Create basic project
  flux create my-blog --template basic    Create with basic template
  flux create my-api --template minimal   Create minimal project

Templates:
  basic     Full-featured app with frontend and backend (default)
  minimal   Just the backend API
  full      Everything + advanced features

Get started in seconds! 🔥
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === 'help') {
  showHelp();
  process.exit(0);
}

if (command === 'create') {
  const projectName = args[1];
  
  if (!projectName) {
    console.error('❌ Please provide a project name');
    console.error('Usage: flux create <project-name>');
    process.exit(1);
  }
  
  // Validate project name
  if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
    console.error('❌ Project name can only contain letters, numbers, hyphens, and underscores');
    process.exit(1);
  }
  
  const templateIndex = args.indexOf('--template');
  const template = templateIndex !== -1 ? args[templateIndex + 1] as 'basic' | 'minimal' | 'full' : 'basic';
  
  createProject({ name: projectName, template }).catch(error => {
    console.error('❌ Error creating project:', error.message);
    process.exit(1);
  });
} else {
  console.error(`❌ Unknown command: ${command}`);
  console.error('Run "flux --help" for available commands');
  process.exit(1);
}