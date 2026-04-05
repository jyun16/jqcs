import jQC from '../../../src/jqc.js'
const d = console.log
await jQC.import('modal')
let $modal = null
jQC.define('j-rich-select', {
  html: `<div class="tags" @click='toggleOpts()' '{{ !attrs }}'>
	{% for k in p.vals %}
		<div class="tag">
			<div class="lbl">{{ p.opts[k] }}</div>
			<div class="rm material-symbols-outlined" @click="rmVal('{{ k }}')">close</div>
		</div>
	{% end %}
	<modal>
		<div class="opts">
			<input type='text' @typed='filter(e)' @stop="@stop" value='{{ p.filter }}'></input>
			<ul>
				{% for k, v in p.opts %}
					{% if (!p.vals.includes(k) && v.includes(p.filter)) %}
						<li @click="select('{{ k }}')">{{ v }}</li>
					{% end %}
				{% end %}
			</ul>
		</div>
	</modal>
</div>`,
  
  css: "input {\n  width: 100%;\n  padding: 10px;\n  border: 2px solid #ddd;\n  border-radius: 5px;\n}\ninput:focus {\n  border-color: #0099ff;\n  outline: none;\n}\n\n.tags {\n  display: flex;\n  position: relative;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.5em;\n  width: 100%;\n  height: 2.6rem;\n  padding: 0 0.5rem;\n  background-color: white;\n  border: 2px solid #ddd;\n  border-radius: 5px;\n  cursor: pointer;\n  margin-bottom: 0.5rem;\n}\n.tags .tag {\n  display: flex;\n  align-items: center;\n  background: #666;\n  padding: 0 0.5rem;\n  border-radius: 4px;\n  user-select: none;\n  height: 2rem;\n  cursor: default;\n}\n.tags .tag .lbl {\n  transform: translateY(-1px);\n}\n.tags .tag .rm {\n  transform: translateX(4px);\n  font-size: 1.2rem;\n  border: none;\n  cursor: pointer;\n}\n\n.opts {\n  padding: 0.3rem;\n  border: 1px solid #ccc;\n  background-color: #666;\n}\n.opts ul {\n  overflow-y: auto;\n  max-height: var(--option-height, 300px);\n  width: 100%;\n  margin: 0.3rem 0;\n  padding: 0;\n  list-style: none;\n}\n.opts ul li {\n  padding: 0.3em 0.5em;\n  cursor: pointer;\n  user-select: none;\n}\n.opts ul li:hover {\n  background: #eee;\n}",
  globalCss: "",
  p: {
	vals: [],
	opts: {},
	filter: '',
	option_height: '',
},
  init() {
this.render()
  },
  postRender() {
$modal = jQC.bind('modal')
  },
  methods: {
toggleOpts() {
	$modal.toggle()
},
filter(e) {
	this.p.filter = e.target.value
	this.render()
	const el = this.find('input').el(0)
	el.focus()
	const val = el.value
	el.setSelectionRange(val.length, val.length)
},
select(k) {
	if (!this.p.vals.includes(k)) {
		this.p.vals.push(k)
		this.p.filter = ''
		this.render()
	}
},
rmVal(k) {
	this.p.vals = this.p.vals.filter(v => v !== k)
	this.render()
}
  }
})

export default true