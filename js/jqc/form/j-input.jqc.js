import jQC from '../../../src/jqc.js'
const d = console.log
jQC.define('j-input', {
  html: `<input type='text' name='{{ name }}' value='{{ val }}' @typed='input(e)' '{{ =attrs }}'></input>
{% if icon %}
	<span class="icon" @click='iconClick(e)'>{{ icon }}</span>
{% end %}`,
  
  css: "this {\n  position: relative;\n}\nthis input {\n  width: 100%;\n}\nthis span.icon {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  right: 10px;\n  margin: auto;\n  cursor: pointer;\n  user-select: none;\n}",
  globalCss: "",
  p: { name: '', val: '', icon: '' },
  postRender() {
if (this.p.icon) {
	this.find('input').css('padding-right', '40px')
}
  },
  methods: {
input(e) {
	this.p.val = e.target.value
	this.cb('input')
	e.preventDefault()
},
iconClick(e) {
	d('call cb')
	this.cb('iconClick')	
}
  }
})

export default true