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

	$.expr[':'].listitemvisible = function (node){
		return	node.offsetHeight > 5;
	};

	$.bem('b-list', {
		_init: function (){
			this.on('click', '__item', function (evt){
				this.select(evt.currentTarget);
				this._onKeyDown({ keyCode: 13 });
			});
		},

		select: function (node){
			var
				  sel = this.s('__item_hover')
				, cnHover = sel.substr(1)
				, $sel = this.$(sel)
				, selNode = $sel[0]
				, $node
			;

			if( node === undef ){
				return	$sel;
			}
			else if( node !== this.el ){
				$node = $(node).closest(this.s('__item'), this.$el);
				if( $node[0] !== selNode ){
					$sel.removeClass(cnHover);

					if( !$node.is(this.s('__item_disabled')) ){
						$node.addClass(cnHover);
					}
					else {
						$node[0] = undef;
					}

					this.trigger({ type: 'hoveritem', target: $node[0], relatedTarget: selNode });
				}
			}
		},

		_onHover: function (evt){
			this.select(evt.currentTarget);
		},

		_onKeyDown: function (evt){
			var
				  key = evt.keyCode
				, $sel
				, filter // jQuery rule
			;

			if( key in _keys ){
				$sel	= this.select();
				filter	= ':not('+this.s('__item_disabled')+'):listitemvisible';

				if( key < 38 ){
					if( $sel[0] ){
						this.trigger({ type: 'selectitem', target: $sel[0] });
					}
				}
				else {
					$sel	= $sel[key == 40 ? 'nextAll' : 'prevAll'](filter).first();
					filter	= this.s('__item') + filter;

					this.select($sel[0] ? $sel : this.$(filter)[key == 40 ? 'first' : 'last']());

					if( evt.preventDefault ) evt.preventDefault();
				}
			}
		},


		onMod: {
			'active focus': function (state, mod){
				if( mod == 'focus' && state ){
					if( this.autoSelect && !this.select()[0] ){
						// select first item
						this._onKeyDown({ keyCode: 40 });
					}
				}

				if( state ){
					if( !this.hasOutside('keydown.list') ){
						this.onOutside('keydown.list', '_onKeyDown');
					}
				}
				else if( !(this.hasMod('active') && mod == 'focus' || this.hasMod('focus') && mod == 'active') ){
					this.offOutside('keydown.list');
					if( !this.hasMod('active') ){
						// Deselect
						this.select(null);
					}
				}
			}
		}
	}, {
		mods: 'focus',

		live: {
			'focusin focusout': function (e){
				this[e.type == 'focusin' ? 'on' : 'off']('focusin.list', function (evt){
					if( evt.target !== this.el ){
						var $node = $(evt.target).closest(this.s('__item'));
						if( $node[0] ){
							this.select($node);
						}
					}
				});
			},

			'mouseenter mouseleave': function (evt){
				if( evt.type != 'mouseleave' ){
					this.select(evt.target);
					this.on('hover.list', '__item', '_onHover');
				} else {
					this.off('hover.list');
					this.select(null);
				}
			}
		}
	});
})(jQuery);
