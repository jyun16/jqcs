import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('pager', {
  html: `<ul>
	{% if p.page > 1 %}
		{% if p.total > 10 %}
			<li @click='jump(1)'>{{ ro:p.label.first }}</li>
		{% end %}
		<li @click='prev()'>{{ ro:p.label.prev }}</li>
	{% end %}
	{% for n in p.first..p.last %}
		<li @click='jump({{ n }})' class='{{ p.page == n ? "active" : "" }}'>{{ n }}</li>
	{% end %}
	{% if p.page != p.total %}
		<li @click='next()'>{{ ro:p.label.next }}</li>
		{% if p.total > 10 %}
			<li @click='jump({{ p.total }})'>{{ ro:p.label.last }}</li>
		{% end %}
	{% end %}
</ul>`,
  
  css: "ul {\n  display: flex;\n  gap: 4px;\n  list-style: none;\n  padding: 0;\n  margin: 0.5rem;\n}\nul li {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 3rem;\n  height: 2.5rem;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  user-select: none;\n  cursor: pointer;\n}\nul li.active {\n  background: #333;\n  color: white;\n  font-weight: bold;\n}",
  globalCss: "",
  p: {
	count: 131, limit: 10, page: 0,
	first: 0, last: 0, total: 10,
	label: { first: '<<', prev: '<', next: '>', last: '>>' },
},
  init() {
this.calc()
  },
  methods: {
jump(n) {
	this.p.page = n
	this.calc()
},
prev() {
	this.p.page--
	this.calc()
},
next() {
	this.p.page++
	this.calc()
},
calc() {
	const p = this.p
	p.total = Math.ceil(p.count / p.limit)
	if (!p.page || p.page < 0) { p.page = 1 }
	if (p.page > p.total) { p.page = p.total }
	if (p.total < 10) {
		p.first = 1
		p.last = p.total
		return
	}
	p.first = p.page < 7 ? 1 : p.page - 5
	if (p.total > 9 && p.first + 9 > p.total) {
		p.first -= p.first + 9 - p.total
	}
	p.last = p.page < 7 ? 10 : p.first + 9
	if (p.last > p.total) {
		p.last = p.total
	}
	this.cb('click')
	this.render()
}
  }
})

export default true