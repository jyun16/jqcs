import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('j-alert', {
  html: `<j-dialog p-full="true" p-btn.close="false" p-height='{{ height }}' p-min-height='{{ minHeight }}'>
	<p class="fc">{{ msg }}</p>
	<div slot='footer'>
		<button class="primary" @click='close' autofocus="autofocus">CLOSE</button>
	</div>
</j-dialog>`,
  
  css: "",
  globalCss: "",
  p: {
	msg: '',
	height: null,
	minHeight: null,
},
  init() {
this.render()
const $dia = jQC.bind('j-dialog', this)
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