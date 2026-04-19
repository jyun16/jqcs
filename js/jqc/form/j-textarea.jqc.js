import jQC from '../../../src/jqc.js'

jQC.define('j-textarea', {
  html: `<textarea @typed='input(e)' '{{ =attrs }}'>{{ val }}</textarea>`,
  
  css: "textarea {\n  width: 100%;\n  min-height: 5lh;\n  max-height: 10lh;\n  field-sizing: content;\n  line-height: 1.5;\n}",
  globalCss: "",
  p: { name: '', val: '', max: 10 },
  
  methods: {
input(e) {
	this.p.val = e.target.value
}
  }
})

export default true