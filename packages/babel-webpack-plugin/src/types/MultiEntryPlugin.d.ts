declare module 'webpack/lib/MultiEntryPlugin' {
  import { Plugin } from 'webpack'
  export default class MultiEntryPlugin extends Plugin {
    constructor(context: string, entry: string[], name: string)
  }
}
