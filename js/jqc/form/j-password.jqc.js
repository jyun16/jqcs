import jQC from '../../../src/jqc.js'

jQC.define('j-password', {
  html: `<input type='password' name='{{ name }}' value='{{ val }}' @typed='input(e)' '{{ !attrs }}'></input>
<button type='button' @click='show()'></button>`,
  
  css: "this {\n  position: relative;\n}\nthis input {\n  width: 100%;\n  padding-right: 40px;\n}\nthis button {\n  position: absolute;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  top: 0;\n  bottom: 0;\n  right: 5px;\n  height: 32px;\n  margin: auto;\n}\nthis button::after {\n  font-size: 24px;\n  font-family: \"Material Symbols Outlined\";\n  content: \"\\e8f4\";\n}",
  globalCss: "",
  p: { name: '', val: '', show: false },
  
  methods: {
input(e) {
	this.p.val = e.target.value
},
show() {
	this.p.show = !this.p.show
	this.find('input').el(0).type = this.p.show ? 'text' : 'password'
}
  }
})

export default true