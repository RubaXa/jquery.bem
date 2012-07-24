/**
 * @require   jquery.bem.control, jquery.bem.list, jquery.bem.dropdown
 */

(function ($, undef){
	var
		  $dummy = $('<p/>')
		, _rtpl = /\{\{([^\}]+)\}\}/g
		, _keys = {
			  38: -1 // up
			, 40: 1 // down
		}
	;

	function _make(tpl, node){
		var data = { text: node.text, value: node.value, label: node.label };

		$.each(node.attributes, function (name, attr){
			name = attr.name;
			if( ~name.indexOf('data-') ){
				data[name]	= attr.value;
			}
		});

		$dummy[0].innerHTML	= tpl.replace(_rtpl, function (a, key){
			return key in data ? data[key] : '';
		});

		return	$dummy[0].firstChild;
	}



	$.bem('b-select', 'b-dropdown', {
		elList:	'options',

		debounceAll: '_searchInSelect:150',

		multiple: false,
		searchDelay: 1500,

		onMod: {
			focus: function (state, mod){
				this.parent(state, mod);
				this[state ? 'onOutside' : 'offOutside']('keydown.select keypress.select', this._onSelectKeyPress);
			},

			expanded: function (state, mod){
				this._reset();
				this.parent(state, mod);

				if( state ){
					this._refresh();
					this._selectOption(this.index());

					// Disable loop list
					this.elem(this.elList).loop = false;

					this.onOutside('DOMMouseScroll mousewheel', '_onMouseWheel');
				}
				else {
					this.offOutside('DOMMouseScroll mousewheel');
				}
			}
		},


		_init: function (){
			// Call parent method
			this.parent();

			this.elSelect	= this.el.getElementsByTagName('select')[0];
			this.elOptions	= this.elSelect.options;

			var
				  __list = this.__list
				, __option = (this.__option = __list + '__option')
				, __optgroup = (this.__optgroup = __list + '__optgroup')
				, self = this.self
			;

			this._tpl = {
				  option: 	$dummy.html(this.$(__option)[0] || self.option).html()
				, optgroup:	$dummy.html(this.$(__optgroup)[0] || self.optgroup).html()
			};

			this.on('selectitem hoverenter', function (evt){
				if( evt.type == 'selectitem' ){
					this.index(evt.index);
				}
				else if( this._float ){
					this._position(true);
				}
				else {
					this._autoScrollTo(evt.target);
				}
			});

			// Reset buffer
			this._reset();

			// fixed current selectedItem
			this.index(this.index(), true);
		},


		_buildOptions: function (list){
			var
				  i = 0
				, n = list.length
				, opt
				, node
				, name
				, fragment = document.createDocumentFragment()
			;


			for( ; i < n; i++ ){
				node	= list[i];
				name	= node.nodeName.toLowerCase();

				if( node.nodeType == 1 ){
					opt	= _make(this._tpl[name], node);

					if( name == 'option' ){
						opt.className += (node.disabled ? ' '+this.s(this.__list + '__option_disabled', 1) : '');
					}
					else {
						opt.appendChild(this._buildOptions(node.childNodes));
					}

					fragment.appendChild(opt);
				}
			}

			return	fragment;
		},


		_onSelectKeyPress: function (evt){
			var which = evt.which, ts = (new Date).getTime(), key = evt.keyCode;

			if( evt.type != 'keypress' ){
				if( (key in _keys) && !this.hasMod('expanded') ){
					var
						  pad = _keys[key]
						, idx = this.index() + pad
						, options = this.elOptions
					;
					this.index(options[idx] ? idx : (pad < 1 ? options.length-1 : 0));
				}
			}
			else if( which ){
				if( ts - this._bufferTS > this.searchDelay ){
					this._bufferVal	= '';
				}

				this._bufferTS	 = ts;
				this._bufferVal	+= String.fromCharCode(which);

				this._searchInSelect();
			}
		},


		_searchInSelect: function (){
			var
				  options = this.elOptions
				, i = 0
				, n = options.length
				, val = new RegExp('^'+this._bufferVal, 'i')
				, option
			;

			for( ; i < n; i++ ){
				option	= options[i];
				if( !option.disabled && val.test(option.text) ){
					if( this.hasMod('expanded') ){
						this._autoScrollTo(i, true);
					}
					else {
						this.index(i);
					}
					break;
				}
			}
		},


		_selectOption: function (idx){
			var
				  $Sel = this.elem(this.elList).selectByIndex(idx)
				, _selected = this.s(this.__option+'_selected', 1)
			;

			this.$(this.__list).find('.' + _selected).removeClass(_selected);
			$Sel.addClass(_selected);

			return	$Sel;
		},

		_reset: function (){
			this._bufferTS	= (new Date).getTime();
			this._bufferVal	= '';
		},

		_refresh: function (){
			if( this.hasMod('expanded') ){
				this.$(this.__list)
					.empty()
					.append( this._buildOptions(this.elSelect.childNodes) )
				;

				this.index(this.index(), true);
				this._reset();
				this._position();
			}
		},

		_onMouseWheel: function (evt){
			evt = evt.originalEvent;

			var $el = this.$el, $options, delta = evt.wheelDelta, top;

			if( evt.detail ){
				delta = -evt.detail;
			}

			if( $el.has(evt.target).length ){
				$options = this.$(this.__list);
				top = $options.scrollTop();

				if(
					   (delta > 0 && top > 0)
					|| (delta < 0 && $options.prop('scrollHeight') - top > $options.outerHeight())
				){
					return;
				}
			}

			// Stop propagation
			return	false;
		},

		_autoScrollTo: function (item, hover){
			if( hover ){
				item	= this.elem(this.elList).selectByIndex(item);
			}

			var
				  $el = this.$el
				, $item = $(item)
				, $options = this.$(this.__list)
				, height = $item.outerHeight()
				, top = $item.offset().top - $options.offset().top
				, bottom = top + height
				, scrollTop = $options.prop('scrollTop')
			;

			if( top < 0 ){
				scrollTop	= scrollTop - height;
			}
			else if( bottom > $options.height() ){
				scrollTop	= bottom - $options.height() + scrollTop;
			}

			$options.prop('scrollTop', scrollTop);
		},


		_position: function (hover){
			var
				  $el = this.$el
				, $item = this.$(this.__option + (hover ? '_hover' : '_selected'))
				, $options = this.$(this.__list).css({ left: 0, top: 0, height: '', width: '' }).prop('scrollTop', 0)
				, $win = this.self.$win

				, elOffset = $el.offset()

				, Yw = $win.scrollTop()
				, Hw = $win.height()

				, Ye = elOffset.top
				, He = $options.outerHeight()

				, Hi = $item.outerHeight()
				, Yi = $item.offset().top + Math.max(Hi - this.$(this.__ctrl).outerHeight(), 0)/2

				, Hew = Ye - Yw
				, Hei = Yi - Ye
				, Hs = Math.max(Hei - Hew, 0)

				, Y = Ye - Yi
				, H =  Math.min(Hw - Ye - Y - Hs - 5 + Yw, He - Hs) - Hi/2
			;

			$options
				.css({
					  top: Y + Hs + 5
					, left:	0
					, width: $options.prop('scrollWidth') + 15
					, height: Math.min(Hw, Math.max(H, Hi*5)) - 5
					, position: 'absolute'
				})
				.prop('scrollTop', Hs + (this.$(this.__option).last().is($item) ? 1000 : 0))
			;

			this._float = (Hw - H > 30) && ($options.prop('scrollHeight') - $options.outerHeight() > 15);
		},


		index: function (idx, force){
			var Select = this.elSelect, _idx = Select.selectedIndex;

			if( idx === undef ){
				return	_idx;
			}
			else if( _idx != idx || force ){
				Select.selectedIndex = idx;

				if( this.hasMod('expanded') ){
					this._selectOption(idx);
				}

				this.$(this.__ctrl).html(_make(this._tpl.option, Select.options[idx]).childNodes);
				this.trigger({ type: 'change', target: Select, isBEM: true });
			}
		},


		get: function (idx){
			return	this.elOptions[idx];
		},


		add: function (items, idx){
			var options = document.createDocumentFragment(), oldOpt = this.get(idx);

			$.each([].concat(items), function (opt){
				var newOpt = new Option;

				if( typeof opt === 'string' ){
					newOpt.text = opt;
				}
				else {
					$.extend(newOpt, opt);
				}

				options.appendChild(newOpt);
			});


			if( oldOpt ){
				$(oldOpt).before(options);
			}
			else {
				$(this.elSelect).append(options);
			}

			this._refresh();
		},


		remove: function (idx){
			var opt = this.get(idx);
			this.elSelect.remove(idx);
			this._refresh();
			return	opt;
		},


		clear: function (){
			this.elOptions.length = 0;
			this._refresh();
		}

	}, {
		forced: true,
		live: {
			change: function (evt){
				!evt.isBEM && this.index(evt.target.selectedIndex, true);
			},

			refresh: '_refresh'
		}
	});



	$.bem('b-select__options', 'b-list', { elItem: 'option' });
})(jQuery);
