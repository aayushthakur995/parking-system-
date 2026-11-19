// src/lib/cppBridge.ts
import { execFile, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const CPP_DIR = path.resolve(process.cwd(), 'cpp_engine');
const BINARY_PATH = path.resolve(CPP_DIR, 'park_smart_engine');

let compilePromise: Promise<void> | null = null;

async function ensureCppBinary(): Promise<void> {
  if (fs.existsSync(BINARY_PATH)) {
    return;
  }
  if (!compilePromise) {
    compilePromise = execFileAsync('make', ['-C', CPP_DIR]).then(() => {
      compilePromise = null;
    });
  }
  await compilePromise;
}

export async function runCppEngine<T>(args: string[], stdinInput?: string): Promise<T> {
  await ensureCppBinary();

  return new Promise<T>((resolve, reject) => {
    const child = spawn(BINARY_PATH, args, {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to execute C++17 engine: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`C++17 engine exited with code ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as T;
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Invalid JSON output from C++17 engine: ${err.message}`));
      }
    });

    if (stdinInput !== undefined) {
      child.stdin.write(stdinInput);
    }
    child.stdin.end();
  });
}
