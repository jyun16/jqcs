# カスタムタグ

<count id='cnt' any='ANY' p-count=7 @cb-click='click()'></count>

# jqc

pug
  div(class='{{ p.color }}' {{ !attrs }} {{ !p.attrs }}) {{ p.count }}
  button(@click='countup(1)') +
p
  {
		count: 0,
		color:null,
		any: null,
		attrs: {
			'data-id': 'id',
		}
	}
init
	this.countup(0);
methods
  countup(n) {
    this.p.count += n
    this.p.color = this.p.count % 2 ? 'odd' : 'even'
    this.render()
  }

# bind

	const $cnt = jQC.bind('count')

		jqc/count.jqc を count タグに bind して jq オブジェクト返す

	## 複数の場合

		<j-input id='hoge' class='text' name='hoge' value='HOGE'></j-input>
		<j-input id='fuga' class='text' name='fuga' value='FUGA'></j-input>

		html: "<input type=\"text\" name=\"{{ p.name }}\" value=\"{{ p.value }}\" @typed=\"input(e)\" {{ !attrs }}>",

		const $input = jQC.bind('j-input')
		t.eq('HOGE', $input[0].p.value)
		t.eq('FUGA', $input[1].p.value)
		t.eq('HOGE', jQC.getById('hoge').p.value)
		t.eq('FUGA', jQC.getByName('fuga').p.value)

		基本的には、jQC.getById とjQC.getByName で受けたほうが混乱無いかもな
		bind するタグが複数だとリスト、1つなら1つ返してるから

p 

	jq オブジェクトが持つ値

	カスタムタグ側に、同じ名前で属性値として与えると、初期値を設定可能
	!attrs を定義した場合、その値が、当然タグ側に出現してしまう
	ただ値を定義したいだけなら、p- をつければ良い

!attrs

	カスタムタグに与えた p- @cb 以外のものをそのままズドン

# callback

	count#cnt(@cb-handler-countup='onCountup')
	script(type='module').
		...

		globalThis.onCountup = function(data) {
			d(data)
			return `RETURN(${this.p.count})`
		}

	呼び出し側タグで

	@cb-$HANDLER_NAME='handlerFunction'

	で、ハンドラーを設定
	タグの属性値なので、大文字は使えないから、ハンドラーはハイフンかアンダーバー使って名前つける

	globalThis.handlerFunction = function(data) {
		d(data)
		return `RETURN(${this.p.count})`
	}

	で、グローバルに関数を与えてやる
	グローバル値なので、コンポーネント間で衝突するので、がんばって名前をつけるべし
	(デフォルトjqc のコンポーネント名を prefix につけても良かったんだが、使う時鬱陶しそうだからやめた)

	jqc 側では

	d('FROM CB: ', this.cb('handler-countup', 'TO CB: ' + this.p.count))

	で、callback を呼び出して、返り値も受けれる
