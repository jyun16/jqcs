import jQC from '../../../src/jqc.js'

jQC.define('j-checkbox', {
  html: `{% for v, l in opts %}
	<label>
		<input type='checkbox' value='{{ v }}' @change='change(e)' '{{ !attrs }}' {% if val.includes(v) %}checked{% end %}>{{ l }}</input>
	</label>
{% end %}`,
  
  css: "this {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0 1em;\n  border: none;\n}\nthis label {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 0 0.5em;\n  cursor: pointer;\n  user-select: none;\n}",
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