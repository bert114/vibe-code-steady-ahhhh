#!/usr/bin/env node

const { spawnSync } = require('node:child_process')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const launcher = path.join(
  projectRoot,
  '.agents',
  'skills',
  'impeccable',
  'scripts',
  process.platform === 'win32' ? 'impeccable.cmd' : 'impeccable',
)
const targets = process.argv.slice(2)
const detectorArgs = ['detect', ...(targets.length > 0 ? targets : ['client/src'])]

const result = spawnSync(launcher, detectorArgs, {
  cwd: projectRoot,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.error) {
  console.error(`Unable to run the bundled Impeccable detector: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
