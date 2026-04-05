const d = console.log

import { evalExpr, filters } from './jq-utils.js'
import $ from './jq.js'

const jQT = (function() {

	function render(node, data) {
		if (node.t === 'text') return node.v
		if (node.t === 'expr') {
			let [exp, ...pipe] = node.v.split('|').map(s => s.trim())
			let val = evalExpr(exp, data)
			let pipeRaw = pipe
			let shouldSkipEscape = pipeRaw.includes('raw') || pipeRaw.includes('json')
			for (let p of pipeRaw) {
				if (p === 'raw' || p === 'json') continue
				let [name, ...args] = p.includes('(')
					? [p.slice(0, p.indexOf('(')).trim(), ...p.slice(p.indexOf('(') + 1, -1).split(',').map(s => s.trim())]
					: p.split(':').map(s => s.trim())
				let f = filters[name]
				if (typeof f !== 'function') throw new Error(`Unknown filter: ${name}`)
				val = f(val, ...args.map(a => evalExpr(a, data)))
			}
			if (pipeRaw.includes('json')) val = filters.json(val)
			if (typeof val === 'object' && val !== null) {
				if (!Array.isArray(val)) {
					if (node.a === true) {
						val = JSON.stringify(val)
						return shouldSkipEscape ? val : $.escapeHTML(val)
					}
					return Object.entries(val).map(([k, v]) => `${k}="${$.escapeHTML(v)}"`).join(' ')
				}
				val = JSON.stringify(val)
				return shouldSkipEscape ? val : $.escapeHTML(val)
			}
			return shouldSkipEscape ? val : $.escapeHTML(val)
		}
		if (node.t === 'expr-raw') {
			const stmt = node.v.trim()
			if (node.v.startsWith('var ')) {
				const m = stmt.match(/^var\s+([a-zA-Z_$][\w$]*)\s*=\s*(.+)$/)
				data[m[1]] = evalExpr(m[2], data)
			}
			else {
				evalExpr(stmt, data)
			}
			return ''
		}
		if (node.t === 'if') {
			if (evalExpr(node.c, data)) return node.b.map(n => render(n, data)).join('')
			if (node.eb) {
				if (Array.isArray(node.eb)) return node.eb.map(n => render(n, data)).join('')
				return render(node.eb, data)
			}
			return ''
		}
		if (node.t === 'for') {
			let out = ''
			let list = /^\s*.+\.\..+$/.test(node.l)
				? (() => {
					let [a, b] = node.l.split('..').map(s => evalExpr(s.trim(), data))
					return Array.from({ length: b - a + 1 }, (_, i) => a + i)
				})()
				: evalExpr(node.l, data)
			let [a, b] = node.vs
			if (b !== undefined) {
				for (let k in list) {
					data[a] = k
					data[b] = list[k]
					out += node.b.map(n => render(n, data)).join('')
				}
			}
			else {
				if (Array.isArray(list) || typeof list !== 'object')
					for (let v of list) {
						let scope = { ...data }
						scope[a] = v
						out += node.b.map(n => render(n, scope)).join('')
					}
				else
					for (let k in list) {
						let scope = { ...data }
						scope[a] = k
						out += node.b.map(n => render(n, scope)).join('')
					}
			}
			return out
		}
		return ''
	}

	function go(t, data = {}) {
		return parse(tokenize(t)).b.map(n => render(n, data)).join('')
	}

	function filter(name, fn) {
		filters[name] = fn
	}

	return { go, filter }
})()

export default jQT

export function findUnescaped(str, target, start) {
	let i = start
	while (i < str.length) {
		i = str.indexOf(target, i)
		if (i === -1) return -1
		if (i === 0 || str[i - 1] !== '\\') return i
		i += target.length
	}
	return -1
}

export function tokenize(template) {
	const tokens = []
	let i = 0
	const len = template.length
	while (i < len) {
		if (template.startsWith('{{', i) && template[i - 1] !== '\\') {
			const j = findUnescaped(template, '}}', i)
			if (j === -1) throw new Error('Unclosed {{')
			let raw = template.slice(i + 2, j).trim()
			let v = raw.startsWith('!') ? raw.slice(1).trim() + ' | raw' : raw
			let before = template.slice(0, i)
			let isAttrValue = /[\w\-]+\s*=\s*['"]\s*$/.test(before)
			const tok = { t: 'expr', v }
			if (isAttrValue) tok.a = true
			tokens.push(tok)
			i = j + 2
			continue
		}
		else if (template.startsWith('{%', i) && template[i - 1] !== '\\') {
			const j = findUnescaped(template, '%}', i)
			if (j === -1) throw new Error('Unclosed {%')
			tokens.push({ t: 'tag', v: template.slice(i + 2, j).trim() })
			i = j + 2
			continue
		}
		else if (template.slice(i, i + 2) === '{#' && template[i - 1] !== '\\') {
			const j = findUnescaped(template, '#}', i)
			if (j === -1) throw new Error('Unclosed {#')
			i = j + 2
			continue
		}
		const j1 = findUnescaped(template, '{{', i)
		const j2 = findUnescaped(template, '{%', i)
		const j3 = findUnescaped(template, '{#', i)
		const j = Math.min( j1 !== -1 ? j1 : len, j2 !== -1 ? j2 : len, j3 !== -1 ? j3 : len)
		tokens.push({ t: 'text', v: template.slice(i, j).replace(/\\{{/g, '{{').replace(/\\}}/g, '}}').replace(/\\{%/g, '{%').replace(/\\%}/g, '%}') })
		i = j
	}
	return tokens
}

function findNextTag(str, i) {
	const openers = ['{{', '{%' ]
	const nexts = openers.map(tag => str.indexOf(tag, i)).filter(idx => idx !== -1)
	return nexts.length ? Math.min(...nexts) : str.length
}

export function parse(tokens) {
	let i = 0
	function walk() {
		let tok = tokens[i]
		if (!tok) return null
		if (tok.t === 'text') {
			i++
			return { t: 'text', v: tok.v }
		}
		if (tok.t === 'expr') {
			i++
			const ret = { t: 'expr', v: tok.v }
			if (tok.a) ret.a = true
			return ret
		}
		if (tok.t === 'tag') {
			if (tok.v.startsWith('if ')) {
				let node = { t: 'if', c: tok.v.slice(3).trim(), b: [], eb: null }
				i++
				while (i < tokens.length) {
					let next = tokens[i]
					if (next.t === 'tag' && next.v === 'end') {
						i++
						break
					}
					if (next.t === 'tag' && next.v.startsWith('else if ')) {
						tokens[i] = { t: 'tag', v: 'if ' + next.v.slice(8) }
						node.eb = walk()
						break
					}
					if (next.t === 'tag' && next.v === 'else') {
						i++
						let elseNodes = []
						while (i < tokens.length && !(tokens[i].t === 'tag' && tokens[i].v === 'end')) {
							let child = walk()
							if (child) elseNodes.push(child)
						}
						node.eb = elseNodes
						if (tokens[i] && tokens[i].t === 'tag' && tokens[i].v === 'end') i++
						break
					}
					let child = walk()
					if (child) node.b.push(child)
				}
				return node
			}
			if (tok.v.startsWith('for ')) {
				let match = tok.v.match(/^for\s+(.+?)\s+in\s+(.+)$/)
				if (!match) throw new Error('Invalid for syntax: ' + tok.v)
				let [, vars, list] = match
				let varList = vars.split(',').map(s => s.trim())
				let node = { t: 'for', vs: varList, l: list.trim(), b: [] }
				i++
				while (tokens[i] && (tokens[i].t !== 'tag' || tokens[i].v !== 'end')) {
					let child = walk()
					if (child) node.b.push(child)
				}
				i++
				return node
			}
			if (tok.v === 'end') {
				i++
				return null
			}
			i++
			return { t: 'expr-raw', v: tok.v }
		}
	}
	let ast = { t: 'root', b: [] }
	while (i < tokens.length) {
		let node = walk()
		if (node) ast.b.push(node)
	}
	return ast
}
