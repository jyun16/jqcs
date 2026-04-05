const d = console.log
const jQSON = (function() {
	function tokenize(input) {
		const tokens = []
		let i = 0
		const isSpace = c => /[ \t\n\r]/.test(c)
		const isIdent = c => /[a-zA-Z0-9_\-\.]/.test(c)
		while (i < input.length) {
			const c = input[i]
			if (isSpace(c)) {
				i++
				continue
			}
			if (input.startsWith('//', i)) {
				i = input.indexOf('\n', i)
				if (i === -1) break
				continue
			}
			if (input.startsWith('/*', i)) {
				i = input.indexOf('*/', i) + 2
				if (i === 1) throw new Error('Unterminated block comment')
				continue
			}
			if (input.startsWith('[[', i)) {
				tokens.push({ type: 'QW_START' })
				i += 2
				continue
			}
			if (input.startsWith(']]', i)) {
				tokens.push({ type: 'QW_END' })
				i += 2
				continue
			}
			if (input.startsWith('<<', i)) {
				tokens.push({ type: 'SET_START' })
				i += 2
				continue
			}
			if (input.startsWith('>>', i)) {
				tokens.push({ type: 'SET_END' })
				i += 2
				continue
			}
			if (c === '<') {
				tokens.push({ type: 'ANGLE_START' })
				i++
				continue
			}
			if (c === '>') {
				tokens.push({ type: 'ANGLE_END' })
				i++
				continue
			}
			if (c === '{' || c === '}' || c === '[' || c === ']' || c === ':' || c === ',' ) {
				tokens.push({ type: 'SYMBOL', value: c })
				i++
				continue
			}
			if (c === "'" || c === '"') {
				const quote = c
				let j = i + 1
				let str = ''
				while (j < input.length && input[j] !== quote) {
					if (input[j] === '\\') {
						j++
						str += input[j++]
					} else {
						str += input[j++]
					}
				}
				tokens.push({ type: 'STRING', value: str })
				i = j + 1
				continue
			}
			if (isIdent(c)) {
				let j = i
				while (j < input.length && isIdent(input[j])) j++
				tokens.push({ type: 'IDENT', value: input.slice(i, j) })
				i = j
				continue
			}
			throw new Error('Unknown token at ' + i + ': ' + c)
		}
		return tokens
	}

function parse(text) {
		try {
			const tokens = tokenize(text)
			let i = 0
			function peek() { return tokens[i] }
			function next() { return tokens[i++] }
			function parseValue() {
				const t = peek()
				if (!t) throw ''
				if (t.type === 'SYMBOL' && t.value === '{') return parseObject()
				if (t.type === 'SYMBOL' && t.value === '[') return parseArray()
				if (t.type === 'QW_START') return parseQW()
				if (t.type === 'SET_START') return parseSet()
				if (t.type === 'ANGLE_START') return parseAngleSet()
				if (t.type === 'STRING') return next().value
				if (t.type === 'IDENT') {
					const v = next().value
					if (v === 'true') return true
					if (v === 'false') return false
					if (v === 'null') return null
					return isNaN(Number(v)) ? v : Number(v)
				}
				throw ''
			}
			function parseArray() {
				const arr = []
				next()
				while (peek() && !(peek().type === 'SYMBOL' && peek().value === ']')) {
					arr.push(parseValue())
					if (peek() && peek().type === 'SYMBOL' && peek().value === ',') next()
				}
				next()
				return arr
			}
			function parseObject() {
				const obj = {}
				next()
				while (peek() && !(peek().type === 'SYMBOL' && peek().value === '}')) {
					const key = next().value
					next()
					obj[key] = parseValue()
					if (peek() && peek().type === 'SYMBOL' && peek().value === ',') next()
				}
				next()
				return obj
			}
			function parseQW() {
				const arr = []
				next()
				while (peek() && peek().type !== 'QW_END') arr.push(next().value)
				next()
				return arr
			}
			function parseSet() {
				const set = new Set()
				next()
				while (peek() && peek().type !== 'SET_END') set.add(next().value)
				next()
				return set
			}
			function parseAngleSet() {
				const set = new Set()
				next()
				while (peek() && peek().type !== 'ANGLE_END') {
					const t = peek()
					if (t.type === 'SYMBOL' && t.value === ',') {
						next()
						continue
					}
					if (t.type !== 'STRING') throw ''
					set.add(next().value)
				}
				next()
				return set
			}
			const res = parseValue()
			return i < tokens.length ? text : res
		} catch {
			return text
		}
	}

	function dump(obj, compact = false, indent = 0) {
		const pad = (n) => '	'.repeat(n)
		function isSafeKey(k) {
			return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(k)
		}
		function stringify(val, lvl) {
			if (val instanceof Set) {
				const arr = [...val]
				const joined = arr.map(v => `'${v}'`).join(compact ? ',' : ', ')
				return '<' + (compact ? '' : ' ') + joined + (compact ? '' : ' ') + '>'
			}
			if (Array.isArray(val)) {
				if (compact) return '[' + val.map(v => stringify(v, lvl)).join(',') + ']'
				const body = val.map(v => pad(lvl + 1) + stringify(v, lvl + 1)).join(',\n')
				return '[\n' + body + '\n' + pad(lvl) + ']'
			}
			if (typeof val === 'object' && val !== null) {
				if (compact) {
					return '{' + Object.entries(val).map(([k, v]) => {
						const keyStr = isSafeKey(k) ? k : `'${k.replace(/'/g, "\\'")}'`
						return `${keyStr}:${stringify(v, lvl)}`
					}).join(',') + '}'
				}
				const body = Object.entries(val).map(([k, v]) => {
					const keyStr = isSafeKey(k) ? k : `'${k.replace(/'/g, "\\'")}'`
					return pad(lvl + 1) + `${keyStr}: ${stringify(v, lvl + 1)}`
				}).join(',\n')
				return '{\n' + body + '\n' + pad(lvl) + '}'
			}
			if (typeof val === 'string') return `'${val.replace(/'/g, "\\'")}'`
			return String(val)
		}
		return stringify(obj, indent)
	}

	return { parse, dump, d: (...a) => {
		for (const v of a) {
			if (typeof v === 'object' && v !== null) {
				console.log(dump(v))
			}
			else if (typeof v === 'string') {
				try {
					const parsed = parse(v)
					console.log(dump(parsed))
				}
				catch (e) {
					console.log('Parse error:', e.message)
				}
			}
			else {
				console.log('Unsupported type:', v)
			}
		}
	}}
})()

export default jQSON
