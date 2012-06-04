(function (document, $, undef){
	var utils = {
		findNodeByRegExp: function (node, val){
			var res;

			if( utils.isText(node) && val.test(node.nodeValue) ){
				res	= node;
			}
			else {
				var children = node.childNodes, i = children.length;
				while( i-- ){
					if( res = utils.findNodeByRegExp(children[i], val) ){
						break;
					}
				}
			}

			return	res;
		},

		wrapText: function (node, start, length, tag){
			var rang;
			if( document.body.createTextRange ){
				rang = document.body.createTextRange();
				rang.move('character', start);
				rang.moveEnd(length);
				rang.pasteHTML(tag.outerHTML.replace('></', '>'+rang.text+'</'));
			}
			else {
				rang = document.createRange();
				rang.setStart(node, start);
				rang.setEnd(node, start + length);
				rang.surroundContents(tag);
			}
		},

		selectNode: function (node){
			var rang = document.createRange();
			rang.selectNode(node);
			return	rang;
		},


		isText: function (node){
			return	node && node.nodeType == 3;
		}
	};



	$.bem('b-filter', {
		bindAll: '_onFilter',

		searchType: 'any',
		ceseSensitive: false,

		_init: function (){
			var span = document.createElement('span');
			span.className = this._highlightClassName = this.s('__list__item__highlight', 1);
			this._highlightNode	= span;
		},

		onMod: {
			focus: function (state){
				this[state ? 'on' : 'off']('keydown.filter', '__input', '_onKeyDown');
			}
		},

		_onKeyDown: function (){
			clearTimeout(this._onFilterId);
			this._onFilterId = setTimeout(this._onFilter, 150);
		},

		_getSearchRegExp: function (val){
			return	val && new RegExp((this.searchType == 'first' ? '^' : '')+val, this.ceseSensitive ? '' : 'i');
		},

		_onFilter: function (){
			var
				  val = this.$('__input').val()
				, rval = this._getSearchRegExp(val)
				, $items = this.$('__list').find('.js-filter-item')
				, i = 0, n = $items.length, node, className
				, yes = this.s('__list__item_filtered', 1)
			;

			for( ; i < n; i += 1 ){
				className	= (' '+(node = $items[i]).className+' ')
								.replace(' '+yes+' ', ' ')
							;

				if( node.__filtered ){
					this.removeHighlight(node);
					node.__filtered = false;
				}

				if( val.length ){
					node.__filtered	= true;

					if( this.filter(node, rval, val) ){
						this.highlight(node, rval, val);
					} else {
						className +=  yes;
					}
				}

				node.className	= $.trim(className);
			}

			this.trigger({ type: 'filter', value: val });
		},

		filter: function (node, rval){
			return	rval.test(node.textContent || node.innerText);
		},

		highlight: function (node, rval, val){
			if( node = utils.findNodeByRegExp(node, rval) ){
				utils.wrapText(node, node.nodeValue.search(rval), val.length, this._highlightNode.cloneNode(true));
			}
		},

		removeHighlight: function (node){
			var
				  list = node.getElementsByTagName('span')
				, i = list.length
				, val
				, node
				, parent
				, next
			;

			while( i-- ){
				node = list[i];
				if( ~node.className.indexOf(this._highlightClassName) ){
					val		= node.innerHTML;
					parent	= node.parentNode;

					parent.insertBefore(node.firstChild, node);
					parent.removeChild(node);

					node = parent.firstChild;

					do {
						if( next = node.nextSibling ){
							if( utils.isText(node) && utils.isText(next) ){
								node.nodeValue += next.nodeValue;
								parent.removeChild(next);
							} else {
								node = next;
							}
						} else {
							break;
						}
					} while( 1 );

					break;
				}
			}
		}
	}, {
		mods: 'focus'
	});
})(document, jQuery);
