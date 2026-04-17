import jQC from '../../src/jqc.js'
const d = console.log
jQC.define('count', {
  html: `<p class='{{ color }}'>{{ count }}</p>
<button @click='countup()'>+</button>`,
  
  css: "this {\n  visibility: hidden;\n}\n\nthis.show {\n  visibility: visible;\n}\n\nspan {\n  font-size: 2rem;\n}\n\n.odd {\n  color: pink;\n}\n\n.even {\n  color: skyblue;\n}\n\nbutton {\n  cursor: pointer;\n}",
  globalCss: "",
  p: { count: 0, color: null },
  init() {
this.countup()
  },
  methods: {
countup() {
	this.p.count++
	this.p.color = this.p.count % 2 ? 'odd' : 'even'
	this.render()
	d('FROM CB:', this.cb('countup', 'TO CB:' + this.p.count))
	this.addClass('show')
}
  }
})

export default true