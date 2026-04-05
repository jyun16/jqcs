const d = console.log

const jQTSimple = (function() {

	function render(node, data) {
		if (node.t === 'text') return node.v
		if (node.t === 'expr') return evalExpr(node.v, data)
		if (node.t === 'if') {
			if (evalExpr(node.c, data)) return node.b.map(n => render(n, data)).join('')
			for (const e of node.elif || []) {
				if (evalExpr(e.c, data)) return e.b.map(n => render(n, data)).join('')
			}
			if (node.eb) return node.eb.map(n => render(n, data)).join('')
			return ''
		}
		if (node.t === 'for') {
			let listExpr = node.l
			if (/^\d+\s*\.\.\s*\w+$/.test(listExpr)) {
				const [a, b] = listExpr.split('..').map(s => s.trim())
				const aa = evalExpr(a, data)
				const bb = evalExpr(b, data)
				const list = []
				for (let i = aa; i <= bb; i++) list.push(i)
				listExpr = list
			} else {
				listExpr = evalExpr(listExpr, data)
			}
			const [a, b] = node.vs
			let out = ''
			if (b !== undefined) {
				for (const k in listExpr) {
					data[a] = k
					data[b] = listExpr[k]
					out += node.b.map(n => render(n, data)).join('')
				}
			} else {
				for (const v of listExpr) {
					const scope = { ...data }
					scope[a] = v
					out += node.b.map(n => render(n, scope)).join('')
				}
			}
			return out
		}
		return ''
	}

	function evalExpr(expr, data = {}) {
		if (/^\d+\.\.\d+$/.test(expr.trim())) {
			const [a, b] = expr.trim().split('..').map(Number)
			return Array.from({ length: b - a + 1 }, (_, i) => a + i)
		}
		return new Function('data', `with(data){return(${expr})}`)(data)
	}

	function go(template, data = {}) {
		return parse(tokenize(template)).b.map(n => render(n, data)).join('')
	}

	return { go }
})()

export default jQTSimple

function findUnescaped(str, target, start) {
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
			tokens.push({ t: 'expr', v: template.slice(i + 2, j).replace(/\\{{/g, '{{').replace(/\\}}/g, '}}').trim() })
			i = j + 2
			continue
		}
		else if (template.startsWith('{%', i) && template[i - 1] !== '\\') {
			const j = findUnescaped(template, '%}', i)
			if (j === -1) throw new Error('Unclosed {%')
			tokens.push({ t: 'tag', v: template.slice(i + 2, j).replace(/\\{%/g, '{%').replace(/\\%}/g, '%}').trim() })
			i = j + 2
			continue
		}
		else if (template.startsWith('{#', i) && template[i - 1] !== '\\') {
			const j = findUnescaped(template, '#}', i)
			if (j === -1) throw new Error('Unclosed {#')
			i = j + 2
			continue
		}
		const j1 = findUnescaped(template, '{{', i)
		const j2 = findUnescaped(template, '{%', i)
		const j3 = findUnescaped(template, '{#', i)
		const j = Math.min(j1 !== -1 ? j1 : len, j2 !== -1 ? j2 : len, j3 !== -1 ? j3 : len)
		tokens.push({ t: 'text', v: template.slice(i, j).replace(/\\{{/g, '{{').replace(/\\}}/g, '}}').replace(/\\{%/g, '{%').replace(/\\%}/g, '%}') })
		i = j
	}
	return tokens
}

export function parse(tokens) {
	let i = 0
	function walk() {
		const tok = tokens[i]
		if (!tok) return null
		if (tok.t === 'text') return tokens[i++]
		if (tok.t === 'expr') return tokens[i++]
		if (tok.t === 'tag') {
			if (tok.v.startsWith('if ')) {
				const node = { t: 'if', c: tok.v.slice(3).trim(), b: [], elif: [], eb: null }
				i++
				while (tokens[i] && tokens[i].v !== 'end') {
					if (tokens[i].v.startsWith('else if ')) {
						const cond = tokens[i].v.slice(8).trim()
						const elifBlock = { c: cond, b: [] }
						i++
						while (tokens[i] && !tokens[i].v.startsWith('else') && tokens[i].v !== 'end') {
							elifBlock.b.push(walk())
						}
						node.elif.push(elifBlock)
						continue
					}
					if (tokens[i].v === 'else') {
						i++
						node.eb = []
						while (tokens[i] && tokens[i].v !== 'end') node.eb.push(walk())
						break
					}
					node.b.push(walk())
				}
				i++
				return node
			}
			else if (tok.v.startsWith('for ')) {
				const [vars, listRaw] = tok.v.slice(4).split(' in ')
				const vs = vars.split(',').map(s => s.trim())
				const list = listRaw.trim()
				const node = { t: 'for', vs, l: list, b: [] }
				i++
				while (tokens[i] && tokens[i].v !== 'end') node.b.push(walk())
				i++
				return node
			}
			i++
			return null
		}
	}
	const ast = { t: 'root', b: [] }
	while (i < tokens.length) {
		const n = walk()
		if (n) ast.b.push(n)
	}
	return ast
}
