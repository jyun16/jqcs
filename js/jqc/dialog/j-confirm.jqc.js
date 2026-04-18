import jQC from '../../../src/jqc.js'
const d = console.log
jQC.define('j-confirm', {
  html: `<j-dialog p-full="true" p-btn.close="false" p-height='{{ height }}' p-min-height='{{ minHeight }}' @cb-close='closeCb'>
	<div slot='header'>{{ title }}</div>
	<p class="fc">{{ msg }}</p>
	<div slot='footer'>
		<button class="secondary" @click='cancel'>キャンセル</button>
		<button class="primary" @click='ok' autofocus="autofocus">OK</button>
	</div>
</j-dialog>`,
  
  css: "",
  globalCss: "",
  p: {
	title: '',
	msg: '',
	width: null,
	minWidth: null,
	height: null,
	minHeight: 140,
},
  init() {
this.render()
const $dia = jQC.bind('j-dialog', this)
this.$dia = $dia
  },
  methods: {
async open(msg, title='') {
	if (title) this.p.title = title
	this.p.msg = msg
	this.render()
	this.$dia.open()
	const { promise, resolve } = Promise.withResolvers()
	this._resolve = resolve
	return promise
},
resolve(v) {
	if (this._resolve) this._resolve(v)
	this._resolve = null
},
closeCb() {
	this.resolve(false)
},
cancel() {
	this.closeCb()
	this.$dia.close()
},
ok() {
	this.resolve(true)
	this.$dia.close()
}
  }
})

export default true