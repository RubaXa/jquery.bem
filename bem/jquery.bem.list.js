/**
 * @require	jquery.bem.control
 */
(function ($, undef){
	var _keys = {
		  13: 1 // enter
		, 32: 1 // space
		, 38: 1 // up
		, 40: 1 // down
	};


	$.bem('b-list', {
		elItem: 'item',

		isFrozen: false,

		loop: true,
		canHover: true,
		autoSelect: false,

		boundAll: '_active _unactive _onHoverEnable',

		_init: function (){
			this.__item			= '__' + this.elItem;
			this.__item_hover	= this.__item + '_hover';

			this.on('click', this.__item, function (evt){
				this._hoverItem(evt.currentTarget);
				this._onKeyPress({ keyCode: 13, type: 'keyup' });
			});
		},

		_activeDebouce: function (){
			clearTimeout(this._activeId);
			this._activeId	= setTimeout(this._active, 0);
		},

		_unactiveDebounce: function (){
			clearTimeout(this._activeId);
			this._activeId	= setTimeout(this._unactive, 0);
		},

		_active: function (){
			if( !this.hasOutside('keyup.list') ){
				this.onOutside('keyup.list keydown.list', '_onKeyPress');
			}
		},

		_unactive: function (){
			this.offOutside('keyup.list keydown.list');

			if( !this.hasMod('active') ){
				// Deselect
				this._hoverItem(null);
			}
		},

		_hoverItem: function (node, byKey){
			var
				  __item = this.__item
				, _hover = this.s(__item + '_hover', 1)
				, $sel = this.$('.'+_hover)
				, selNode = $sel[0]
				, $node
			;

			if( node && node !== this.el ){
				$node = $(node).closest(this.s(__item), this.$el);

				if( $node[0] !== selNode ){
					$sel.removeClass(_hover);

					if( !$node.is(this.s(__item + '_disabled')) ){
						$node.addClass(_hover);
					}
					else {
						$node[0] = undef;
					}

					if( $node[0] ){
						this.trigger({
							  type: 'hoverenter'
							, index: this.$(__item).index($node)
							, target: $node[0]
							, relatedTarget: selNode
							, keypress: !!byKey
						});
					}

					this.trigger({
						  type: 'hoverleave'
						, index: this.$(__item).index(selNode)
						, target: selNode
						, keypress: !!byKey
					});
				}

				$sel	= $node;
			}

			return	$sel;
		},

		_onHoverEnable: function (){
			this._onHoverDisabled	= false;
		},

		_onHover: function (evt){
			if( this.canHover && !this._onHoverDisabled ){
				this._hoverItem(evt.currentTarget);
			}
		},

		_onKeyPress: function (evt){
			var
				  key = evt.keyCode
				, type = evt.type
				, __item = this.__item
				, $sel
			;


			if( key in _keys ){
				$sel	= this._hoverItem();

				if( key < 38 ){
					if( type == 'keyup' && $sel[0] ){
						this.trigger({
							  type:		'selectitem'
							, target:	$sel[0]
							, index:	this.$(__item).index($sel)
						});
					}
				}
				else if( type == 'keydown' ){
					if( evt.preventDefault ){
						evt.preventDefault();
					}

					clearTimeout(this._onHoverEnableId);
					this._onHoverDisabled = true;

					this.moveHover(key == 40 ? 1 : -1, true);
				}
				else if( type == 'keyup' ){
					this._onHoverEnableId = setTimeout(this._onHoverEnable, 200);
				}
			}
		},


		onMod: {
			'active focus': function (state, mod){
				if( mod == 'focus' && state ){
					if( this.autoSelect && !this._hoverItem()[0] ){
						// select first item
						this._onKeyPress({ keyCode: 40 });
					}
				}

				if( state ){
					this._activeDebouce();
				}
				else if( !(this.hasMod('active') && mod == 'focus' || this.hasMod('focus') && mod == 'active') ){
					this._unactiveDebounce();
				}
			},

			disabled: function (){
				this.delMod('active focus');
				this._unactive();
			},

			'*': function (mod, state){
				if( state && this.isDisabled() ){
					return	!~'active focus'.indexOf(mod);
				}
			}
		},

		freeze: function (state){
			this._onHoverDisabled = state;
		},

		selectByIndex: function (idx){
			return	this._hoverItem(this.$(this.__item)[idx]);
		},

		moveHover: function (offset, byKey){
			var
				  __item	= this.__item
				, $items	= this.$(__item +':isVisible:not('+ this.s(__item + '_disabled') +')')
				, idx		= $items.index(this._hoverItem())
			;

			return	this._hoverItem($items[idx+offset] || (!~idx || this.loop) && $items[offset > 0 ? 0 : $items.length-1], byKey);
		}

	}, {
		mods: 'focus',

		live: {
			'focusin focusout': function (e){
				this[e.type == 'focusin' ? 'on' : 'off']('focusin.list', function (evt){
					if( evt.target !== this.el ){
						var $node = $(evt.target).closest(this.s(this.__item));
						if( $node[0] ){
							this._hoverItem($node);
						}
					}
				});
			},

			'mouseenter mouseleave': function (evt){
				if( evt.type != 'mouseleave' ){
					this._hoverItem(evt.target);
					this.on('hover.list', this.__item, '_onHover');
				} else {
					var _hover = this.s(this.__item + '_hover', 1);
					this.off('hover.list');
					this.$('.'+_hover).removeClass(_hover)
				}
			}
		}
	});
})(jQuery);
