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
		elList: 'list',
		elItem: 'list__item',
		elInput: 'input',
		elHighlight: 'list__item__highlight',
		modItemFiltered: 'filtered',


		boundAll: '_onFilter',
		searchType: 'any',
		ceseSensitive: false,


		_init: function (){
			this.__list			= '__' + this.elList;
			this.__item			= '__' + this.elItem;
			this.__input		= '__' + this.elInput;
			this.__highlight	= '__' + this.elHighlight;
			this._itemFiltered	= this.__list +'_'+ this.modItemFiltered;

			this._itemFilteredClassName	= this.s(this._itemFiltered, 1);

			var span = document.createElement('span');
			span.className = this.__highlightClassName = this.s(this.__highlight, 1);
			this._highlightNode	= span;
		},


		onMod: {
			focus: function (state){
				this[state ? 'on' : 'off']('keydown.filter', this.__input, '_onKeyPress');
			}
		},


		_onKeyPress: function (){
			clearTimeout(this._onFilterId);
			this._onFilterId = setTimeout(this._onFilter, 100);
		},


		_getSearchRegExp: function (val){
			return	val && new RegExp((this.searchType == 'first' ? '^' : '')+val, this.ceseSensitive ? '' : 'i');
		},


		_onFilter: function (){
			this.filter(this.$(this.__input).val());
		},


		_filter: function (node, rval){
			return	rval.test(node.textContent || node.innerText);
		},


		_highlight: function (node, rval, val){
			if( node = utils.findNodeByRegExp(node, rval) ){
				utils.wrapText(node, node.nodeValue.search(rval), val.length, this._highlightNode.cloneNode(true));
			}
		},


		_removeHighlight: function (node){
			var
				  list = node.getElementsByTagName('span')
				, i = list.length
				, val
				, node
				, next
				, parent
				, __highlight = ' '+this.__highlightClassName+' '
			;

			while( i-- ){
				node = list[i];
				if( ~(' '+node.className+' ').indexOf(__highlight) ){
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
		},


		filter: function (val){
			var
				  rval = this._getSearchRegExp(val)
				, $items = this.$(this.__list).find('.js-filter-item')
				, i = 0
				, n = $items.length
				, node
				, yes = this._itemFilteredClassName
				, className
			;

			for( ; i < n; i += 1 ){
				className	= ' '+ (node = $items[i]).className +' ';

				if( ~className.indexOf(yes) ){
					className = className.replace(' '+yes+' ', ' ');
				}
				else {
					this._removeHighlight(node);
				}

				if( val.length ){
					if( this._filter(node, rval, val) ){
						this._highlight(node, rval, val);
					} else {
						className += yes;
					}
				}

				node.className	= $.trim(className);
			}

			this.trigger({ type: 'filter', value: val });
		}
	}, {
		mods: 'focus'
	});
})(document, jQuery);
