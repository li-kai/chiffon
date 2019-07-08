import program from 'commander'
import packageJson from '../package.json'

program.command('start <file>').action(function(dir, cmd) {
  console.log('remove ' + dir + (cmd.recursive ? ' recursively' : ''))
})

program.command('build <file>').action(function(dir, cmd) {
  console.log('remove ' + dir + (cmd.recursive ? ' recursively' : ''))
})

program.version(packageJson.version).parse(process.argv)
