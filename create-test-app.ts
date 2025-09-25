#!/usr/bin/env bun

/**
 * Script temporário para testar criação de aplicação FluxStack
 * Simula o comportamento do create-fluxstack CLI
 */

import { promises as fs } from 'fs';
import path from 'path';

interface ProjectOptions {
  name: string;
  template: 'basic' | 'minimal' | 'full';
  targetDir?: string;
}

async function createTestApp(options: ProjectOptions) {
  const { name, template } = options;
  const projectPath = path.resolve('test-apps', name);
  
  console.log(`🚀 Creating FluxStack app: ${name}`);
  console.log(`📁 Location: ${projectPath}`);
  console.log(`📋 Template: ${template}`);
  console.log();
  
  // Check if directory already exists
  try {
    await fs.access(projectPath);
    console.log(`❌ Directory ${name} already exists`);
    return;
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Create project directory
  await fs.mkdir(projectPath, { recursive: true });
  
  // Get template path
  const templatePath = path.resolve('framework-distribution', 'create-fluxstack', 'templates', template);
  
  // Copy template files
  await copyDirectory(templatePath, projectPath);
  
  // Process template files (replace placeholders)
  await processTemplateFiles(projectPath, {
    PROJECT_NAME: name,
    PROJECT_DESCRIPTION: `A FluxStack application named ${name}`,
    PROJECT_NAME_KEBAB: name,
    PROJECT_NAME_CAMEL: toCamelCase(name),
    PROJECT_NAME_PASCAL: toPascalCase(name)
  });
  
  console.log('✅ Project created successfully!');
  console.log();
  console.log('Next steps:');
  console.log(`  cd test-apps/${name}`);
  console.log('  bun install');
  console.log('  bun run dev');
  console.log();
}

async function copyDirectory(src: string, dest: string, exclude: string[] = []) {
  await fs.mkdir(dest, { recursive: true });
  
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
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.eot',
    '.zip', '.tar', '.gz', '.rar'
  ];
  
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

function toPascalCase(str: string): string {
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

// Run the script
const projectName = process.argv[2] || 'test-todo-app';
const template = (process.argv[3] as 'basic' | 'minimal' | 'full') || 'basic';

createTestApp({
  name: projectName,
  template
}).catch(error => {
  console.error('❌ Error creating project:', error);
  process.exit(1);
});