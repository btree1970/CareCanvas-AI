import fs from 'fs/promises';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';

export interface GeneratedProject {
  id: string;
  name: string;
  path: string;
  port?: number;
  process?: ChildProcess;
  status: 'creating' | 'installing' | 'starting' | 'running' | 'stopped' | 'error';
  url?: string;
  error?: string;
  createdAt: Date;
}

export interface DeploymentPackage {
  [filePath: string]: string;
}

// Global registry of running projects
const runningProjects = new Map<string, GeneratedProject>();

// Find an available port starting from 3001
export async function findAvailablePort(startPort: number = 3001): Promise<number> {
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  };

  let port = startPort;
  while (port < startPort + 100) { // Check up to 100 ports
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error('No available ports found');
}

// Create project directory structure
export async function createProjectStructure(projectPath: string): Promise<void> {
  const directories = [
    'src/app',
    'src/lib',
    'src/components/widgets',
    'public',
  ];

  // Create base directory
  await fs.mkdir(projectPath, { recursive: true });

  // Create subdirectories
  for (const dir of directories) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }
}

// Write deployment package files to disk
export async function writeProjectFiles(
  projectPath: string, 
  deploymentPackage: DeploymentPackage
): Promise<void> {
  for (const [filePath, content] of Object.entries(deploymentPackage)) {
    const fullPath = path.join(projectPath, filePath);
    const directory = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}

// Copy widget library to generated project
export async function copyWidgetLibrary(projectPath: string): Promise<void> {
  const widgetSourcePath = path.join(process.cwd(), 'src/components/widgets');
  const widgetDestPath = path.join(projectPath, 'src/components/widgets');

  try {
    // Read all widget files
    const widgetFiles = await fs.readdir(widgetSourcePath);
    
    await fs.mkdir(widgetDestPath, { recursive: true });

    for (const file of widgetFiles) {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const sourcePath = path.join(widgetSourcePath, file);
        const destPath = path.join(widgetDestPath, file);
        const content = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(destPath, content, 'utf-8');
      }
    }
  } catch (error) {
    console.error('Error copying widget library:', error);
    // Continue without widgets if copy fails
  }
}

// Run npm command in project directory
export function runNpmCommand(
  projectPath: string, 
  command: string, 
  args: string[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn('npm', [command, ...args], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm ${command} failed: ${stderr || stdout}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Start development server
export function startDevServer(projectPath: string, port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const process = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, PORT: port.toString() }
    });

    let isReady = false;

    process.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(`[${path.basename(projectPath)}] ${output}`);
      
      // Check if server is ready
      if (output.includes('Ready in') || output.includes('Local:') || output.includes(`localhost:${port}`)) {
        if (!isReady) {
          isReady = true;
          resolve(process);
        }
      }
    });

    process.stderr?.on('data', (data) => {
      const output = data.toString();
      console.error(`[${path.basename(projectPath)}] ${output}`);
      
      // Also check stderr for ready signals (Next.js sometimes outputs there)
      if (output.includes('Ready in') || output.includes('Local:')) {
        if (!isReady) {
          isReady = true;
          resolve(process);
        }
      }
    });

    process.on('error', (error) => {
      reject(error);
    });

    process.on('close', (code) => {
      if (!isReady) {
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!isReady) {
        process.kill();
        reject(new Error('Dev server startup timeout'));
      }
    }, 30000);
  });
}

// Generate project name from form spec
export function generateProjectName(formTitle: string): string {
  return formTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Main deployment function
export async function deployLocally(
  formTitle: string,
  deploymentPackage: DeploymentPackage
): Promise<GeneratedProject> {
  const projectName = generateProjectName(formTitle);
  const projectId = `${projectName}-${Date.now()}`;
  const projectPath = path.join(process.cwd(), 'generated-apps', projectId);

  const project: GeneratedProject = {
    id: projectId,
    name: formTitle,
    path: projectPath,
    status: 'creating',
    createdAt: new Date()
  };

  runningProjects.set(projectId, project);

  try {
    // Step 1: Create project structure
    project.status = 'creating';
    await createProjectStructure(projectPath);
    
    // Step 2: Write all files
    await writeProjectFiles(projectPath, deploymentPackage);
    
    // Step 3: Copy widget library
    await copyWidgetLibrary(projectPath);

    // Step 4: Install dependencies
    project.status = 'installing';
    runningProjects.set(projectId, { ...project });
    await runNpmCommand(projectPath, 'install');

    // Step 5: Find available port
    const port = await findAvailablePort();
    project.port = port;
    project.url = `http://localhost:${port}`;

    // Step 6: Start development server
    project.status = 'starting';
    runningProjects.set(projectId, { ...project });
    
    const devProcess = await startDevServer(projectPath, port);
    project.process = devProcess;
    project.status = 'running';
    
    runningProjects.set(projectId, { ...project });

    // Handle process cleanup
    devProcess.on('close', () => {
      project.status = 'stopped';
      runningProjects.set(projectId, { ...project });
    });

    return project;

  } catch (error) {
    project.status = 'error';
    project.error = error instanceof Error ? error.message : 'Unknown error';
    runningProjects.set(projectId, { ...project });
    throw error;
  }
}

// Stop a running project
export async function stopProject(projectId: string): Promise<void> {
  const project = runningProjects.get(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  if (project.process) {
    project.process.kill();
    project.status = 'stopped';
    runningProjects.set(projectId, { ...project });
  }
}

// Get all running projects
export function getRunningProjects(): GeneratedProject[] {
  return Array.from(runningProjects.values());
}

// Get specific project
export function getProject(projectId: string): GeneratedProject | undefined {
  return runningProjects.get(projectId);
}

// Clean up old projects
export async function cleanupOldProjects(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
  const now = new Date().getTime();
  const generatedAppsPath = path.join(process.cwd(), 'generated-apps');

  try {
    const projects = await fs.readdir(generatedAppsPath);
    
    for (const projectId of projects) {
      const project = runningProjects.get(projectId);
      
      if (project && (now - project.createdAt.getTime()) > maxAge) {
        // Stop if running
        if (project.process) {
          project.process.kill();
        }
        
        // Remove from registry
        runningProjects.delete(projectId);
        
        // Remove files
        try {
          await fs.rm(path.join(generatedAppsPath, projectId), { recursive: true });
          console.log(`Cleaned up old project: ${projectId}`);
        } catch (error) {
          console.error(`Failed to cleanup project ${projectId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Initialize cleanup on startup
setTimeout(() => {
  cleanupOldProjects();
}, 5000);

// Cleanup every hour
setInterval(() => {
  cleanupOldProjects();
}, 60 * 60 * 1000);