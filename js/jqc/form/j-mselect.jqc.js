import jQC from '../../../src/jqc.js'

jQC.define('j-mselect', {
  html: `<select name='{{ name }}' '{{ =attrs }}' multiple>
	{% for v, l in opts %}
		<option value='{{ v }}' '{% if val.includes(v) %}selected{% end %}'>{{ l }}</option>
	{% end %}
</select>`,
  
  css: "this {\n  display: inline-flex;\n  align-items: center;\n  position: relative;\n}\nthis::after {\n  position: absolute;\n  right: 15px;\n  width: 10px;\n  height: 7px;\n  background-color: #535353;\n  clip-path: polygon(0 0, 100% 0, 50% 100%);\n  content: \"\";\n  pointer-events: none;\n}\nthis select {\n  appearance: none;\n  padding: 10px;\n  border: 2px solid #ddd;\n  border-radius: 5px;\n  background-color: #fff;\n  min-width: 230px;\n  font-size: 1em;\n  cursor: pointer;\n}\nthis select:focus {\n  border-color: #0099ff;\n  outline: none;\n}",
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