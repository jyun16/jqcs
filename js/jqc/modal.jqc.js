import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('modal', {
  html: `<div class="modal">
	<slot></slot>
</div>`,
  
  css: "this {\n  position: absolute;\n  width: 100%;\n  top: 5px;\n  left: 0;\n  z-index: 100;\n}",
  globalCss: "",
  p: { show: false },
  postRender() {
this.p.show ? this.open() : this.close()
  },
  methods: {
toggle() {
	this.p.show = !this.p.show
	if (this.p.show) { jQC.overlay.open(this); this.open() }
	else { this.close() }
},
open() { this.p.show = true; this.show() },
close() { this.p.show = false; this.hide() },
  }
})

export default true