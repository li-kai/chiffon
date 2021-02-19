declare module 'webpack/lib/DynamicEntryPlugin' {
  import { Plugin } from 'webpack'
  export default class DynamicEntryPlugin extends Plugin {
    // @ts-ignore use Function cause that's what it is
    public constructor(context: string, entry: Function)
  }
}
