import jQC from '../../../src/jqc.js'
const d = console.log
jQC.define('j-alert', {
  html: `<j-dialog p-full="true" p-btn.close="false" p-height='{{ height }}' p-min-height='{{ minHeight }}'>
	<div slot='header'>{{ title }}</div>
	<p class="fc">{{ msg }}</p>
	<div slot='footer'>
		<button class="primary" @click='close' autofocus="autofocus">{{ label.close }}</button>
	</div>
</j-dialog>`,
  
  css: "",
  globalCss: "",
  p: {
	title: '', msg: '',
	label: { close: '閉じる' },
	width: 0, minWidth: 0, maxWidth: 0,
	height: 0, minHeight: 0, maxHeight: 0,
},
  init() {
this.render()
const $dia = jQC.bind('j-dialog', this)
this.$dia = $dia
  },
  methods: {
open(msg, title='') {
	if (title) this.p.title = title
	this.p.msg = msg
	this.render()
	this.$dia.open()
}
  }
})

export default true