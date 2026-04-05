if exists("b:current_syntax")
  finish
endif

syntax match jqcBlockName /^\s*\%(pug\|scss\|globalScss\|init\|preRender\|postRender\|methods\|p\|head\)\s*$/ containedin=ALL
syntax match jqcBlockName /^async\s\+init$/
syntax match jqcBlockName /^async\s\+preRender$/
syntax match jqcBlockName /^async\s\+postRender$/
highlight link jqcBlockName Keyword

" Pug
syntax match jqcPugTag /^\s*[a-zA-Z\.#][a-zA-Z0-9_-]*/ contained
highlight link jqcPugTag Structure
syntax match jqcPugAttrKey /@[a-zA-Z0-9_-]\+\ze/ contained
highlight link jqcPugAttrKey Type
syntax match jqcPugAttrKey2 /\<[a-zA-Z0-9_-]\+\ze[!=]/ contained
highlight link jqcPugAttrKey2 Identifier
syntax match jqcPugAttrVal /'[^']*'/ contained
highlight link jqcPugAttrVal String
syntax match jqcPugAttrVal2 /"[^"]*"/ contained
highlight link jqcPugAttrVal2 String
syntax match jqcPugExpr /<<[^>]\+>>/ contained
highlight link jqcPugExpr Identifier
syntax match jqcPugCode /<%[^%]\+%>/ contained
highlight link jqcPugCode Function
syntax region jqcPugBlock start=/^pug$/ end=/^[^\t]/me=s-1 contains=jqcPugTag,jqcPugAttrKey,jqcPugAttrKey2,jqcPugAttrVal,jqcPugAttrVal2,jqcPugExpr,jqcPugCode keepend

" JS
syntax include @javascript syntax/javascript.vim
syntax region jqcJSImportBlock start=/^head$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSPBlock start=/^p$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSInitBlock start=/^init$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSInitBlock start=/^preRender$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSInitBlock start=/^postRender$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSInitBlock start=/^async init$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSInitBlock start=/^async preRender$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSInitBlock start=/^async postRender$/ end=/^[^\t]/me=s-1 contains=@javascript
syntax region jqcJSMethodsBlock start=/^methods$/ end=/^[^\t]/me=s-1 contains=@javascript

" SCSS
syntax match jqcCssProp /\<[a-zA-Z-]\+\>\ze\s*:/ contained
highlight link jqcCssProp Identifier
syntax match jqcCssValue /:\s*\zs[^;]\+\ze;/ contained
highlight link jqcCssValue String
syntax match jqcCssSelector /^[ \t]*[&\w.#:-]*[^,{]\+\ze\s*{/ contained
highlight link jqcCssSelector Type
syntax region jqcScssBlock start=/^scss$/ end=/^[^\t]/me=s-1 contains=jqcCssProp,jqcCssValue,jqcCssSelector
syntax region jqcScssBlock start=/^globalScss$/ end=/^[^\t]/me=s-1 contains=jqcCssProp,jqcCssValue,jqcCssSelector

" let b:current_syntax = "jqc"
