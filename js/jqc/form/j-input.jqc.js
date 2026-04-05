import jQC from '../../../src/jqc.js'

jQC.define('j-input', {
  html: `<input type='text' name='{{ p.name }}' value='{{ p.val }}' @typed='input(e)' '{{ !attrs }}'></input>`,
  
  css: "input {\n  width: 100%;\n  padding: 10px;\n  border: 2px solid #ddd;\n  border-radius: 5px;\n}\ninput:focus {\n  border-color: #0099ff;\n  outline: none;\n}",
  globalCss: "",
  p: { name: '', val: '' },
  
  methods: {
input(e) {
	this.p.val = e.target.value
}
  }
})

export default true