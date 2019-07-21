import webpack, { SingleEntryPlugin } from 'webpack'
import DynamicEntryPlugin from 'webpack/lib/DynamicEntryPlugin'
import MultiEntryPlugin from 'webpack/lib/MultiEntryPlugin'

/**
 * @param {string} context context path
 * @param {string | string[]} item entry array or single path
 * @param {string} name entry key name
 * @returns {SingleEntryPlugin | MultiEntryPlugin} returns either a single or multi entry plugin
 */
function itemToPlugin(
  context: string,
  item: string | string[],
  name: string,
): SingleEntryPlugin | MultiEntryPlugin {
  if (Array.isArray(item)) {
    return new MultiEntryPlugin(context, item, name)
  }
  return new SingleEntryPlugin(context, item, name)
}

/**
 * EntryConfigPlugin applies entry plugins based on their type directly.
 * It is similar to EntryOptionPlugin but triggers immediately on apply rather
 * than applying when the entryOption hook is called.
 */
export default class EntryConfigPlugin {
  private context: string
  private entry: webpack.Configuration['entry']

  public constructor(context: string, entry: webpack.Configuration['entry']) {
    this.context = context
    this.entry = entry
  }

  /**
   * @param {Compiler} compiler the compiler instance one is tapping into
   * @returns {void}
   */
  public apply(compiler: webpack.Compiler): void {
    const context = this.context
    const entry = this.entry
    if (typeof entry === 'string' || Array.isArray(entry)) {
      itemToPlugin(context, entry, 'main').apply(compiler)
    } else if (typeof entry === 'object') {
      for (const name of Object.keys(entry)) {
        itemToPlugin(context, entry[name], name).apply(compiler)
      }
    } else if (typeof entry === 'function') {
      new DynamicEntryPlugin(context, entry).apply(compiler)
    }
  }
}
