import { prisma } from '../../prisma/prisma';
import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export async function buildWorkflow(deploymentId: string) {
  "use workflow";

  const deployment = await fetchDeployment(deploymentId);
  if (!deployment || !deployment.project) {
    throw new Error(`Deployment or Project not found for ID ${deploymentId}`);
  }

  const { project } = deployment;
  const workDir = await createWorkDir(deploymentId);
  
  try {
    await updateStatus(deploymentId, 'BUILDING');
    await appendLog(deploymentId, 'Starting build process with Vercel Workflow...');
    await appendLog(deploymentId, `Work directory: ${workDir}`);

    // 1. Clone Repository
    await appendLog(deploymentId, `Cloning repository: ${project.repositoryUrl}`);
    const repoUrl = formatRepoUrl(project.repositoryUrl, project.gitToken);
    
    await runCommandStep('git', ['clone', '-b', project.branch, repoUrl, '.'], workDir, deploymentId);

    // Get commit info
    const { commitHash, commitMessage } = await getCommitInfo(workDir);
    await updateCommitInfo(deploymentId, commitHash, commitMessage);

    // 2. Build
    if (project.buildType === 'DOCKERFILE') {
      const dockerfilePath = project.dockerfilePath || 'Dockerfile';
      const imageName = `nexploy-${project.name.toLowerCase()}:${commitHash.substring(0, 7)}`;
      
      await appendLog(deploymentId, `Building Docker image using ${dockerfilePath}...`);
      await runCommandStep('docker', ['build', '-f', dockerfilePath, '-t', imageName, '.'], workDir, deploymentId);
      await appendLog(deploymentId, `Docker image ${imageName} built successfully.`);
    } else {
      await appendLog(deploymentId, `Build type ${project.buildType} not implemented yet.`);
    }

    await updateStatus(deploymentId, 'SUCCESS');
    await appendLog(deploymentId, 'Build completed successfully.');

  } catch (error: any) {
    console.error(`Build failed for deployment ${deploymentId}:`, error);
    await appendLog(deploymentId, `ERROR: ${error.message}`);
    await updateStatus(deploymentId, 'FAILED');
    throw error;
  } finally {
    await cleanupWorkDir(workDir, deploymentId);
  }
}

// --- Helper Steps ---

async function fetchDeployment(id: string) {
  "use step";
  return prisma.deployment.findUnique({
    where: { id },
    include: { project: true },
  });
}

async function createWorkDir(deploymentId: string) {
  "use step";
  return fs.mkdtemp(path.join(os.tmpdir(), `nexploy-build-${deploymentId}-`));
}

async function cleanupWorkDir(workDir: string, deploymentId: string) {
  "use step";
  try {
    await fs.rm(workDir, { recursive: true, force: true });
    await appendLog(deploymentId, 'Cleaned up working directory.');
  } catch (err) {
    console.error('Cleanup failed', err);
  }
}

async function updateStatus(id: string, status: string) {
  "use step";
  await prisma.deployment.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  });
}

async function updateCommitInfo(id: string, hash: string, message: string) {
  "use step";
  await prisma.deployment.update({
    where: { id },
    data: { commitHash: hash, commitMessage: message },
  });
}

async function appendLog(id: string, message: string) {
  "use step";
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(logLine.trim());

  // Note: Repeatedly updating the same field in a step might be inefficient but works for now.
  // Since 'use step' creates a durable checkpoint, excessively granular steps for logging 
  // every line might be too much overhead.
  // Here we treat a "log append" as a step.
  
  const deployment = await prisma.deployment.findUnique({ where: { id }, select: { buildLogs: true } });
  const currentLogs = deployment?.buildLogs || '';
  
  await prisma.deployment.update({
    where: { id },
    data: { buildLogs: currentLogs + logLine },
  });
}

async function runCommandStep(file: string, args: string[], cwd: string, deploymentId: string) {
  "use step";
  // Executing command in a single step.
  // Note: We cannot easily stream logs *out* of a step in real-time to the DB 
  // if we want the step to be atomic. However, we can collect logs and write them.
  // Or we can just let execa run and not stream intermediate logs to DB *during* this step 
  // because if the step crashes, we retry.
  // For better UX, users want to see progress. 
  // But 'workflow' steps are checkpoints.
  // We'll capture all output and write it at the end of the command execution 
  // OR we can write chunks. But 'use step' wraps the whole function.
  // Writing to DB *inside* a "use step" function is fine, but if the step retries, 
  // those DB writes might happen again (idempotency issue).
  // For logs, it's probably acceptable to have duplicate logs on retry or we can accept it.
  
  try {
      const { stdout, stderr } = await execa(file, args, { cwd, all: true });
      if (stdout) await appendLog(deploymentId, stdout);
      // if (stderr) await appendLog(deploymentId, stderr); // 'all: true' merges them usually
  } catch (error: any) {
      if (error.all) await appendLog(deploymentId, error.all);
      throw error;
  }
}

async function getCommitInfo(cwd: string) {
  "use step";
  const { stdout: commitHash } = await execa('git', ['rev-parse', 'HEAD'], { cwd });
  const { stdout: commitMessage } = await execa('git', ['log', '-1', '--pretty=%B'], { cwd });
  return {
      commitHash: commitHash.trim(),
      commitMessage: commitMessage.trim()
  };
}

function formatRepoUrl(url: string, token: string | null) {
  if (token && url.startsWith('https://')) {
    return url.replace('https://', `https://${token}@`);
  }
  return url;
}
