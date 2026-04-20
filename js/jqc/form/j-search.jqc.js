import jQC from '../../../src/jqc.js'
const d = console.log
jQC.define('j-search', {
  html: `<input type='text' name='{{ name }}' value='{{ val }}' @typed='input(e)' '{{ =attrs }}'></input>
<button type='button' @click='search()'></button>`,
  
  css: "this {\n  position: relative;\n}\nthis input {\n  width: 100%;\n  padding-right: 40px;\n}\nthis button {\n  position: absolute;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  top: 0;\n  bottom: 0;\n  right: 5px;\n  height: 32px;\n  margin: auto;\n}\nthis button::after {\n  font-size: 24px;\n  font-family: \"Material Symbols Outlined\";\n  content: \"\\e8b6\";\n}",
  globalCss: "",
  p: { name: '', val: '' },
  
  methods: {
input(e) {
	this.p.val = e.target.value
},
search() {
	this.cb('search')
}
  }
})

export default true