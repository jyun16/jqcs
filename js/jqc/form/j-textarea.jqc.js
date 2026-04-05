import jQC from '../../../src/jqc.js'

jQC.define('j-textarea', {
  html: `<textarea @typed='input(e)' '{{ !attrs }}'>{{ p.val }}</textarea>`,
  
  css: "textarea {\n  width: 100%;\n  padding: 10px;\n  border: 2px solid #ddd;\n  border-radius: 5px;\n}\ntextarea:focus {\n  border-color: #0099ff;\n  outline: none;\n}\ntextarea {\n  field-sizing: content;\n  line-height: 1.5;\n  min-height: 5lh;\n  max-height: 10lh;\n}",
  globalCss: "",
  p: { name: '', val: '', max: 10 },
  
  methods: {
input(e) {
	this.p.val = e.target.value
}
  }
})

export default true