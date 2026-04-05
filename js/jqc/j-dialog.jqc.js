import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('j-dialog', {
  html: `<dialog @cancel='close' @mousedown='clickOutside(e)' {{ !attrs }}>
	<div class="inner">
		<div class="content">{{ slot | raw }}</div>
		{% if p.btn.close %}
		<div class="footer">
			<button @click='close'>CLOSE</button>
		</div>
		{% end %}
	</div>
</dialog>`,
  
  css: "this dialog {\n  padding: 0;\n  border: none;\n  outline: none;\n  background: transparent;\n}\nthis dialog:focus {\n  outline: none;\n}\nthis dialog::backdrop {\n  background: rgba(0, 0, 0, 0.5);\n}\n\nthis .inner {\n  background: #fff;\n  padding: 1.5rem;\n  border-radius: 10px;\n  min-width: 300px;\n  max-height: 92vh;\n  overflow: auto;\n  outline: none;\n}\nthis .inner::-webkit-scrollbar {\n  width: 16px;\n  height: 16px;\n}\nthis .inner::-webkit-scrollbar-corner {\n  background: transparent;\n}\nthis .inner::-webkit-scrollbar-track {\n  background: transparent;\n}\nthis .inner::-webkit-scrollbar-thumb {\n  background: #ccc;\n  background-clip: padding-box;\n  border-radius: 10px;\n  border: 4px solid transparent;\n  border-right: 4px solid transparent;\n}",
  globalCss: "",
  p: {
	btn: {
		close: true
	}
},
  init() {
this.render()
  },
  methods: {
open() {
	this.find('dialog').el(0).showModal()
},
close() {
	this.cb('close')
	this.find('dialog').el(0).close()
},
clickOutside(e) {
	if (e.target.tagName === 'DIALOG') this.close()
}
  }
})

export default true