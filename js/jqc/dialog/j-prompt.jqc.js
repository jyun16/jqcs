import jQC from '../../../src/jqc.js'
const d = console.log
jQC.define('j-prompt', {
  html: `<j-dialog p-full="true" p-btn.close="false" p-height='{{ height }}' p-min-height='{{ minHeight }}' @cb-close='closeCb'>
	<div slot='header'>{{ title }}</div>
	<j-input name='return' p-val='{{ val }}' @keydown='send(e)' autofocus="autofocus"></j-input>
	<div slot='footer'>
		<button class="secondary" @click='cancel'>{{ label.cancel }}</button>
		<button class="primary" @click='ok'>{{ label.ok }}</button>
	</div>
</j-dialog>`,
  
  css: "",
  globalCss: "",
  p: {
	title: '', val: 'XXX',
	label: { cancel: 'キャンセル', ok: '決定' },
	width: 0, minWidth: 0, maxWidth: 0,
	height: 0, minHeight: 0, maxHeight: 0,
},
  init() {
this.render()
const $dia = jQC.bind('j-dialog', this)
const $inp = jQC.bind('j-input', this)
$inp.render()
this.$dia = $dia
this.$inp = $inp
  },
  methods: {
renderAll() {
	this.render()
	this.$inp.render()
},
resolve(v) {
	if (this._resolve) this._resolve(v)
	this._resolve = null
},
async open(title='') {
	if (title) this.p.title = title
	this.$inp.p.val = ''
	this.renderAll()
	this.$dia.open()
	const { promise, resolve } = Promise.withResolvers()
	this._resolve = resolve
	return promise
},
send(e) {
	if (e.key == 'Enter') {
		e.preventDefault()
		this.ok()
	}
},
closeCb() {
	this.resolve(null)
},
cancel() {
	this.closeCb()
	this.$dia.close()
},
ok() {
	this.resolve(this.$inp.p.val)
	this.$dia.close()
}
  }
})

export default true