import jQC from '../../../src/jqc.js'

jQC.define('j-radio', {
  html: `{% for v, l in opts %}
	<label>
		<input type='radio' value='{{ v }}' @change='change(e)' '{{ =attrs }}' '{% if val == v %}checked{% end %}'>{{ l }}</input>
	</label>
{% end %}`,
  
  css: "this {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0 1em;\n  border: none;\n}\nthis label {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 0 0.5em;\n  cursor: pointer;\n  user-select: none;\n}",
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