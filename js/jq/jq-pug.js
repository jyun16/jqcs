const d = console.log

import jQSON from './jqson.js'
import { findUnescaped } from './jqt.js'

export function jqpug(pug) {
	const root = { tag: '__root__', indent: -1, children: [] }
	const stack = [root]
	let start = 0
	let end = pug.indexOf('\n')
	while (end !== -1) {
		processLine(pug.slice(start, end), stack)
		start = end + 1
		end = pug.indexOf('\n', start)
	}
	const lastLine = pug.slice(start)
	if (lastLine) processLine(lastLine, stack)
	const ret = []
	renderAST(root.children, ret)
	return ret.join('\n')
}

function processLine(rawLine, stack) {
	if (rawLine.trim() === '') return
	const p = parseLine(rawLine)
	if (!p.tag && !p.text) return
	while (stack.length > 0 && stack[stack.length - 1].indent >= p.indent) {
		stack.pop()
	}
	const parent = stack[stack.length - 1]
	if (p.tag === '__CTRL__' || p.tag === '__TEXT__') {
		parent.children.push({ raw: p.text, indent: p.indent })
	}
	else {
		const node = { tag: p.tag, attrs: p.attrs, text: p.text || null, children: [], indent: p.indent }
		parent.children.push(node)
		if (!p.text) stack.push(node)
	}
}

function renderAST(nodes, ret) {
	for (let i = 0, len = nodes.length; i < len; i++) {
		const node = nodes[i]
		const pad = '\t'.repeat(node.indent)
		if (node.raw !== undefined) {
			ret.push(`${pad}${node.raw}`)
			continue
		}
		const attr = node.attrs.length > 0 ? ' ' + node.attrs.join(' ') : ''
		if (node.children.length === 0) {
			if (node.text) {
				ret.push(`${pad}<${node.tag}${attr}>${node.text}</${node.tag}>`)
			}
			else {
				ret.push(`${pad}<${node.tag}${attr}></${node.tag}>`)
			}
		}
		else {
			ret.push(`${pad}<${node.tag}${attr}>`)
			if (node.text) {
				ret.push(`${pad}\t${node.text}`)
			}
			renderAST(node.children, ret)
			ret.push(`${pad}</${node.tag}>`)
		}
	}
}

function parseLine(line) {
	let indent = 0
	while (line[indent] === '\t') indent++
	const trimmed = line.trim()
	if (trimmed.startsWith('{%') && trimmed.endsWith('%}')) {
		return { indent, tag: '__CTRL__', attrs: [], text: trimmed }
	}
	if (trimmed.startsWith('|')) {
		return { indent, tag: '__TEXT__', attrs: [], text: trimmed.startsWith('| ') ? trimmed.slice(2) : trimmed.slice(1) }
	}
	let mEnd = 0
	const tLen = trimmed.length
	while (mEnd < tLen && trimmed[mEnd] !== ' ' && trimmed[mEnd] !== '\t' && trimmed[mEnd] !== '(') mEnd++
	let tagPart = trimmed.substring(0, mEnd)
	if (!tagPart) {
		return { indent, tag: null, attrs: [], text: '' }
	}
	const isEval = tagPart.trim().endsWith('=')
	if (isEval) { tagPart = tagPart.replace(/=$/, '') }
	const rest = trimmed.substring(mEnd).trim()
	let text = rest
	let attrsStr = ''
	if (isEval && text) {
		text = new Function('return ' + text)()
	}
	if (rest.startsWith('(')) {
		let balance = 0
		let inSingle = false
		let inDouble = false
		let splitIndex = -1
		for (let i = 0, len = rest.length; i < len; i++) {
			const char = rest[i]
			if (char === "'" && !inDouble) inSingle = !inSingle
			else if (char === '"' && !inSingle) inDouble = !inDouble
			else if (!inSingle && !inDouble) {
				if (char === '(') balance++
				else if (char === ')') balance--
			}
			if (balance === 0) {
				splitIndex = i + 1
				break
			}
		}
		if (splitIndex !== -1) {
			attrsStr = rest.substring(0, splitIndex)
			text = rest.substring(splitIndex).trim()
		}
	}
	const { tag, attrs } = buildAttributes(tagPart, attrsStr)
	return { indent, tag, attrs, text }
}

function parseTagPart(tagPart) {
	let tag = 'div'
	const classes = []
	let id = null
	let current = ''
	let mode = 'tag'
	let i = 0
	const len = tagPart.length
	if (tagPart[0] === '.' || tagPart[0] === '#') {
		tag = 'div'
	}
	else {
		while (i < len && tagPart[i] !== '.' && tagPart[i] !== '#') {
			current += tagPart[i]
			i++
		}
		tag = current || 'div'
		current = ''
	}
	while (i < len) {
		const char = tagPart[i]
		if (char === '.') {
			if (mode === 'class' && current) classes.push(current)
			else if (mode === 'id' && current) id = current
			mode = 'class'
			current = ''
		}
		else if (char === '#') {
			if (mode === 'class' && current) classes.push(current)
			else if (mode === 'id' && current) id = current
			mode = 'id'
			current = ''
		}
		else {
			current += char
		}
		i++
	}
	if (mode === 'class' && current) classes.push(current)
	else if (mode === 'id' && current) id = current
	return { tag, classes, id }
}

function buildAttributes(tagPart, attrsStr) {
	const ret = []
	const { tag, classes, id } = parseTagPart(tagPart)
	if (classes.length > 0) {
		ret.push(`class="${classes.join(' ')}"`)
	}
	if (id) {
		ret.push(`id="${id}"`)
	}
	const pattrs = parseParenthesesAttrs(attrsStr)
	for (let i = 0, len = pattrs.length; i < len; i++) {
		ret.push(pattrs[i])
	}
	return { tag, attrs: ret }
}

function parseParenthesesAttrs(attrs) {
	if (!attrs || attrs === '()') return []
	const c = attrs.slice(1, -1).trim()
	if (!c) return []
	const ret = []
	let i = 0
	const len = c.length
	while (i < len) {
		while (i < len && /\s/.test(c[i])) i++
		if (i >= len) break
		const keyStart = i
		while (i < len && /[a-zA-Z0-9:@._-]/.test(c[i])) i++
		const key = c.slice(keyStart, i)
		if (!key) break
		while (i < len && /\s/.test(c[i])) i++
		let isRaw = false
		if (i < len - 1 && c[i] === '!' && c[i + 1] === '=') {
			isRaw = true
			i += 2
		}
		else if (i < len && c[i] === '=') {
			i++
		}
		else {
			ret.push(`${key}="${key}"`)
			continue
		}
		while (i < len && /\s/.test(c[i])) i++
		const v = parseAttributeValue(c, i)
		i = v.next
		const av = isRaw ? v.c : escapeAttributeValue(v.c)
		const q = v.q || '"'
		ret.push(`${key}=${q}${av}${q}`)
	}
	const remain = c.slice(i).trim()
	if (remain) ret.push(remain)
	return ret
}

function parseAttributeValue(c, s) {
	let i = s
	let v = ''
	let q = '"'
	const len = c.length
	if (i < len && (c[i] === '"' || c[i] === "'")) {
		q = c[i++]
		while (i < len && c[i] !== q) {
			v += c[i++]
		}
		if (i < len) i++
	}
	else {
		while (i < len && !/\s/.test(c[i])) {
			v += c[i++]
		}
	}
	return { c: v, next: i, q }
}

function escapeAttributeValue(v) {
	return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
