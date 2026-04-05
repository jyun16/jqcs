import jQC from '../../../src/jqc.js'

jQC.define('j-radio', {
  html: `{% for v, l in p.opts %}
	<label>
		<input type='radio' value='{{ v }}' @change='change(e)' '{{ !attrs }}' '{% if p.val == v %}checked{% end %}'>{{ l }}</input>
	</label>
{% end %}`,
  
  css: "this {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0 1em;\n  border: none;\n}\nthis label {\n  display: flex;\n  align-items: center;\n  gap: 0 0.5em;\n  position: relative;\n  cursor: pointer;\n  user-select: none;\n}\nthis label::before, this label::after {\n  border-radius: 50%;\n  content: \"\";\n}\nthis label::before {\n  width: 18px;\n  height: 18px;\n  border: 2px solid #ddd;\n  box-sizing: border-box;\n}\nthis label::after {\n  position: absolute;\n  top: 50%;\n  left: 9px;\n  transform: translate(-50%, -50%);\n  width: 9px;\n  height: 9px;\n}\nthis label:has(:checked)::after {\n  background-color: #0099ff;\n}\nthis input {\n  display: none;\n}",
  globalCss: "",
  p: { name: '', val: '', opts: {} },
  
  methods: {
change(e) {
	const t = e.target
	if (t.checked) { this.p.val = t.value }
}
  }
})

export default true