import jQC from '../../../src/jqc.js'

jQC.define('j-password', {
  html: `<input type='password' name='{{ name }}' value='{{ val }}' @typed='input(e)' '{{ !attrs }}'></input>
<button type='button' @click='show()'></button>`,
  
  css: "this {\n  position: relative;\n}\nthis input {\n  width: 100%;\n  padding: 10px;\n  border: 2px solid #ddd;\n  border-radius: 5px;\n}\nthis input:focus {\n  border-color: #0099ff;\n  outline: none;\n}\nthis button {\n  position: absolute;\n  top: 0px;\n  right: 10px;\n  border: none;\n  background-color: transparent;\n  cursor: pointer;\n}\nthis button::after {\n  color: #999;\n  font-size: 24px;\n  font-family: \"Material Symbols Outlined\";\n  content: \"\\e8f4\";\n}",
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