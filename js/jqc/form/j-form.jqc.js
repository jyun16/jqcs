import jQC from '../../../src/jqc.js'
const d = console.log
jQC.define('j-form', {
  html: `<form @submit='submit(e)'>
	{% for k, v in conf %}
		<div class="line">
			<div class="label">{{ v.label }}</div>
			<div class="input">
				{% if v.type == 'input' %}
					<j-input name='{{ k }}' p-val='{{ v.val }}' '{{ !v.attrs }}'></j-input>
				{% else if v.type == 'password' %}
					<j-password name='{{ k }}' p-val='{{ v.val }}' '{{ !v.attrs }}'></j-password>
				{% else if v.type == 'search' %}
					<j-search name='{{ k }}' p-val='{{ v.val }}' '{{ !v.attrs }}'></j-search>
				{% else if v.type == 'textarea' %}
					<j-textarea name='{{ k }}' p-val='{{ v.val }}' '{{ !v.attrs }}'></j-textarea>
				{% else if v.type == 'checkbox' %}
					<j-checkbox name='{{ k }}' p-val='{{ v.val }}' p-opts='{{ v.opts }}' '{{ !v.attrs }}'></j-checkbox>
				{% else if v.type == 'radio' %}
					<j-radio name='{{ k }}' p-val='{{ v.val }}' p-opts='{{ v.opts }}' '{{ !v.attrs }}'></j-radio>
				{% else if v.type == 'select' %}
					<j-select name='{{ k }}' p-val='{{ v.val }}' p-opts='{{ v.opts }}' '{{ !v.attrs }}'></j-select>
				{% else if v.type == 'mselect' %}
					<j-mselect name='{{ k }}' p-val='{{ v.val }}' p-opts='{{ v.opts }}' '{{ !v.attrs }}'></j-mselect>
				{% else if v.type == 'rich-select' %}
					<j-rich-select name='{{ k }}' p-val='{{ v.val }}' p-opts='{{ v.opts }}' '{{ !v.attrs }}'></j-rich-select>
				{% end %}
			</div>
		</div>
	{% end %}
	<div class="actions">
		<button class="primary" type='submit'>GO</button>
	</div>
</form>`,
  
  css: "this {\n  visibility: hidden;\n}\n\nthis.visible {\n  visibility: visible;\n}\n\nform {\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  margin: 0 auto;\n  padding: 0.5rem;\n  gap: 0.5rem;\n}\nform .line {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n}\nform .line .label {\n  min-width: 200px;\n}\nform .line .input {\n  flex: 1;\n}\nform .actions {\n  display: flex;\n  justify-content: center;\n}\nform button.primary {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-width: 200px;\n  border: 0;\n  border-radius: 5px;\n  color: white;\n  background-color: #0066ff;\n  font-weight: bold;\n  padding: 0.7rem;\n  cursor: pointer;\n}",
  globalCss: "@media (width < 600px) {\n  form .line {\n    display: flex;\n    flex-direction: column;\n    flex-wrap: wrap;\n    align-items: flex-start;\n  }\n  form .line .label {\n    width: 100%;\n  }\n}",
  p: { name: 'form', conf: {}, initRender: true },
  async init() {
this.render()
const binded = new Set()
const f = {}
let ret
for (const n of Object.keys(this.p.conf)) {
	const o = this.p.conf[n]
	if (binded.has(o.type)) continue
	await jQC.importWithPath('form', [ `j-${o.type}` ])
	const $f = jQC.bind(`j-${o.type}`, this)
	if (this.p.initRender) {
		ret = jQC.queueRender($f)
	}
	binded.add(o.type)
	for (const $el of $f) { f[$el.p.name] = $el }
}
this.f = f
return ret
  },
  methods: {
val(val) {
	if (val) {
		for (const n of Object.keys(val)) { this.f[n].p.val = val[n] }
		return val
	}
	const ret = {}
	for (const n in this.f) { ret[n] = this.f[n].p.val }
	return ret
},
renderVal(val) {
	let ret
	for (const n of Object.keys(val)) {
		this.f[n].p.val = val[n]
		ret = jQC.queueRender(this.f[n])
	}
	if (ret) { ret.then(() => this.addClass('visible')) }
	else { this.addClass('visible') }
	return ret
},
submit(e) {
	e.preventDefault()
	const data = this.find('form').serialize()
	this.cb('submit', JSON.stringify(data))
},
serialize() {
	return this.find('form').serialize()
},
  }
})

export default true