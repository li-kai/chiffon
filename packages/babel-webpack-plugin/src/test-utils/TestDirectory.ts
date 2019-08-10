import fs from 'fs'
import path from 'path'
import os from 'os'
import del from 'del'

const PREFIX = 'chiffon-'

export default class TestDirectory {
  private tempDir: string

  public constructor() {
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), PREFIX))
  }

  public get path(): string {
    return this.tempDir.slice()
  }

  public tearDown(): Promise<string[]> {
    // Force enabled to remove dir outside of working dir
    return del(this.tempDir, { force: true })
  }
}
