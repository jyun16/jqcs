import jQC from '../../../src/jqc.js'

jQC.define('j-search', {
  html: `<input type='text' name='{{ p.name }}' value='{{ p.val }}' @typed='input(e)' '{{ !attrs }}'></input>
<button type='button' @click='search()'></button>`,
  
  css: "this {\n  position: relative;\n}\nthis input {\n  width: 100%;\n  padding: 10px;\n  border: 2px solid #ddd;\n  border-radius: 5px;\n}\nthis input:focus {\n  border-color: #0099ff;\n  outline: none;\n}\nthis button {\n  position: absolute;\n  top: 0px;\n  right: 10px;\n  border: none;\n  background-color: transparent;\n  cursor: pointer;\n}\nthis button::after {\n  color: #999;\n  font-size: 24px;\n  font-family: \"Material Symbols Outlined\";\n  content: \"\\e8b6\";\n}",
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