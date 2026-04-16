import $ from './jq.js'
import jQSON from './jqson.js'
import { df, isEmpty, toCamel, child2frag, setMapVal } from './jq-utils.js'
import { jqpug } from './jq-pug.js'
import jQT, { buildByHTML } from './jqt4dom.js'

const d = console.log
// import { d, dh } from 'wiz/debug.js'

const jQC = (function() {

	const defs = {}
	const ids = {}
	const names = {}
	const jqcIds = {}
	const idSeq = {}
	const replaceEvent = { stop: [ 'click', 'e.stopPropagation()' ] }

	function define(name, def) {
		if (!name || typeof def != 'object') return
		def.html = def.pug ? jqpug(def.pug) : def.html
		def.ast = def.ast
		def.css = def.css || ''
		def.globalCss = def.globalCss || ''
		def.p = def.p || {}
		def.init = def.init || function() {}
		def.render = def.render || function() {}
		def.methods = def.methods || {}
		defs[name] = def
	}

	class jQCList {
		constructor(nodes) {
			this._nodes = Array.isArray(nodes) ? nodes : Array.from(nodes)
			return new Proxy(this, {
				get(self, prop, receiver) {
					if (typeof prop === 'string' && /^[0-9]+$/.test(prop)) return self._nodes[prop]
					if (prop in self) return Reflect.get(self, prop, receiver)
					const first = self._nodes[0]
					if (first && prop in first) {
						const val = first[prop]
						return typeof val === 'function' ? val.bind(first) : val
					}
					return undefined
				}
			})
		}
		*[Symbol.iterator]() {
			yield* this._nodes
		}
		remove() {
			for (const $el of this._nodes) {
				$el.remove()
				const id = $el.attr('jqc-id')
				delete jqcIds[id]
			}
		}
		empty() {
			for (const $el of this._nodes) {
				const el = $el.el(0)
				if (!el) continue
				const id = el.getAttribute('jqc-id')
				delete jqcIds[id]
				el.removeAttribute('jqc-id')
				el.innerHTML = ''
			}
			return this
		}
		async ready() {
			const promises = this._nodes.map(n => jqcIds[n.attr('jqc-id')]?._ready).filter(p => p)
			await Promise.all(promises)
			return this
		}
		render(...args) {
			for (const $el of this._nodes) $el.render(...args)
			return this
		}
	}

	const attachSlot = (el, target) => {
		if (!isEmpty(el._slots)) {
			for (const n in el._slots) {
				const slotTag = target.querySelector(`slot[name="${n}"]`)
				if (slotTag) {
					slotTag.innerHTML = ''
					slotTag.appendChild(el._slots[n])
				}
			}
		}
		if (el._slot) {
			const defSlot = target.querySelector('slot:not([name])')
			if (defSlot) {
				defSlot.innerHTML = ''
				defSlot.appendChild(el._slot)
			}
		}
	}

	function bind(name, compOrCaller, caller) {
		let comp = name
		if (typeof compOrCaller == 'string') { comp = compOrCaller }
		else { caller = compOrCaller }
		const def = defs[comp]
		if (!def) return
		const rootEl = caller ? caller.el(0) : document
		const boundNodes = rootEl.querySelectorAll(`${name}[jqc-id]`)
		const alive = []
		for (const el of boundNodes) {
			const id = el.getAttribute('jqc-id')
			if (jqcIds[id]) alive.push(jqcIds[id])
		}
		const nodes = rootEl.querySelectorAll(`${name}:not([jqc-id])`)
		if (nodes.length == 0) return new jQCList(alive)
		idSeq[name] = idSeq[name] || 0
		let ret = []
		const hasSlot = (def.html && def.html.includes('<slot')) || (def.ast && JSON.stringify(def.ast).includes('"v":"slot'))
		function render(def, $el) {
			const el = $el.el(0)
			if (typeof def.preRender === 'function') def.preRender.call($el)
			$el._tplData = Object.assign(Object.create(null), $el.p, { attrs: $el.attrs })
			if (!$el._mountedDOM) {
				const frag = jQT.go($el._parsed, $el._tplData)
				attachSlot(el, frag)
				el.innerHTML = ''
				el.appendChild(frag)
				$el._mountedDOM = el.firstChild
				bindEvents($el)
			}
			else {
				if (hasSlot) {
					const slots = {}
					el.querySelectorAll('[slot]').forEach(el => {
						slots[el.getAttribute('slot')] = child2frag(el)
					})
					if (!isEmpty(slots)) { el._slots = slots }
					el._slot = child2frag(el.querySelector('slot'))
				}
				jQT.go($el._parsed, $el._tplData)
				attachSlot(el, el)
				bindEvents($el)
			}
			if (typeof def.postRender === 'function') def.postRender.call($el)
		}
		for (const el of nodes) {
			const id = name + '-' + idSeq[name]++
			const $el = $(el)
			if (hasSlot) {
				const slots = {}
				el.querySelectorAll('[slot]').forEach(el => {
					const f = document.createDocumentFragment()
					f.append(el)
					slots[el.getAttribute('slot')] = f
				})
				if (!isEmpty(slots)) { el._slots = slots }
				el._slot = child2frag(el)
			}
			el.innerHTML = ''
			$el.p = JSON.parse(JSON.stringify(def.p || {}))
			$el.attrs = ''
			const pKeys = Object.keys(def.p)
			for (const attr of [...el.attributes]) {
				const k = attr.name
				let raw = attr.value
				let val = raw
				if (k.startsWith('p-')) {
					const pkey = toCamel(k.slice(2))
					try {
						if (/^\w+\(\)$/.test(raw)) {
							val = globalThis[raw.slice(0, -2)]?.()
						}
						else {
							val = jQSON.parse(raw)
						}
					} catch (e) {}
					setMapVal($el.p, pkey, val)
					el.removeAttribute(k)
				}
				else if (!k.startsWith('@cb-') && !k.startsWith('jqc-cb-')) {
					try { val = JSON.parse(raw) } catch (e) {}
					if (k == 'class' && Array.isArray(val)) {
						raw = val.join(' ')
					}
					if (k == 'style' && typeof val == 'object' && val != null) {
						raw = Object.entries(val).map(([a, b]) => `${a.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${b}`).join(';')
					}
					$el.attrs += ` ${k}="${raw}"`
					if (pKeys.includes(k)) $el.p[k] = val
					el.removeAttribute(k)
				}
				if (k == 'id') {
					ids[val] = $el
				}
				else if (k == 'name') {
					names[val] = $el
				}
			}
			Object.assign($el, def.methods)
			bindCB($el, el)
			$el.attr('jqc-id', id)
			jqcIds[id] = $el
			const parsed = def.ast ? def.ast : buildByHTML(def.html)
			$el._caller = caller
			$el._parsed = parsed
			$el._index = parsed.nodes
			$el.attrs = $el.attrs.trim()
			$el._domMap = {}
			$el.stash = {}
			$el.render = () => render(def, $el)
			const initRet = def.init.call($el)
			if (initRet instanceof Promise) {
				$el._ready = initRet
			}
			injectStyle(def.css, name, id, false)
			injectStyle(def.globalCss, name, id, true)
			ret.push($el)
		}
		return new jQCList([...alive, ...ret])
	}

	function binds(...tags) {
		let caller = null
		let targetTags = tags
		if (Array.isArray(tags[0])) {
			targetTags = tags[0]
			caller = tags[1]
		}
		let allNodes = []
		for (const tag of targetTags) {
			const list = bind(tag, caller)
			if (list) allNodes.push(...list._nodes)
		}
		return new jQCList(allNodes)
	}

	function render($binds) {
		Object.values($binds).forEach($el => $el.render())
	}

	const renderQueue = new Set()
	let curRender = false
	function queueRender($el) {
		renderQueue.add($el)
		if (curRender) return curRender
		curRender = Promise.resolve().then(() => {
			for (const $el of renderQueue) $el.render()
			renderQueue.clear()
			curRender = null
		})
		return curRender
	}

	function getById(id) {
		return ids[id]
	}

	function getByName(name) {
		return names[name]
	}

	function callMethod(target, method, argsStr, e) {
		while (target && typeof target[method] !== 'function') {
			target = target._caller
		}
		if (!target || typeof target[method] !== 'function') {
			if (method.startsWith('e.')) {
				(new Function('e', `${method}()`))(e)
			}
			return
		}
		try {
			const argsFunc = new Function('e', `return [${argsStr}]`)
			const args = argsFunc(e)
			return target[method].apply(target, args)
		} catch (err) {
			console.warn(err)
		}
	}

	function bindEvents($el) {
		const nodes = $el.find('*').el()
		const compTags = Object.keys(defs).join(',')
		for (const node of nodes) {
			if (compTags) {
				const closestComp = node.closest(compTags)
				if (closestComp && closestComp !== $el.el(0)) continue
			}
			if (/^j-/.test(node.tagName.toLowerCase())) continue
			if (!node.handlers) node.handlers = new Set()
			for (const attr of Array.from(node.attributes)) {
				let attrName = attr.name
				let attrVal = attr.value
				if (attrName.startsWith('@')) {
					let directive = attrName.slice(1)
					node.removeAttribute(attrName)
					if (attrVal == '' && directive in replaceEvent) {
						[ directive, attrVal ] = replaceEvent[directive]
					}
					attrName = `jqc-on-${directive}`
					node.setAttribute(attrName, attrVal)
				}
				if (attrName.startsWith('jqc-on-')) {
					const event = attrName.slice(7)
					const key = `${event}:${attrVal}`
					if (node.handlers.has(key)) continue
					node.handlers.add(key)
					const m = attrVal.match(/^([\w\._-]+)\((.*)\)$/)
					const method = m ? m[1] : attrVal
					const argsStr = m ? m[2] : ''
					if (event == 'typed') {
						let timer = null
						node.addEventListener('input', e => {
							clearTimeout(timer)
							timer = setTimeout(() => {
								callMethod($el, method, argsStr, e)
							}, 300)
						})
						continue
					}
					else {
						node.addEventListener(event, e => {
							callMethod($el, method, argsStr, e)
						})
					}
				}
			}
		}
	}

	function callMethodCB($self, func, $this, ...args) {
		if (typeof $self[func] == 'function') {
			return $self[func].apply($this, args)
		}
	}

	function bindCB($el, el) {
		const cb = {}
		for (const attr of el.attributes) {
			const name = attr.name
			if (name.startsWith('@cb-') || name.startsWith('jqc-cb-')) {
				const key = name.replace(/(@cb-|jqc-cb-)/, '')
				cb[key] = attr.value
				el.removeAttribute(attr.name)
			}
		}
		$el.cb = function(k, ...args) {
			let method = cb[k]
			if (!method) return
			method = method.replace(/(\(.*\))?$/, '')
			try {
				if ($el._caller && typeof $el._caller[method] == 'function') {
					return callMethodCB($el._caller, method, $el, ...args)
				}
				return callMethodCB(globalThis, method, $el, ...args)
			} catch (e) {}
		}
	}

	const injectedStyles = new Set()
	function injectStyle(css, name, id, isGlobal = false) {
		const trimmed = css.trim()
		if (!trimmed) return
		const cacheKey = isGlobal ? `g_${name}` : `s_${id}`
		if (injectedStyles.has(cacheKey)) return
		injectedStyles.add(cacheKey)
		const style = document.createElement('style')
		if (isGlobal) {
			style.setAttribute('jqc-global', name)
			style.textContent = trimmed
		}
		else {
			const scoped = trimmed.replace(/(^|\})\s*([^\{]+)/g, (_, a, b) => {
				return a + ' ' + b.split(',').map(s => {
					s = s.trim()
					if (s.startsWith('this')) {
						return `[jqc-id="${id}"]${s.substring(4)}`
					}
					return `[jqc-id="${id}"] ${s}`
				}).join(', ')
			})
			style.setAttribute('jqc-style', id)
			style.textContent = scoped
		}
		document.head.appendChild(style)
	}

	return { define, bind, binds, render, queueRender, getById, getByName }
})()

jQC.EXT = 'jqc.min.js'
jQC. PATH = '../jqc/'

const IMPORTS = {
	dialog: [ 'dialog', 'alert', 'confirm', 'prompt' ],
	form: [ 'form', 'input', 'password', 'search', 'textarea', 'radio', 'checkbox', 'select', 'mselect', 'rich-select' ],
}
const IMPORTED = new Set()

jQC.import = async function (...tags) {
	for (const tag of tags) {
		await import(`${jQC.PATH}${tag}.${jQC.EXT}`)
	}
}

jQC.imports = async function (name) {
	if (IMPORTED.has(name)) return
	IMPORTED.add(name)
	const f = IMPORTS[name].map(x => 'j-' + x)
	if (name == 'form') return jQC.importWithPath('form', f)
	return jQC.import(...f)
}

jQC.importWithPath = async function (path, tags, min = true) {
	if (!Array.isArray(tags)) tags = [ tags ]
	if (path) path = path + '/'
	for (const tag of tags) {
		await import(`${jQC.PATH}${path}${tag}.${jQC.EXT}`)
	}
}

jQC.overlay = {
	active: null,
	handler: null,
	overlay: null,
	open(comp, opts = {}) {
		if (this.active) this.close()
		this.active = comp
		opts = Object.assign({ overlay: true, escClose: true, onClose: null }, opts)
		if (opts.overlay) {
			this.overlay = document.createElement('div')
			this.overlay.style = `position: fixed;top: 0;left: 0;right: 0;bottom: 0;background: rgba(0,0,0,0.4);z-index: 9999;`
			this.overlay.addEventListener('mousedown', () => {
				comp.close()
				if (typeof opts.onClose == 'function') opts.onClose()
				this.close()
			})
			document.body.appendChild(this.overlay)
			comp.css({ 'z-index': 10000, 'position': 'relative' })
		}
		this.handler = (e) => {
			if (e.key == 'Escape' && opts.escClose) {
				comp.close()
				if (typeof opts.onClose == 'function') opts.onClose()
				this.close()
			}
		}
		document.addEventListener('keydown', this.handler)
	},
	close() {
		if (this.overlay) {
			document.body.removeChild(this.overlay)
			this.overlay = null
		}
		if (this.handler) {
			document.removeEventListener('keydown', this.handler)
			this.handler = null
		}
		this.active = null
	}
}

export default jQC
