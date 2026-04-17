import jQC from '../../src/jqc.js'
const d = console.log
const WH = [ 'min-width', 'width', 'max-width', 'min-height', 'height', 'max-height' ]
jQC.define('j-dialog', {
  html: `<dialog @cancel='close' @mousedown='clickOutside(e)' {{ !attrs }} autofocus>
	<div class="card">
		<div class="header">
			<slot name='header'></slot>
			<div class="right">
				<span class="close icon" @click='close'>close</span>
			</div>
		</div>
		<div class="body" tabindex='-1'>
			<slot></slot>
		</div>
		<div class="footer">
			<slot name='footer'></slot>
			{% if btn.close %}
				<button class="primary close" @click='close' autofocus="autofocus">CLOSE</button>
			{% end %}
		</div>
	</div>
</dialog>`,
  
  css: "dialog {\n  position: fixed;\n  max-width: 90vw;\n  max-height: 80vh;\n  margin: 10px 0 !important;\n}\ndialog .body:focus {\n  outline: none;\n}\ndialog::backdrop {\n  background: rgba(0, 0, 0, 0.6);\n}\ndialog.full {\n  margin: auto !important;\n}\ndialog.anchored {\n  position-anchor: --anchor;\n  position-area: var(--area);\n}",
  globalCss: ".anchor {\n  anchor-name: --anchor;\n}",
  p: {
	full: false,
	x: 'left',
	y: 'bottom',
	width: 0,
	height: 0,
	minWidth: 0,
	minHeight: 0,
	btn: {
		close: true
	},
},
  init() {
this.render()
const $this = this.find('dialog')
const p = this.p
const xMap = { left: 'span-right', right: 'span-left', center: '' }
const el = $this.el(0)
const x = xMap[p.x]
el.style.setProperty('--area', `${p.y} ${x}`)
this.$this = $this
this.card = $this.find('.card').el(0)
  },
  methods: {
open(anchor) {
	const $this = this.$this
	const p = this.p
	const el = $this.el(0)
	if (this.p.full) {
		$this.removeClass('anchored').addClass('full')
		el.style.removeProperty('--area')
		el.showModal()
		return
	}
	WH.map(v => p[v] && this.card.style.setProperty(`--${v}`, p[v]))
	if (anchor) {
		this.anchor = anchor
		anchor.classList.add('anchor')
		$this.addClass('anchored').removeClass('full')
		let y = p.y
		let x = p.x
		const xMap = { left: 'span-right', right: 'span-left', center: '' }
		el.style.setProperty('--area', `${y} ${xMap[x]}`)
		el.showModal()
		const ar = anchor.getBoundingClientRect()
		const dr = el.getBoundingClientRect()
		const w = window.innerWidth
		const h = window.innerHeight
		if (x === 'left' && ar.left + dr.width > w) x = 'right'
		else if (x === 'right' && ar.right - dr.width < 0) x = 'left'
		else if (x === 'center') {
			const cx = ar.left + ar.width / 2
			const dw2 = dr.width / 2
			if (cx + dw2 > w) x = 'right'
			else if (cx - dw2 < 0) x = 'left'
		}
		if (y === 'bottom' && ar.bottom + dr.height > h) y = 'top'
		else if (y === 'top' && ar.top - dr.height < 0) y = 'bottom'
		el.style.setProperty('--area', `${y} ${xMap[x]}`)
		return
	}
	$this.el(0).showModal()
},
async close() {
	const $this = this.$this
	await this.cb('close')
	if (this.anchor) {
		this.anchor.classList.remove('anchor')
		this.anchor = null
	}
	$this.removeClass('anchored').removeClass('full')
	$this.el(0).close()
},
clickOutside(e) {
	if (e.target.tagName === 'DIALOG') this.close()
}
  }
})

export default true