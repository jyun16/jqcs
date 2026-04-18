import jQC from '../../../src/jqc.js'

jQC.define('j-input', {
  html: `<input type='text' name='{{ name }}' value='{{ val }}' @typed='input(e)' '{{ !attrs }}'></input>`,
  
  css: "input {\n  width: 100%;\n}",
  globalCss: "",
  p: { name: '', val: '' },
  
  methods: {
input(e) {
	this.p.val = e.target.value
}
  }
})

export default true