define("ace/mode/solidity_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"],function(e,t,n){"use strict";var r=e("../lib/oop"),i=e("./text_highlight_rules").TextHighlightRules,s=function(){this.$rules={start:[{token:"comment",regex:/\/\/.*/,comment:"Comments"},{token:"comment",regex:/\/\*/,push:[{token:"comment",regex:/\*\//,next:"pop"},{defaultToken:"comment"}],comment:"Multiline comments"},{token:["keyword.control","keyword.control","support.function"],regex:/\b(event|enum)(\s+)([A-Za-z_]\w*)\b/,comment:"Events"},{token:["keyword.control","entity.name.function","keyword.control","entity.name.function"],regex:/\b(contract|interface|library|using|struct|function|constructor|modifier)((?:\s+[A-Za-z_]\w*)?)(?:(\s+is\s+)((?:[A-Za-z_][\,\s]*)*))?\b/,comment:"Structures, function, event definitions"},{token:["constant.language","text","text","constant.numeric","text","text","text","constant.numeric","text","text","keyword.control","text","variable.parameter","text"],regex:/\b(address|string|bytes?\d*|int\d*|uint\d*|bool|u?fixed\d+x\d+)(\s*)(?:(\[)(\d*)(\]))?(\s*)(?:(\[)(\d*)(\]))?(\s*)(?:((?:indexed|memory|storage|calldata)?)(\s*)(\b[A-Za-z_]\w*)(\s*))?(?=[,\)])/,comment:"Built-in types"},{token:["constant.language","text","constant.language","text","constant.language","text","keyword.control","text","text"],regex:/\b(mapping)(\s*\()(.*)(\s+=>\s+)(.*)(\))((?:\s+(?:private|public|internal|external))?)(\s+)([A-Za-z_]\w*)\b/,comment:"Mapping definition"},{token:"constant.language",regex:/\b(?:true|false)\b/,comment:"True and false keywords"},{token:["constant.language","text","constant.numeric","text","text","constant.numeric","text","text","keyword.control","text","text"],regex:/\b(address|string|bytes?\d*|int\d*|uint\d*|bool|u?fixed\d+x\d+)(?:(\s*\[)(\d*)(\]))?(?:(\s*\[)(\d*)(\]))?(\s*)((?:private|public|internal|external|constant|memory|storage)?)(\s+)[A-Za-z_]\w*(\s*[\;\=])/,comment:"Variable definitions - bytes data; | uint x = uint(y);"},{token:"keyword.control",regex:/\b(?:var|import|constant|pragma|payable|storage|memory|calldata|if|else|for|while|do|break|continue|returns?|private|public|pure|view|internal|external|this|suicide|selfdestruct|emit|new|is|throw|revert|assert|require|\_)\b/,comment:"Langauge keywords"},{token:["variable.parameter","text"],regex:/\b([A-Za-z_]\w*)(\s*\:\s*)/,comment:"Variable definitions - bytes data; | uint x = uint(y);"},{token:"keyword.control",regex:/=|!|>|<|\||&|\?|:|\^|~|\*|\+|\-|\/|\%|\bhex\b/,comment:"Operators"},{token:["constant.language","text","constant.language"],regex:/\b(msg|block|tx|abi)(\.)([A-Za-z_]\w*)\b/,comment:"msg and block special usage"},{token:"constant.language",regex:/\b(?:now|delete)\b/,comment:"Now and delete"},{token:["constant.language","text"],regex:/\b(blockhash|gasleft|addmod|mulmod|keccak256|sha256|sha3|ripemd160|ecrecover)(\s*\()/,comment:"Function call - built-in functions"},{token:["support.type","text","constant.numeric","text","text","constant.numeric","text","text"],regex:/\b([A-Za-z_]\w*)(?:(\[)(\d*)(\]))?(?:(\[)(\d*)(\]))?(\()/,comment:"Function call, also for example - uint[] memory a = new uint[332](7); or uint[2][] memory arrayOfPairs = new uint[2][](size);"},{token:["text","support.type"],regex:/\b(\.)(length|selector)\b/,comment:"Special treatment for length and .selector"},{token:["constant.numeric","text","keyword.control"],regex:/\b(\d+)(\s+)(wei|finney|szabo|ether|seconds|minutes|hours|days|weeks|years)\b/,comment:"Ether and time units"},{token:"string.quoted",regex:/[\"\'].*?[\"\']/,comment:"Strings"},{token:["constant.numeric","constant.numeric"],regex:/\b(\d+)((?:e\d*)?)\b/,comment:"Numbers, possibly with scientific notation"},{token:"constant.numeric",regex:/\b0[xX][a-fA-F0-9]+\b/,comment:"Hexadecimal"}]},this.normalizeRules()};s.metaData={fileTypes:["sol"],name:"Solidity",scopeName:"source.solidity"},r.inherits(s,i),t.SolidityHighlightRules=s}),define("ace/mode/folding/cstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"],function(e,t,n){"use strict";var r=e("../../lib/oop"),i=e("../../range").Range,s=e("./fold_mode").FoldMode,o=t.FoldMode=function(e){e&&(this.foldingStartMarker=new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/,"|"+e.start)),this.foldingStopMarker=new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/,"|"+e.end)))};r.inherits(o,s),function(){this.foldingStartMarker=/([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/,this.foldingStopMarker=/^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/,this.singleLineBlockCommentRe=/^\s*(\/\*).*\*\/\s*$/,this.tripleStarBlockCommentRe=/^\s*(\/\*\*\*).*\*\/\s*$/,this.startRegionRe=/^\s*(\/\*|\/\/)#?region\b/,this._getFoldWidgetBase=this.getFoldWidget,this.getFoldWidget=function(e,t,n){var r=e.getLine(n);if(this.singleLineBlockCommentRe.test(r)&&!this.startRegionRe.test(r)&&!this.tripleStarBlockCommentRe.test(r))return"";var i=this._getFoldWidgetBase(e,t,n);return!i&&this.startRegionRe.test(r)?"start":i},this.getFoldWidgetRange=function(e,t,n,r){var i=e.getLine(n);if(this.startRegionRe.test(i))return this.getCommentRegionBlock(e,i,n);var s=i.match(this.foldingStartMarker);if(s){var o=s.index;if(s[1])return this.openingBracketBlock(e,s[1],n,o);var u=e.getCommentFoldRange(n,o+s[0].length,1);return u&&!u.isMultiLine()&&(r?u=this.getSectionRange(e,n):t!="all"&&(u=null)),u}if(t==="markbegin")return;var s=i.match(this.foldingStopMarker);if(s){var o=s.index+s[0].length;return s[1]?this.closingBracketBlock(e,s[1],n,o):e.getCommentFoldRange(n,o,-1)}},this.getSectionRange=function(e,t){var n=e.getLine(t),r=n.search(/\S/),s=t,o=n.length;t+=1;var u=t,a=e.getLength();while(++t<a){n=e.getLine(t);var f=n.search(/\S/);if(f===-1)continue;if(r>f)break;var l=this.getFoldWidgetRange(e,"all",t);if(l){if(l.start.row<=s)break;if(l.isMultiLine())t=l.end.row;else if(r==f)break}u=t}return new i(s,o,u,e.getLine(u).length)},this.getCommentRegionBlock=function(e,t,n){var r=t.search(/\s*$/),s=e.getLength(),o=n,u=/^\s*(?:\/\*|\/\/|--)#?(end)?region\b/,a=1;while(++n<s){t=e.getLine(n);var f=u.exec(t);if(!f)continue;f[1]?a--:a++;if(!a)break}var l=n;if(l>o)return new i(o,r,l,t.length)}}.call(o.prototype)}),define("ace/mode/solidity",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/solidity_highlight_rules","ace/mode/folding/cstyle"],function(e,t,n){"use strict";var r=e("../lib/oop"),i=e("./text").Mode,s=e("./solidity_highlight_rules").SolidityHighlightRules,o=e("./folding/cstyle").FoldMode,u=function(){this.HighlightRules=s,this.foldingRules=new o};r.inherits(u,i),function(){this.$id="ace/mode/solidity"}.call(u.prototype),t.Mode=u});                (function() {
                    window.require(["ace/mode/solidity"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            