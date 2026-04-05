import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('pop-over', {
  html: `<modal>
	<div class="pop-over"></div>
</modal>`,
  
  css: "this {\n  position: absolute;\n  width: 100%;\n  top: 5px;\n  left: 0;\n  z-index: 100;\n}",
  globalCss: "",
  p: { show: false },
  async init() {
this.render()
this.$modal = jQC.bind('modal', this)
this.$modal.render()
  },
  methods: {
toggle() { this.$modal.toggle() },
open() { this.$modal.open() },
close() { this.$modal.close() },
  }
})

export default true