// Minimal ambient types for node:sqlite (Node.js 22.5+).
// @types/node v20 predates this module; remove when @types/node is upgraded to v22+.
declare module 'node:sqlite' {
  export interface StatementSync {
    all(...params: unknown[]): Record<string, unknown>[]
    get(...params: unknown[]): Record<string, unknown> | undefined
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint }
  }

  export class DatabaseSync {
    constructor(location: string, options?: { readOnly?: boolean; open?: boolean })
    exec(sql: string): void
    prepare(sql: string): StatementSync
    close(): void
  }
}
