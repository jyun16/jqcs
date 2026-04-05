const d = console.log

class jQ {
	constructor(a) {
		if (a == null) {
			this.e = []
			this.multi = true
			return
		}
		const type = a.constructor.name
		if (type === 'String') {
			const s = a.trim()
			if (s[0] === '<') {
				const div = document.createElement('div')
				div.innerHTML = s
				if (div.children.length > 1) {
					this.e = Array.from(div.children)
					this.multi = true
				}
				else {
					this.e = div.firstChild
					this.multi = false
				}
			}
			else if (s[0] === '#' && !s.includes(' ') && !s.includes('.')) {
				this.selector = s
				this.e = document.querySelector(s)
				this.multi = false
			}
			else {
				this.selector = s
				this.e = Array.from(document.querySelectorAll(s))
				this.multi = true
			}
		}
		else {
			this.e = a
			this.multi = false
		}
		this.type = type
	}
	el(i) {
		const e = this.multi ? this.e : (this.e != null ? [this.e] : [])
		if (i == null) return e
		return i < 0 ? e[i + e.length] : e[i]
	}
	get(i) {
		return this.el(i)
	}
	eq(index) {
		const els = this.el()
		return new jQArray(els[index] ? [els[index]] : [])
	}
	html(html) {
		const els = this.el()
		if (html != null) {
			for (let i = 0, l = els.length; i < l; i++) els[i].innerHTML = html
			return this
		}
		return els[0]?.innerHTML
	}
	oh() {
		return this.el(0)?.outerHTML
	}
	outerHTML() {
		return this.el(0)?.outerHTML
	}
	text(val) {
		const els = this.el()
		if (val !== undefined) {
			for (let i = 0, l = els.length; i < l; i++) els[i].textContent = val
			return this
		}
		let res = ''
		for (let i = 0, l = els.length; i < l; i++) res += (els[i]?.textContent ?? '')
		return res
	}
	append(a) {
		const els = this.el()
		const isJQ = a instanceof jQ
		for (let i = 0, l = els.length; i < l; i++) {
			if (isJQ) els[i].append(a.el(0))
			else els[i].insertAdjacentHTML('beforeend', a)
		}
		return this
	}
	prepend(a) {
		const els = this.el()
		const isJQ = a instanceof jQ
		for (let i = 0, l = els.length; i < l; i++) {
			if (isJQ) els[i].prepend(a.el(0))
			else els[i].insertAdjacentHTML('afterbegin', a)
		}
		return this
	}
	before(a) {
		const els = this.el()
		const isJQ = a instanceof jQ
		for (let i = 0, l = els.length; i < l; i++) {
			if (isJQ) els[i].before(a.el(0))
			else els[i].insertAdjacentHTML('beforebegin', a)
		}
		return this
	}
	after(a) {
		const els = this.el()
		const isJQ = a instanceof jQ
		for (let i = 0, l = els.length; i < l; i++) {
			if (isJQ) els[i].after(a.el(0))
			else els[i].insertAdjacentHTML('afterend', a)
		}
		return this
	}
	remove() {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].remove()
		return this
	}
	empty() {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].innerHTML = ''
		return this
	}
	clone() {
		const els = this.el()
		const clones = []
		for (let i = 0, l = els.length; i < l; i++) clones.push(els[i].cloneNode(true))
		return new jQArray(clones)
	}
	replaceWith(content) {
		const newNodes = []
		const els = this.el()
		const isJQ = content instanceof jQ
		let frag = null
		if (!isJQ) frag = document.createRange().createContextualFragment(content)
		for (let i = 0, l = els.length; i < l; i++) {
			const e = els[i]
			const newNode = isJQ ? content.el(0) : frag.firstElementChild.cloneNode(true)
			if (e.parentNode && newNode) {
				e.replaceWith(newNode)
				newNodes.push(newNode)
			}
		}
		this.e = this.multi ? newNodes : newNodes[0]
		return this
	}
	wrap(wrapper) {
		const els = this.el()
		const isJQ = wrapper instanceof jQ
		const isStr = typeof wrapper === 'string'
		const isEl = wrapper?.nodeType === 1
		const isArr = Array.isArray(wrapper) || wrapper?.constructor?.name === 'NodeList'
		for (let i = 0, l = els.length; i < l; i++) {
			const e = els[i]
			let wrapEl
			if (isJQ) wrapEl = wrapper.el(0)?.cloneNode(true)
			else if (isStr) {
				if (wrapper.trim()[0] === '<') {
					const t = document.createElement('template')
					t.innerHTML = wrapper.trim()
					wrapEl = t.content.firstElementChild?.cloneNode(true)
				}
				else {
					wrapEl = document.createElement(wrapper)
				}
			}
			else if (isEl) wrapEl = wrapper.cloneNode(true)
			else if (isArr) wrapEl = wrapper[0]?.cloneNode(true)
			if (!wrapEl || !e.parentNode) continue
			let inner = wrapEl
			while (inner.firstElementChild) inner = inner.firstElementChild
			e.parentNode.insertBefore(wrapEl, e)
			inner.appendChild(e)
		}
		return this
	}
	wrapAll(html) {
		const els = this.el()
		if (!els.length) return this
		const wrapper = document.createRange().createContextualFragment(html).firstElementChild
		if (!wrapper) return this
		els[0].before(wrapper)
		let target = wrapper
		while (target.firstElementChild) target = target.firstElementChild
		for (let i = 0, l = els.length; i < l; i++) target.append(els[i])
		return this
	}
	unwrap(selector = null) {
		const parents = new Set()
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const p = els[i]?.parentNode
			if (!p || !p.parentNode || p.nodeType !== 1) continue
			if (p.tagName === 'BODY' || p.tagName === 'HTML') continue
			if (selector && !p.matches(selector)) continue
			parents.add(p)
		}
		parents.forEach(p => {
			const gp = p.parentNode
			while (p.firstChild) gp.insertBefore(p.firstChild, p)
			gp.removeChild(p)
		})
		return this
	}
	find(selector) {
		const found = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const items = els[i].querySelectorAll(selector)
			for (let j = 0, jl = items.length; j < jl; j++) found.push(items[j])
		}
		return new jQArray([...new Set(found)])
	}
	parents(selector) {
		const found = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			let p = els[i]?.parentElement
			while (p) {
				if (!selector || p.matches(selector)) found.push(p)
				p = p.parentElement
			}
		}
		return new jQArray([...new Set(found)])
	}
	parent() {
		const found = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			if (els[i].parentElement) found.push(els[i].parentElement)
		}
		return new jQArray([...new Set(found)])
	}
	children(selector) {
		const found = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const ch = els[i].children
			for (let j = 0, jl = ch.length; j < jl; j++) {
				if (!selector || ch[j].matches(selector)) found.push(ch[j])
			}
		}
		return new jQArray(found)
	}
	child(i = 0) {
		return this.children().eq(i)
	}
	next() {
		const n = this.el(0)?.nextElementSibling
		return new jQArray(n ? [n] : [])
	}
	prev() {
		const p = this.el(0)?.previousElementSibling
		return new jQArray(p ? [p] : [])
	}
	nextAll(selector) {
		const found = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			let n = els[i].nextElementSibling
			while (n) {
				if (!selector || n.matches(selector)) found.push(n)
				n = n.nextElementSibling
			}
		}
		return new jQArray([...new Set(found)])
	}
	prevAll(selector) {
		const found = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			let p = els[i].previousElementSibling
			while (p) {
				if (!selector || p.matches(selector)) found.push(p)
				p = p.previousElementSibling
			}
		}
		return new jQArray([...new Set(found)])
	}
	first() {
		return this.eq(0)
	}
	last() {
		return this.eq(this.el().length - 1)
	}
	filter(selector) {
		const res = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			if (els[i].matches(selector)) res.push(els[i])
		}
		return new jQArray(res)
	}
	is(selector) {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			if (els[i].matches(selector)) return true
		}
		return false
	}
	not(selector) {
		const res = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			if (!els[i].matches(selector)) res.push(els[i])
		}
		return new jQArray(res)
	}
	has(selector) {
		const res = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			if (els[i].querySelector(selector)) res.push(els[i])
		}
		return new jQArray(res)
	}
	closest(selector) {
		const found = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const f = els[i].closest(selector)
			if (f) found.push(f)
		}
		return new jQArray([...new Set(found)])
	}
	hasAttr(key) {
		return this.el(0)?.hasAttribute(key)
	}
	attr(key, value) {
		const els = this.el()
		if (typeof key === 'object') {
			const entries = Object.entries(key)
			for (let i = 0, l = els.length; i < l; i++) {
				for (let j = 0, jl = entries.length; j < jl; j++) els[i].setAttribute(entries[j][0], entries[j][1])
			}
			return this
		}
		if (value != null) {
			for (let i = 0, l = els.length; i < l; i++) els[i].setAttribute(key, value)
			return this
		}
		return els[0]?.getAttribute(key)
	}
	prop(key, value) {
		const els = this.el()
		if (value != null) {
			for (let i = 0, l = els.length; i < l; i++) els[i][key] = value
			return this
		}
		return els[0]?.[key]
	}
	removeAttr(key) {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].removeAttribute(key)
		return this
	}
	val(value) {
		const els = this.el()
		if (value != null) {
			for (let i = 0, l = els.length; i < l; i++) els[i].value = value
			return this
		}
		return els[0]?.value
	}
	data(name, value) {
		return value != null ? this.attr(`data-${name}`, value) : this.attr(`data-${name}`)
	}
	id(id = null) {
		if (id != null) this.attr('id', id)
		return this.attr('id')
	}
	classes() {
		return Array.from(this.el(0)?.classList.values() || [])
	}
	hasClass(cls) {
		return this.el(0)?.classList.contains(cls)
	}
	addClass(cls) {
		const classes = Array.isArray(cls) ? cls : cls.trim().split(/\s+/)
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			if (els[i]) els[i].classList.add(...classes)
		}
		return this
	}
	replaceClass(from, to) {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].classList.replace(from, to)
		return this
	}
	removeClass(cls) {
		const classes = Array.isArray(cls) ? cls : cls.trim().split(/\s+/)
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			if (els[i]) els[i].classList.remove(...classes)
		}
		return this
	}
	hide() {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].style.display = 'none'
		return this
	}
	show() {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const e = els[i]
			if (e.style.display === 'none') e.style.display = ''
			if (window.getComputedStyle(e).display === 'none') e.style.display = 'block'
		}
		return this
	}
	toggle(cb) {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const e = els[i]
			const isHidden = window.getComputedStyle(e).display === 'none'
			if (isHidden) {
				if (e.style.display === 'none') e.style.display = ''
				if (window.getComputedStyle(e).display === 'none') e.style.display = 'block'
			}
			else {
				e.style.display = 'none'
			}
			if (cb) cb(isHidden)
		}
		return this
	}
	toggleClass(cls, force) {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].classList.toggle(cls, force)
		return this
	}
	css(key, val) {
		const els = this.el()
		if (!els.length) return val !== undefined ? this : null
		if (typeof key === 'object') {
			for (const k in key) {
				const v = key[k]
				const isVar = k.startsWith('--')
				for (let i = 0, l = els.length; i < l; i++) {
					if (isVar) els[i].style.setProperty(k, v)
					else els[i].style[k] = v
				}
			}
			return this
		}
		if (val !== undefined) {
			const isVar = key.startsWith('--')
			for (let i = 0, l = els.length; i < l; i++) {
				if (isVar) els[i].style.setProperty(key, val)
				else els[i].style[key] = val
			}
			return this
		}
		const e = els[0]
		const styles = window.getComputedStyle(e)
		return key.startsWith('--') ? (e.style.getPropertyValue(key) || styles.getPropertyValue(key)) : (styles[key] || e.style[key])
	}
	on(event, selectorOrHandler, handler) {
		const isDelegate = typeof selectorOrHandler === 'string'
		const fn = isDelegate ? handler : selectorOrHandler
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const e = els[i]
			if (!e._ev) e._ev = {}
			if (!e._ev[event]) e._ev[event] = []
			const wrapper = isDelegate
				? function(ev) {
						const target = ev.target.closest(selectorOrHandler)
						if (target && e.contains(target)) fn.call(target, ev)
					}
				: fn
			e.addEventListener(event, wrapper)
			e._ev[event].push({ original: fn, wrapper })
		}
		return this
	}
	off(event, func) {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const e = els[i]
			if (!e._ev || !e._ev[event]) continue
			e._ev[event] = e._ev[event].filter(item => {
				if (!func || item.original === func) {
					e.removeEventListener(event, item.wrapper)
					return false
				}
				return true
			})
		}
		return this
	}
	one(event, func, options) {
		const handler = function(e) {
			func.call(this, e)
			e.currentTarget.removeEventListener(e.type, handler, options)
		}
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].addEventListener(event, handler, options)
		return this
	}
	hover(enter, leave) {
		return this.on('mouseenter', enter).on('mouseleave', leave)
	}
	trigger(eventName) {
		const evt = new window.Event(eventName, { bubbles: true, cancelable: true })
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) els[i].dispatchEvent(evt)
		return this
	}
	serialize() {
		return $.query(this.serializeObject())
	}
	serializeObject() {
		const e = this.el(0)
		if (!e) return {}
		const fd = new FormData()
		const inputs = e.querySelectorAll('[name]')
		for (let i = 0, l = inputs.length; i < l; i++) {
			const el = inputs[i]
			if (el.type === 'checkbox' || el.type === 'radio') {
				if (el.checked) fd.append(el.name, el.value)
			}
			else {
				fd.append(el.name, el.value)
			}
		}
		return $.form2obj(fd)
	}
	debug() {
		console.log(this.outerHTML())
	}
	each(func) {
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) func.call(els[i], i, els[i])
		return this
	}
	map(fn) {
		const results = []
		const els = this.el()
		for (let i = 0, l = els.length; i < l; i++) {
			const r = fn.call(els[i], i, els[i])
			if (r != null) {
				if (Array.isArray(r)) results.push(...r)
				else results.push(r)
			}
		}
		return new jQArray(results)
	}
	click(fn) {
		return this.on('click', fn)
	}
	change(fn) {
		return this.on('change', fn)
	}
	submit(fn) {
		return this.on('submit', fn)
	}
	focus(fn) {
		if (fn) return this.on('focus', fn)
		this.el(0)?.focus()
		return this
	}
	blur(fn) {
		if (fn) return this.on('blur', fn)
		this.el(0)?.blur()
		return this
	}
	width(v) {
		const els = this.el()
		if (v != null) {
			const val = typeof v === 'number' ? v + 'px' : v
			for (let i = 0, l = els.length; i < l; i++) els[i].style.width = val
			return this
		}
		const e = els[0]
		const val = e?.style.width || (e ? getComputedStyle(e).width : 0)
		return parseFloat(val) || 0
	}
	height(v) {
		const els = this.el()
		if (v != null) {
			const val = typeof v === 'number' ? v + 'px' : v
			for (let i = 0, l = els.length; i < l; i++) els[i].style.height = val
			return this
		}
		const e = els[0]
		const val = e?.style.height || (e ? getComputedStyle(e).height : 0)
		return parseFloat(val) || 0
	}
}

class jQArray extends jQ {
	constructor(array) {
		super(array.length > 0 ? array[0] : null)
		this.e = array
		this.multi = true
		return new Proxy(this, {
			get(target, prop) {
				if (typeof prop === 'symbol') return target[prop]
				const idx = Number(prop)
				if (Number.isInteger(idx)) return target.el(idx)
				if (prop === 'length') return target.e.length
				return target[prop]
			}
		})
	}
	*[Symbol.iterator]() {
		yield* this.e
	}
	get() {
		return this.el()
	}
	each(fn) {
		this.e.forEach((el, i) => fn(el, i))
		return this
	}
	$each(fn) {
		this.e.forEach((el, i) => fn(new jQ(el), i))
		return this
	}
	map(fn) {
		return this.e.map(fn)
	}
	$map(fn) {
		return this.e.map((el, i) => fn(new jQ(el), i))
	}
}

const $ = function(selector) {
	if (typeof selector === 'function') {
		if (document.readyState !== 'loading') {
			selector($)
		}
		else {
			document.addEventListener('DOMContentLoaded', () => selector($))
		}
		return
	}
	const obj = new jQ(selector)
	return new Proxy(obj, {
		get(target, prop) {
			if (typeof prop === 'symbol') return target[prop]
			const idx = Number(prop)
			if (Number.isInteger(idx)) return target.el(idx)
			if (prop === 'length') return target.multi ? target.e.length : (target.e != null ? 1 : 0)
			return target[prop]
		}
	})
}

$.fn = jQ.prototype

$.fn.ready = function(fn) {
	if (document.readyState !== 'loading') {
		fn($)
	}
	else {
		document.addEventListener('DOMContentLoaded', () => fn($))
	}
	return this
}

$.plugin = function(name, fn) {
	if (typeof name === 'object') {
		for (const [k, v] of Object.entries(name)) {
			if (k in $.fn) throw new Error(`Method ${k} already exists`)
			$.fn[k] = v
		}
	}
	else {
		$.fn[name] = fn
	}
}

$.query = function(obj) {
	return Object.entries(obj).map(([k, v]) => {
		if (Array.isArray(v)) return v.map(x => `${encodeURIComponent(k)}=${encodeURIComponent(x)}`).join('&')
		return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
	}).join('&')
}

$.escapeHTML = function(s) {
	return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

$.form2obj = function(fd) {
	const ret = {}
	for (const [k, v] of fd.entries()) {
		if (ret[k]) {
			if (!Array.isArray(ret[k])) ret[k] = [ret[k]]
			ret[k].push(v)
		}
		else {
			ret[k] = v
		}
	}
	return ret
}

export default $
