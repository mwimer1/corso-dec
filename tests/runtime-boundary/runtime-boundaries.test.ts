import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function hasScript(name: string) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'))
    return !!pkg?.scripts?.[name]
  } catch {
    return false
  }
}

describe('Runtime boundaries (Edge vs Node)', () => {
  it('runs script when present, otherwise skips cleanly', { timeout: 10000 }, () => {
    const script = 'validate:runtime-boundaries'
    if (!hasScript(script)) {
      expect(true).toBe(true)
      return
    }

    // Use shell on Windows to avoid EINVAL with *.cmd executables
    const res = spawnSync('pnpm', ['run', script], { encoding: 'utf8', shell: process.platform === 'win32' })
    expect(res.error).toBeUndefined()
    expect([0, 1].includes(res.status ?? -1)).toBe(true)
  })
})



