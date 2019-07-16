declare module 'webpack/lib/DynamicEntryPlugin' {
  import { Plugin } from 'webpack'
  export default class DynamicEntryPlugin extends Plugin {
    constructor(context: string, entry: Function)
  }
}
