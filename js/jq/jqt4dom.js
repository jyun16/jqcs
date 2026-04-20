const d = console.log
import $ from './jq.js'
import {
	deepClone, diffObj, evalExpr, filters, parseAttributes,
	isTextNode, isElementNode, isCommentNode, isFragmentNode, ddom } from './jq-utils.js'
import jQT from './jqt.js'
import jQSON from './jqson.js'

const DEBUG = {
	t: 0,
	e: 0,
	c: 0,
	q: 0,
	o: 0,
}

const VOID_TAGS = [ 'input', 'br', 'img', 'hr', 'meta', 'link', 'area', 'base', 'col', 'command', 'embed', 'keygen', 'param', 'source', 'track', 'wbr' ]
const PRE_TAGS = [ 'pre', 'textarea', 'code' ]

const jQT4DOM = (function() {

	function filter(name, fn) {
		filters[name] = fn
	}

	function evaluateAttributeControl(ctrl, data) {
		if (ctrl.t === 'if') {
			return renderExpr(ctrl.v, data)
		}
		return true
	}

	function renderExpr(expr, data) {
		let [exp, ...pipe] = expr.split('|').map(s => s.trim())
		let val = evalExpr(exp, data)
		if (val != null && val != undefined && !pipe.length && typeof val === 'object') {
			val =	JSON.stringify(val)
		}
		for (let p of pipe) {
			if (p === 'raw' || p === 'json') continue
			let [name, ...args] = p.includes('(')
				? [p.slice(0, p.indexOf('(')).trim(), ...p.slice(p.indexOf('(') + 1, -1).split(',').map(s => s.trim())]
				: p.split(':').map(s => s.trim())
			let f = filters[name]
			if (typeof f !== 'function') throw new Error(`Unknown filter: ${name}`)
			val = f(val, ...args.map(a => evalExpr(a, data)))
		}
		if (pipe.includes('json')) val = filters.json(val)
		return { val, pipe }
	}
	
	function evalExecExpr(expr, data) {
		const m = expr.match(/^var\s+([a-zA-Z_$][\w$]*)\s*=\s*(.+)$/)
		if (m) data[m[1]] = evalExpr(m[2], data)
		else evalExpr(expr, data)
	}

	function genDOM(type) {
		if (!type) {
			return document.createDocumentFragment()
		}
	}

	function getByPath(obj, path) {
		if (!obj) return undefined
		for (let p of path) {
			if (p == 'f') continue
			obj = obj[p]
		}
		return obj
	}

	function rExpr(n, path, data) {
		let { val, pipe } = renderExpr(n.v, data)
		if (pipe.includes('raw')) {
			const el = document.createElement('span')
			el.innerHTML = val
			const frag = genDOM()
			while (el.firstChild) frag.appendChild(el.firstChild)
			n._dom = frag.firstChild || document.createTextNode('')
			return frag
		}
		const dom = document.createTextNode(val)
		n._dom = dom
		return dom
	}

	function rIf(n, path, data) {
		const frag = genDOM()
		let ok = false
		if (evalExpr(n.v, data)) {
			n.b.forEach((c, i) => frag.appendChild(r(c, path.concat('b', i), data)))
			ok = true
		}
		else if (n.elif) {
			let elif = n.elif
			let elifIndex = 0
			while (elif) {
				if (evalExpr(elif.v, data)) {
					elif.b.forEach((c, i) =>
						frag.appendChild(r(c, path.concat('elif', elifIndex, 'b', i), data))
					)
					ok = true
					break
				}
				elif = elif.elif
				elifIndex++
			}
		}
		if (!ok && n.el) {
			n.el.b.forEach((c, i) => frag.appendChild(r(c, path.concat('el', 'b', i), data)))
			ok = true
		}
		if (ok) {
			n._head = frag.firstChild
			n._tail = frag.lastChild
		}
		else {
			const comment = document.createComment(`if:${n.v}`)
			frag.appendChild(comment)
			n._head = comment
			n._tail = comment
		}
		return frag
	}

	function rFor(n, path, data) {
		let list
		if (/^\s*.+\.\..+$/.test(n.v)) {
			let [a, b] = n.v.split('..').map(s => evalExpr(s.trim(), data))
			list = Array.from({ length: b - a + 1 }, (_, i) => a + i)
		}
		else {
			list = evalExpr(n.v, data)
		}
		if (!list) return genDOM()
		const frag = genDOM()
		if (Array.isArray(list)) {
			list.forEach((item, j) => {
				data[n.lv] = item
				n.b.forEach((c, i) => frag.appendChild(r(c, path.concat('b', i), data)))
			})
		}
		else if (typeof list === 'object' && list !== null) {
			Object.entries(list).forEach(([k, v], j) => {
				data[n.k || 'key'] = k
				data[n.lv] = v
				n.b.forEach((c, i) => frag.appendChild(r(c, path.concat('b', i), data)))
			})
		}
		if (frag.firstChild) {
			n._head = frag.firstChild
			n._tail = frag.lastChild
			n._dom = frag.firstChild
		}
		else {
			const anchor = document.createComment(`for:${n.v}`)
			frag.appendChild(anchor)
			n._head = anchor
			n._tail = anchor
			n._dom = anchor
		}
		return frag
	}

	function rTagExpr(c, val, attrs, data, a, el) {
		const { val: v, pipe } = renderExpr(c.v, data)
		if (pipe.includes('raw')) {
			for (const [ _k, _v ] of Object.entries(typeof v == 'object' ? v : parseAttributes(v))) {
				attrs[_k] = _v
			}
		}
		else {
			if (v != null && v != undefined) val += v
		}
		c._dom = el
		c._attr = a.n
		return val
	}

	function isInput(el) {
		return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
	}

	function setElValue(el, n, val) {
		if (n === 'value' && isInput(el)) {
			el.value = val
		}
	}

	function rTag(n, path, data) {
		const el = document.createElement(n.n)
		n._dom = el
		if (n.a) {
			n.a.forEach(a => {
				let shouldRender = true
				let val = ''
				let attrs = {}
				a.nd.forEach(nd => {
					if (nd.t === 'if') {
						if (evalExpr(nd.v, data)) {
							nd.b.forEach((c, i) => {
								if (c.t === 'text') val += c.v
								else if (c.t === 'expr') val = rTagExpr(c, val, attrs, data, a, al)
							})
						}
					}
					else if (nd.t === 'text') val += nd.v
					else if (nd.t === 'expr') val = rTagExpr(nd, val, attrs, data, a, el)
					else if (nd.t === 'ctrl') shouldRender = evaluateAttributeControl(nd, data)
				})
				val = val.trim()
				if (!shouldRender) return
				if (a.n && val != '' && val != null && val != undefined) {
					let n = a.n
					if (n) {
						if (n.startsWith('@cb')) n = 'jqc-cb-' + n.slice(4)
						else if (n.startsWith('@')) n = 'jqc-on-' + n.slice(1)
					}
					setElValue(el, n, val)
					el.setAttribute(n, val)
				}
				else if (!a.n && (val || attrs)) {
					if (Object.keys(attrs).length) {
						for (let k in attrs) {
							const v = attrs[k]
							if (k.startsWith('@cb-')) k = 'jqc-cb-' + k.slice(4)
							el.setAttribute(k, v)
						}
					}
					else if (val) {
						el.setAttribute(val, '')
					}
				}
			})
		}
		if (n.b)
			n.b.forEach((c, i) => el.appendChild(r(c, path.concat('b', i), data)))
		return el
	}

	function r(n, path, data) {
		if (n.t === 'text') return document.createTextNode(n.v)
		else if (n.t === 'expr') { return rExpr(n, path, data) }
		else if (n.t === 'if') { return rIf(n, path, data) }
		else if (n.t === 'for') { return rFor(n, path, data) }
		else if (n.t === 'tag') { return rTag(n, path, data) }
		else if (n.t === 'expr-raw') {
			evalExpr(n.v, data)
			return document.createTextNode('')
		}
		else if (n.t === 'exec') {
			evalExecExpr(n.v, data)
			return document.createDocumentFragment()
		}
	}

	function go(parsed, data) {
		if (parsed.old) return patch(parsed, data)
		let { ast, index } = parsed
		data ||= {}
		parsed.old = deepClone(data)
		data ||= {}
		const doms = ast.b.map((x, i) => r(x, ['b', i], data))
		const frag = document.createDocumentFragment()
		doms.forEach(n => {
			if (isFragmentNode(n)) {
				while (n.firstChild) frag.appendChild(n.firstChild)
			}
			else {
				frag.appendChild(n)
			}
		})
		return frag
	}

	function patch(parsed, data) {
		const { ast, index, nodes, old } = parsed
		if (!data || !old) return
		const { created, changed, removed } = diffObj(Object.keys(index), data, old)
		for (const key of Object.keys(index)) {
			if (key in changed) continue
			for (const path of index[key] || []) {
				const node = getByPath(ast, path)
				if (node && node._dom && isInput(node._dom)) {
					if (node._attr === 'value' && node._dom.value !== String(data[key] || '')) {
						changed[key] = data[key]
					}
				}
			}
		}
		const allKeys = new Set([ ...Object.keys(created), ...Object.keys(changed), ...Object.keys(removed) ])
		let orgParent = null
		const patched = new Set()
		for (const key of allKeys) {
			const paths = index[key] || []
			for (const path of paths) {
				const node = getByPath(ast, path)
				if (patched.has(node)) continue
				patched.add(node)
				if (node.t === 'expr') {
					const { val, pipe } = renderExpr(node.v, data)
					if (node._attr) {
						setElValue(node._dom, node._attr, val)
						node._dom.setAttribute(node._attr, val)
					}
					else if (pipe.includes('raw') && typeof val === 'object') {
						for (const [k, v] of Object.entries(val)) {
							node._dom.setAttribute(k, v)
						}
					}
					else {
						if (node._dom) node._dom.nodeValue = val
					}
				}
				else if (node.t === 'if' || node.t === 'for') {
					const head = node._head
					const tail = node._tail
					const parent = head?.parentNode
					if (!parent) continue
					const frag = r(node, path, data)
					parent.insertBefore(frag, tail?.nextSibling ?? null)
					let cur = head
					while (cur) {
						const next = cur.nextSibling
						parent.removeChild(cur)
						if (cur === tail) break
						cur = next
					}
				}
				else if (node._dom?.parentNode) {
					const orgDom = node._dom
					const newNode = r(node, path, data)
					orgDom.parentNode.replaceChild(newNode, orgDom)
					node._dom = newNode
				}
			}
		}
		parsed.old = deepClone(data)
	}

	return { go, patch, filter }

})()

export default jQT4DOM

export function buildByHTML(html) {
	return build(tokenize(html))
}

class Builder {

	constructor(tokens) {
		this.tokens = tokens
		this.pos = 0
		this.index = {}
		this.locals = {}
	}

	run() {
		return {
			ast: { t: 'root', b: this._nodes([]) },
			index: this.index
		}
	}
	peek() {
		return this.tokens[this.pos]
	}
	next() {
		return this.tokens[this.pos++]
	}

	isEnd() {
		return this.pos >= this.tokens.length
	}

	_nodes(path, stop = null) {
		const ret = []
		while (!this.isEnd()) {
			const tok = this.peek()
			if (stop && stop(tok)) break
			const cur = path.concat(['b', ret.length])
			if (tok.t === 'tag-open') {
				this.next()
				ret.push(this._tag(tok.v, cur))
			}
			else if (tok.t === 'text') {
				this.next()
				ret.push({ t: 'text', v: tok.v })
			}
			else if (tok.t === 'expr') {
				this.next()
				if (tok.v.startsWith('=')) tok.v = tok.v.slice(1).trim() + ' | raw'
				if (tok.v.startsWith('ro:')) tok.v = tok.v.replace(/^ro:/, '')
				this._dep(tok.v, cur)
				ret.push({ t: 'expr', v: tok.v })
			}
			else if (tok.t === 'exec') {
				this._dep(tok.v, cur)
				this.next()
				ret.push({ t: 'exec', v: tok.v })
			}
			else if (tok.t === 'ctrl') {
				const result = this._ctrl(this.next().v, cur)
				if (result === '__end__') break
				if (result != null) ret.push(result)
			}
			else {
				this.next()
			}
		}
		return ret
	}

	_tag(name, path) {
		const node = { t: 'tag', n: name }
		const attrs = []
		while (!this.isEnd() && this.peek().t === 'attr') {
			const tok = this.next()
			const { n, nd } = tok.v
			const attr = n ? { n, nd } : { nd }
			nd.forEach((x, i) => {
				if (x.t === 'expr' && x.v.startsWith('=')) {
					x.v = x.v.slice(1).trim() + ' | raw'
				}
				if (x.t === 'ctrl' && x.v.startsWith('if ')) {
					const cond = x.v.slice(3).trim()
					this._dep(cond, path.concat(['a', attrs.length, 'nd', i]))
					const ifNode = { t: 'if', v: cond, b: [] }
					let j = i + 1
					while (j < nd.length) {
						if (nd[j].t === 'ctrl' && nd[j].v === 'end') {
							break
						}
						ifNode.b.push(nd[j])
						j++
					}
					nd.splice(i, j - i + 1, ifNode)
				}
				else if (x.t === 'expr' || x.t === 'ctrl') {
					if (x.v.startsWith('ro:')) x.v = x.v.replace(/^ro:/, '')
					this._dep(x.v, path.concat(['a', attrs.length, 'nd', i]))
				}
			})
			attrs.push(attr)
		}
		if (attrs.length) node.a = attrs
		const b = this._nodes(path, t => t.t === 'tag-close' && t.v === name)
		if (b.length) node.b = b
		if (!this.isEnd()) this.next()
		return node
	}

	_ctrl(code, path) {
		if (code === 'end') return '__end__'
		if (code.startsWith('if ')) return this._if(code.slice(3).trim(), path)
		if (code.startsWith('for ')) return this._for(code.slice(4).trim(), path)
		this._dep(code, path)
		return { t: 'expr-raw', v: code }
	}

	_if(cond, path) {
		this._dep(cond, path)
		const ret = { t: 'if', v: cond, b: this._nodes(path, t => t.t === 'ctrl' && (t.v.startsWith('else') || t.v === 'end')) }
		let ptr = ret
		while (this.peek() && this.peek().t === 'ctrl' && this.peek().v.startsWith('else if ')) {
			const elif = this.next().v.slice(8).trim()
			this._dep(elif, path.concat(['elif']))
			const nextElif = { t: 'elif', v: elif, b: this._nodes(path.concat(['elif']), t => t.t === 'ctrl' && (t.v.startsWith('else') || t.v === 'end')) }
			ptr.elif = nextElif
			ptr = nextElif
		}
		if (this.peek() && this.peek().t === 'ctrl' && this.peek().v === 'else') {
			this.next()
			ret.el = { b: this._nodes(path.concat(['el']), t => t.t === 'ctrl' && t.v === 'end') }
		}
		if (this.peek() && this.peek().t === 'ctrl' && this.peek().v === 'end') this.next()
		return ret
	}

	_for(line, path) {
		const m = line.match(/^(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/)
		if (!m) throw new Error(`bad for: ${line}`)
		const [_, k, v, expr] = m
		this._dep(expr, path)
		const save = Object.create(this.locals)
		this.locals = save
		if (v) {
			this.locals[k] = path
			this.locals[v] = path
		}
		else {
			this.locals[k] = path
		}
		const b = this._nodes(path, t => t.t === 'ctrl' && t.v === 'end')
		this.locals = save
		this.next()
		const ret = { t: 'for', v: expr }
		if (v) {
			ret.k = k
			ret.lv = v
		}
		else {
			ret.lv = k
		}
		if (b.length) ret.b = b
		return ret
	}

	pushIndex(k, path) {
		if (!this.index[k]) this.index[k] = []
		this.index[k].push(path)
	}

	_dep(expr, path) {
		expr = expr.replace(/^!+/, '').trim()
		if (expr.startsWith('ro:')) return
		let m = expr.match(/^([^=<>!]+)\s*==\s*(\w+)/)
		if (m) {
			const [ a1, a2 ] = m.slice(1, 3).map(v => v.trim())
			if (!this.locals[a1]) {
				const p = this.locals[a2]
				if (p) this.pushIndex(a1, [ 'f', ...p ])
				return
			}
			else if (!this.locals[a2]) {
				const p = this.locals[a1]
				if (p) this.pushIndex(a2, [ 'f', ...p ])
				return
			}
		}
		m = expr.match(/^(.+)\.\w+\(([^)]*)\)$/)
		if (m) {
			for (let v of m[2].split(/\s*,\s*/)) {
				if (this.locals[v]) {
					this.pushIndex(m[1], this.locals[v])
					return
				}
			}
		}
		const baseExpr = expr.split('|')[0].replace(/\.\w+\([^)]*\)/g, '').trim()
		if (/^\s*\[\s*('[^']*'|"[^"]*")(?:\s*,\s*('[^']*'|"[^"]*"))*\s*\]\s*$/.test(baseExpr)) return
		let cleaned = baseExpr.replace(/"[^"]*"|'[^']*'/g, '').replace(/\.\./g, ' ').replace(/[^a-zA-Z0-9_.$]/g, ' ')
		const vars = cleaned.split(/\s+/).filter(Boolean)
		for (let v of vars) {
			if (v.startsWith('ro:')) continue
			if (/^(true|false|null|undefined|\d+)$/.test(v)) continue
			if (this.locals[v]) continue
			this.pushIndex(v, path)
		}
	}

}

export function build(tokens) {
	return (new Builder(tokens)).run()
}

class TokStat {
	constructor(c) {
		this.c = c					// Contents
		this.l = c.length		// Len
		this.a = false			// Attr
		this.av = false			// Attr val mode
		this.pm = false			// Pre mode
		this.p = 0					// Pos
		this.n = ''					// Node key
		this.q = ''					// Quote
		this.voidTag = ''
		this.nd = []
		this.tok = []
	}
	is(c) {
		return this.peek() == c
	}
	peek(o = 1, l) {
		return l == null ? (this.p + o > this.l ? '' : this.c.slice(this.p, this.p + o)) : (o + l > this.l ? '' : this.c.slice(o, o + l))
	}
	read(o = 1, l) {
		const ret = this.peek(o, l)
		this.p += ret.length
		return ret
	}
	next (n = 1) { this.p += n }
	peekNext(n = 1) { return this.peek(this.p, n) }
	prev(n = 1) { this.p -= n }
	peekPrev(n = 1) { return this.peek(this.p - n, n) }
	isPrevEsc() { return this.peekPrev() == '\\' }
	skipWS() {
		if ((this.a && this.q != '') || this.pm) return
		while (!this.fin()) {
			const c = this.peek()
			if (c == ' ' || c == '\t' || c == '\n' || c == '\r') this.next()
			else break
		}
	}
	skipComment() {
		this.readUntil(c => {
			return c == '#' && !this.isPrevEsc() && this.peekNext() == '}'
		})
	}
	readStr() {
		this.skipWS()
		return this.readWhileStr()
	}
	readWhileStr() {
		let ret = ''
		while (!this.fin()) {
			const c = this.read()
			if (c == ' ') break
			ret += c
		}
		return ret
	}
	readUntil(cond, ws=false) {
		let ret = ''
		while (!this.fin()) {
			!ws && this.skipWS()
			if (cond(this.peek())) break
			ret += this.read()
		}
		return ret
	}
	readUntilStr(str) {
		const i = this.c.indexOf(str, this.p)
		if (i === -1 || this.c.slice(i, i + 1) == '\\') return ''
		return this.read(this.p, i - this.p)
	}
	readTag() {
		return this.readUntil(c => [ '>', ' ' ].includes(c), true)
	}
	readTagEnd() {
		return this.readUntilStr('>')
	}
	readTagValue() {
		return this.readUntil(c => [ '<', '{' ].includes(c) && !this.isPrevEsc(), true)
	}
	readQStr(q) {
		q ||= this.q
		return this.readUntil(c => c == '{' || (c == q && !this.isPrevEsc()), true)
	}
	readAttr() {
		return this.readUntil(c => [ '<', '>', '{', '=' ].includes(c), (this.a && this.q == '') || this.pm)
	}
	endAttr() {
		const nd = {}
		if (this.n) nd.n = this.n
		if (this.nd.length) {
			nd.nd = this.nd
			this.token('attr', nd)
		}
		this.nd = []
		this.n = ''
		this.av = false
	}
	outAttr() {
		this.a = false
		if (this.nd.length) {
			this.token('attr', { nd: this.nd })
		}
		if (this.voidTag) {
			this.token('tag-close', this.voidTag)
			this.voidTag = ''
		}
		this.nd = []
	}
	inTag(tag) {
		this.token('tag-open', tag)
		this.a = true
	}
	outTag(tag) {
		this.outAttr()
		this.token('tag-close', tag)
		this.a = false
		this.pm = false
	}
	nodeOrToken(t, v) {
		this.a ? this.node(t, v) :	this.token(t, v)
	}
	node(t, v) {
		const tok = { t, v }
		this.nd.push(tok)
	}
	token(t, v) {
		const tok = { t, v }
		this.tok.push(tok)
	}
	fin() { return this.p >= this.l }
	d() { d(`>${this.c[this.p]}<`) }
}

export function tokenize(tmpl) {
	const s = new TokStat(tmpl)
	parse(s)
	return s.tok
}

function eraseQEscape(q, str) {
	return str.replace(new RegExp('\\\\' + q, 'g'), q)
}

function parse(s) {
	while (!s.fin()) {
		const sp = s.p
		s.skipWS()
		const ws = s.c.slice(sp, s.p)
		if (s.fin()) break
		const c = s.read()
		if (c == '<') { parseTag(s, c) }
		else if (c == '{') {
			if (s.is('{') && !s.isPrevEsc()) { parseExpr(s, c) }
			else if (s.is('%')) { parseCtrl(s, c) }
			else if (s.is('#')) { s.skipComment() }
			else { parseOther(s, c) }
		}
		else if (c == "'" || c == '"') { parseQStr(s, c) }
		else if (c == '>') { s.outAttr() }
		else { parseOther(s, c, ws) }
	}
}

function parseTag(s, c) {
	if (s.is('/')) {
		s.next()
		s.outTag(s.readTagEnd())
	}
	else {
		const x = s.readTag()
		if (VOID_TAGS.includes(x)) s.voidTag = x
		if (x == 'pre') { s.pm = true }
		DEBUG.t && d(`T: [${c}] >${x}< (${s.peek()})`)
		s.inTag(x)
	}
}

function parseExpr(s, c) {
	s.next()
	const x = eraseQEscape(s.q, s.readUntilStr('}}').trim())
	DEBUG.e && d(`E: [${c}] >${x}<`)
	if (x != '') s.nodeOrToken('expr', x)
	if (!s.av) s.endAttr()
	s.next(2)
}

function parseCtrl(s, c) {
	s.next()
	const x = s.readUntilStr('%}').trim()
	DEBUG.c && d(`C: [${c}] >${x}<`)
	if (/^(if|for|else|end)(\s|$)/.test(x)) {
		s.nodeOrToken('ctrl', x)
	}
	else {
		s.nodeOrToken('exec', x)
	}
	if (x == 'end') s.endAttr()
	s.next(2)
}

function parseQStr(s, c) {
	if (s.q == c) {
		if (s.n) s.endAttr()
		s.q = ''
		return
	}
	let x = s.readQStr(s.q || c)
	DEBUG.q && d(`Q: [${c}] >${x}< (${s.peek()}, ${s.q})`)
	if (x) {
		if (s.q && s.q != c) { x = c + x }
		s.node('text', x)
	}
	if (s.is(c) || s.q) {
		if (s.n) s.endAttr()
		s.next()
		s.q = ''
	}
	else {
		s.q = c
	}
}

function parseOther(s, c, ws = '') {
	if (s.q) {
		const x = s.readQStr(s.q)
		DEBUG.o && d(`O1: [${c}] >${x}< (${s.q})`)
		if (x == '') {
			if (s.is(s.q)) {
				s.next()
				s.q = ''
			}
			if (c != '') s.node('text', c)
			s.endAttr()
			return
		}
		if (x) s.nodeOrToken('text', c + x)	
		if (s.av) { s.endAttr() }
	}
	else {
		let x = c + (s.a ? s.readAttr() : s.readTagValue())
		DEBUG.o && d(`O2: [${c}] >${x}< (${s.q})`)
		if (s.is('=')) {
			s.n = x
			s.next()
			s.av = true
		}
		else {
			x = x.replace(/(\\{\\{|\\}\\}|\\{%|\\%})/g, m => m.replace(/\\/g, ''))
			if (!s.a && !s.pm) {
				x = ws + x
				x = x.replace(/[\r\n\t]+/g, ' ')
			}
			if (x != '') s.nodeOrToken('text', x)
		}
	}
}
