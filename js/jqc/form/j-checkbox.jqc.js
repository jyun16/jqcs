import jQC from '../../../src/jqc.js'

jQC.define('j-checkbox', {
  html: `{% for v, l in p.opts %}
	<label>
		<input type='checkbox' value='{{ v }}' @change='change(e)' '{{ !attrs }}' {% if p.val.includes(v) %}checked{% end %}>{{ l }}</input>
	</label>
{% end %}`,
  
  css: "this {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0 1em;\n  border: none;\n}\nthis label {\n  display: flex;\n  align-items: center;\n  gap: 0 0.5em;\n  position: relative;\n  cursor: pointer;\n  user-select: none;\n}\nthis label::before {\n  width: 14px;\n  height: 14px;\n  border-radius: 3px;\n  border: 2px solid #ddd;\n  content: \"\";\n}\nthis label:has(:checked)::after {\n  position: absolute;\n  top: 5px;\n  left: 6px;\n  transform: rotate(45deg);\n  width: 4px;\n  height: 9px;\n  border: solid #0099ff;\n  border-width: 0 3px 3px 0;\n  content: \"\";\n}\nthis input {\n  display: none;\n}",
  globalCss: "",
  p: { name: '', val: [] },
  
  methods: {
change(e) {
	const t = e.target
	let v = this.p.val
	if (t.checked) { v.push(t.value) }
	else {
		this.p.val = v.filter(v => v != t.value)
	}
}
  }
})

export default true