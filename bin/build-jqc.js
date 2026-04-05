#!/usr/bin/env node

const d = console.log
import fs from 'fs'
import path from 'path'
import * as sass from 'sass'
import jQSON from '../js/jq/jqson.js'
import { jqpug } from '../js/jq/jq-pug.js'
import { buildByHTML } from '../js/jq/jqt4dom.js'
import { args } from './args.js'

let AST = 0
let FROM_DIR = './jqc/'
let TO_DIR = './js/jqc/'

const argv = args('a;')
if (!argv._ || argv.h) {
	d('Usage: node build-jqc.js <file.jqc> [-a: AST] [-w: WEB]')
	process.exit(1)
}
let target = argv._[0]
target = target.replace(/^jqc\//, '')
if (!/\.jqc$/.test(target)) { target += '.jqc' }
if (argv.a) AST = 1
const from = FROM_DIR + target
const to = TO_DIR + target.replace(/\.jqc$/, '.jqc.js')
const code = fs.readFileSync(from, 'utf-8')

function build(from, to, code) {
  const dedent = (lines) => {
    const indent = lines.find(l => l.trim())?.match(/^\s*/)?.[0]?.length || 0
    return lines.map(l => l.slice(indent)).join('\n')
  }
  const lines = code.split(/\r?\n/)
  const sectMap = {}
  let sect = null
  for (const line of lines) {
    if (/^[^\t ]/.test(line)) {
      sect = line.trim()
      sectMap[sect] = []
    }
    else if (sect) {
      sectMap[sect].push(line)
    }
  }
  const libBase = Array(path.dirname(to).split('/').length - 1).fill('..').join('/') + '/src'
  const libExt = 'js'
  const name = path.basename(from, '.jqc')
  const pugSrc = dedent(sectMap.pug || [])
  let html = jqpug(pugSrc)
  let ast = ''
  if (AST) {
    ast = 'ast:' + jQSON.dump(buildByHTML(html)) + ','
    html = ''
  }
  else {
    html = `html: \`${html}\`,`
  }
  const css = sass.compileString(dedent(sectMap.scss || [])).css
  const globalCss = sass.compileString(dedent(sectMap.globalScss || [])).css
  const head = dedent(sectMap.head || [])
  const p = dedent(sectMap.p || [])
  const getHook = (n, def = null) => {
    const isAsync = sectMap[`async ${n}`] !== undefined
    const src = isAsync ? sectMap[`async ${n}`] : sectMap[n]
    if (!src && !def) {
      return ''
    }
    if (src && src.filter(l => l.trim()).length === 0 && !def) {
      return ''
    }
    const body = src ? dedent(src) : dedent(def)
    return `${isAsync ? 'async ' : ''}${n}() {\n${body}\n  },`
  }
  const hooks = [
    getHook('init'),
    getHook('preRender'),
    getHook('postRender')
  ].filter(v => v).join('\n  ')
  const methods = dedent(sectMap.methods || [])
  return `import jQC from '${libBase}/jqc.${libExt}'\n${head}\njQC.define('${name}', {\n  ${html}\n  ${ast}\n  css: ${JSON.stringify(css)},\n  globalCss: ${JSON.stringify(globalCss)},\n  p: ${p || "{}"},\n  ${hooks}\n  methods: {\n${methods}\n  }\n})\n\nexport default true`
}

const out = build(from, to, code)
fs.mkdirSync(path.dirname(to), { recursive: true })
fs.writeFileSync(to, out)
