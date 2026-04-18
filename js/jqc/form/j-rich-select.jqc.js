import jQC from '../../../src/jqc.js'
const d = console.log
jQC.define('j-rich-select', {
  html: `<div class="items" @click='open'>
	{% for v in val %}
		<div class="item">
			<span>{{ opts[v] }}</span>
			<span class="icon close" @click='rmItem(e)' value='{{ v }}'>close</span>
		</div>
	{% end %}
</div>
<j-dialog p-btn.close="false" p-fit="true" @typed='search'>
	<j-search></j-search>
	<div class="options" @click='select(e)'>
		<p>{{ val }}</p>
		{% for v, l in opts %}
			<p>{{ v }}: {{ !val.includes(v) }}</p>
			{% if !val.includes(v) %}
				<div class="option" value='{{v}}'>{{l}}</div>
			{% end %}
		{% end %}
	</div>
</j-dialog>`,
  
  css: ".items {\n  display: flex;\n  align-items: center;\n  gap: 0.3rem;\n  height: 2.5rem;\n  padding: 0 0.5rem;\n  background: #fff;\n  border-radius: 5px;\n  user-select: none;\n}\n.items .item {\n  display: flex;\n  align-items: center;\n  height: 1.8rem;\n  padding: 0.1rem 0.3rem 0.2rem 0.4rem;\n  color: #fff;\n  background: #5e6264;\n  border-radius: 0.2rem;\n  cursor: default;\n}\n.items .item .close {\n  cursor: pointer;\n}\n\n.options {\n  display: flex;\n  flex-direction: column;\n}\n.options :not(:first-child) {\n  border-top: 1px solid #fff;\n}\n.options .option {\n  display: flex;\n  align-items: center;\n  height: 2.5rem;\n  user-select: none;\n  cursor: pointer;\n}\n.options .option:hover {\n  color: #fff;\n  background: #eee;\n}",
  globalCss: "",
  p: {
	name: '', val: [ 'hoge' ],
	opts: {
		hoge: 'HOGE',
		fuga: 'FUGA',
		foo: 'FOO',
		bar: 'BAR',
	},
},
  init() {
this.render()
const $dia = jQC.bind('j-dialog', this)
const $filter = jQC.bind('j-search', this)
$filter.render()
this.$dia = $dia
this.$filter = $filter
this.$dia.open(this)
  },
  methods: {
open() {
	this.$dia.open(this)
},
rmItem(e) {
	e.stopPropagation()
	d('rm', e.target.getAttribute('value'))
},
search(e) {
	d(this.$filter.p.val)
},
select(e) {
	d('sel', e.target.getAttribute('value'))
	this.$dia.close()
},
  }
})

export default true