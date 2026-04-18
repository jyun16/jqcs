const d = console.log

export function df(f) {
	const div = document.createElement('div')
	div.appendChild(f.cloneNode(true))
	d(div.innerHTML)
}

export function ddom(...args) {
	console.log(...args.map(x => isDOM(x) ? dom2html(x) : x))
}

export function isDOM(x) {
	return x && typeof x === 'object' && typeof x.nodeType === 'number'
}

export function child2frag(el) {
	const f = document.createDocumentFragment()
	while (el.firstChild) {
		f.append(el.firstChild)
	}
	return f
}

export function dom2html(dom) {
	if (isFragmentNode(dom)) {
		return frag2html(dom)
	}
	else {
		return dom.outerHTML
	}
}

export function frag2html(frag) {
	const div = document.createElement('div')
	div.appendChild(frag.cloneNode(true))
	return div.outerHTML
}

export function isEmpty(v) {
	return !v || (typeof v === 'object' && Object.keys(v).length === 0)
}

export function isEqual(a, b) {
	if (a === b) return true
	if (a == null || b == null) return false
	if (typeof a !== 'object' || typeof b !== 'object') return false
	if (Array.isArray(a)) {
		if (!Array.isArray(b) || a.length !== b.length) return false
		for (let i = 0, len = a.length; i < len; i++) {
			if (!isEqual(a[i], b[i])) return false
		}
		return true
	}
	const keys = Object.keys(a)
	if (keys.length !== Object.keys(b).length) return false
	for (let i = 0, len = keys.length; i < len; i++) {
		const k = keys[i]
		if (!Object.prototype.hasOwnProperty.call(b, k) || !isEqual(a[k], b[k])) return false
	}
	return true
}

export const toCamel = (v) => {
	return v.replace(/[-_ ]+(.)/g, (m, c) => c.toUpperCase()).replace(/^(.)/, (m, c) => c.toLowerCase())
}

export const toSnake = (v) => {
	return v.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`).replace(/[- ]+/g, '_').replace(/^_+|_+$/g, '')
}

export const toKebab = (v) => {
	return v.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/[_ ]+/g, '-').replace(/^-+|-+$/g, '')
}

export function getObjVal(obj, path) {
	let cur = obj
	let start = 0
	let end = path.indexOf('.')
	while (end !== -1) {
		if (cur == null) return undefined
		cur = cur[path.substring(start, end)]
		start = end + 1
		end = path.indexOf('.', start)
	}
	if (cur == null) return undefined
	return cur[path.substring(start)]
}

export function diffObj(keys, obj, old) {
	const created = {}
	const changed = {}
	const removed = {}
	for (let i = 0, len = keys.length; i < len; i++) {
		const path = keys[i]
		const val = getObjVal(obj, path)
		const prev = getObjVal(old, path)
		if (val !== undefined && prev === undefined) {
			created[path] = val
		}
		else if (val === undefined && prev !== undefined) {
			removed[path] = prev
		}
		else if (!isEqual(val, prev)) {
			changed[path] = val
		}
	}
	return { created, changed, removed }
}

export function deepClone(obj) {
	if (obj === null || typeof obj !== 'object') return obj
	if (Array.isArray(obj)) return obj.map(deepClone)
	const out = {}
	for (const k in obj) out[k] = deepClone(obj[k])
	return out
}

export function setMapVal(obj, key, value) {
	const path = key.split('.')
	let cur = obj
	for (let i = 0; i < path.length; i++) {
		const k = path[i]
		if (i === path.length - 1) {
			cur[k] = value
		}
		else {
			if (!(k in cur) || typeof cur[k] !== 'object') {
				cur[k] = /^\d+$/.test(path[i + 1]) ? [] : {}
			}
			cur = cur[k]
		}
	}
	return obj
}

export const filters = {
	upper: s => s.toUpperCase(),
	lower: s => String(s).toLowerCase(),
	trim: s => String(s).trim(),
	omit: (s, len, suf = '…') => {
		s = String(s)
		len = parseInt(len)
		if (s.length <= len) return s
		return s.slice(0, len) + suf
	},
	round: n => Math.round(Number(n)),
	floor: n => Math.floor(Number(n)),
	ceil: n => Math.ceil(Number(n)),
	fixed: (n, d) => Number(n).toFixed(parseInt(d)),
	percent: (n, d = 1) => (Number(n) * 100).toFixed(d) + '%',
	date: (v, format = 'YYYY-MM-DD') => {
		const d = new Date(v)
		const y = d.getFullYear()
		const m = (d.getMonth() + 1).toString().padStart(2, '0')
		const day = d.getDate().toString().padStart(2, '0')
		const h = d.getHours().toString().padStart(2, '0')
		const min = d.getMinutes().toString().padStart(2, '0')
		return format .replace('YYYY', y).replace('MM', m).replace('DD', day).replace('HH', h).replace('mm', min)
	},
	datetime: v => filters.date(v, 'YYYY-MM-DD HH:mm'),
	json: v => JSON.stringify(v),
	comma: n => {
		const x = Number(n)
		return isNaN(x) ? '' : x.toLocaleString()
	},
	join: (val, sep = ',') => {
		if (!Array.isArray(val)) return ''
		return val.join(sep)
	},
}

const ELEMENT_NODE = 1
const ATTRIBUTE_NODE = 2
const TEXT_NODE = 3
const COMMENT_NODE = 8
const DOCUMENT_NODE = 9
const DOCUMENT_FRAGMENT_NODE = 11

export const isElementNode = el => el.nodeType == ELEMENT_NODE 
export const isAttributeNode = el => el.nodeType == ATTRIBUTE_NODE
export const isTextNode = el => el.nodeType == TEXT_NODE
export const isCommentNode = el => el.nodeType == COMMENT_NODE
export const isDocumentNode = el => el.nodeType == DOCUMENT_NODE
export const isFragmentNode = el => el.nodeType == DOCUMENT_FRAGMENT_NODE

export	function evalExpr(expr, data = {}) {
	return new Function('data', `with (data) { return (${expr}) }`)(data)
}

export function parseAttributes(str) {
	const re = /([^\s=]+)\s*=\s*(['"])(.*?)\2/g
	const result = {}
	let m
	while ((m = re.exec(str))) {
		const [, key, , val] = m
		result[key] = val
	}
	return result
}
