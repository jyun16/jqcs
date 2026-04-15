import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('j-confirm', {
  html: `<j-dialog p-full="true" p-btn.close="false" p-height='{{ height }}' p-min-height='{{ minHeight }}'>
	<p class="fc">{{ msg }}</p>
	<div slot='footer'>
		<button class="secondary" @click='close'>Cancel</button>
		<button class="primary" @click='close' autofocus="autofocus">OK</button>
	</div>
</j-dialog>`,
  
  css: "",
  globalCss: "",
  p: {
	msg: 'HOGE',
	height: 0,
	minHeight: 16,
},
  init() {
this.render()
const $dia = jQC.bind('j-dialog', this)
d(this.p)
$dia.open()
this.$dia = $dia
  },
  methods: {
open(msg) {
	this.p.msg = msg
	this.render()
	this.$dia.open()
}
  }
})

export default true