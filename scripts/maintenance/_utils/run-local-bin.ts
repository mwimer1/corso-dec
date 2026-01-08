import { execa } from 'execa';

export type RunResult = { exitCode: number; stdout: string; stderr: string };

export async function runLocalBin(
  cmd: string,
  args: string[] = [],
  options: { cwd?: string; timeoutMs?: number } = {}
): Promise<RunResult> {
  try {
    // Default timeout: 5 minutes (prevents hung subprocesses)
    const timeout = options.timeoutMs ?? 5 * 60 * 1000;
    const subprocess = await execa(cmd, args, {
      cwd: options.cwd as any,
      timeout,
      preferLocal: true,
      all: false as any,
      stdout: 'pipe',
      stderr: 'pipe',
      reject: false,
    } as any);
    return { exitCode: subprocess.exitCode ?? 0, stdout: subprocess.stdout ?? '', stderr: subprocess.stderr ?? '' };
  } catch (err) {
    const message = `${cmd} ${args.join(' ')}`.trim();
    return Promise.reject(new Error(`Failed to run: ${message}`));
  }
}



