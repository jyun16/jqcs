TO := $(JQ)

JS := js
JS_MIN := public/js
JS_FILES := $(shell find -L $(JS) -name "*.js")
JS_MIN_FILES := $(patsubst $(JS)/%.js, $(JS_MIN)/%.min.js, $(JS_FILES))

js: $(JS_MIN_FILES)

$(JS_MIN)/%.min.js: $(JS)/%.js
	@mkdir -p $(dir $@)
	@cat $< | sed "s/\.min\.js'/___MIN___/g; s/\.js'/.min.js'/g; s/___MIN___/.min.js'/g" | $(ESBUILD) --minify --loader=js > $@

BUILD_JQC := ./bin/build-jqc.js
ESBUILD := esbuild
JQC := jqc
JQC_JS := js/jqc
JQC_MIN := public/js/jqc
JQC_FILES := $(shell find -L $(JQC) -name "*.jqc")
JQC_JS_FILES := $(patsubst $(JQC)/%.jqc, $(JQC_JS)/%.jqc.js, $(JQC_FILES))
JQC_MIN_FILES := $(patsubst $(JQC_JS)/%.jqc.js, $(JQC_MIN)/%.jqc.min.js, $(JQC_JS_FILES))
.SECONDARY: $(JQC_JS_FILES)

# $(info $(JQC_FILES))
# $(info $(JQC_JS_FILES))
# $(info $(JQC_MIN_FILES))

jqc: $(JQC_MIN_FILES)

$(JQC_JS)/%.jqc.js: $(JQC)/%.jqc
	@mkdir -p $(dir $@)
	$(BUILD_JQC) $<

$(JQC_MIN)/%.jqc.min.js: $(JQC_JS)/%.jqc.js
	@mkdir -p $(dir $@)
	@cat $< | sed "s/\.js'/.min.js'/g; s|\.\./src|jq|g" | $(ESBUILD) --minify --loader=js > $@

go: js
	@rsync -auv --delete $(JS)/ $(TO)/$(JS)
	@rsync -auv --delete $(JS_MIN)/ $(TO)/$(JS_MIN)

go_bin:
	@cp -fa $(BUILD_JQC) $(TO)/bin/

go_jqc: jqc
	@rsync -auv --delete $(JQC)/ $(TO)/$(JQC)
	@rsync -auv --delete $(JQC_MIN)/ $(TO)/$(JQC_MIN)

.PHONY: all clean js
