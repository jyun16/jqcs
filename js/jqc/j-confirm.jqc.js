import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('j-confirm', {
  html: `<j-dialog>
	<p>HOGE</p>
	<slot name='footer'>
		<button class="secondary" @click='close'>Cancel</button>
		<button class="primary" @click='close' autofocus="autofocus">OK</button>
	</slot>
</j-dialog>`,
  
  css: "",
  globalCss: "",
  p: {
},
  async init() {
await jQC.import('j-dialog')
this.render()
const $dia = jQC.bind('j-dialog', this)
  },
  methods: {

  }
})

export default true