declare module 'webpack/lib/DynamicEntryPlugin' {
  import { Plugin } from 'webpack'
  export default class DynamicEntryPlugin extends Plugin {
    public constructor(context: string, entry: Function)
  }
}
