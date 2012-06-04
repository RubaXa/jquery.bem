/**
 * @require	jquery.bem
 */
(function ($, noop, undef){
	noop = $.noop;


	/**
	 * Abstract control
	 */
	$.bem([null, 'b-control'], {
		bindAll: '_setLoadingMod',

		onMod: {
			disabled: function (state){
				var attrs = { disabled: state };

				// Save current href
				this._href = this.href();


				this
					.$aria(attrs)
					.$attr(attrs)
					.$prop(':input', attrs)
					.$attr('href', state ? null : this._href)
				;


				if( state ){
					this.delMod('hover focus press');
				}
			},

			loading: function (state){
				if( state ){
					this.delMod('hover focus press');
				}
			},

			press: function (state){
				this.trigger(state ? 'press' : 'release');
			},

			hover_no: function (){
				this.delMod('press');
			},

			focus: function (state){
				if( state ){
					this.on('keydown.focus', 'onFocusKeyDown');
				} else {
					this.off('keyup.focus keydown.focus');
				}
			},

			'*': function (mod, state){
				if( state && (this.isDisabled() || this.hasMod('loading')) ){
					return	!~'press hover focus checked'.indexOf(mod);
				}
			}
		},

		loading: function (state){
			if( this._loadingState !== state ){
				clearTimeout(this._loadingId);
				this._loadingLock	= true;
				this._loadingState	= state;
				this._loadingId		= setTimeout(this._setLoadingMod, this.onLoadingDelay[+!state]*1000);
				return	false;
			}
		},

		_setLoadingMod: function (){
			this._loadingLock = false;
			this.mod('loading', this._loadingState);
		},


		onClick: noop,
		onLoadingDelay:[.65, .35],

		onFocusHotKeyCheck: $.noop,

		onFocusHotKey: function (evt){
			this.onClick(evt);
		},


		onFocusKeyDown: function (evt){
			if( !this.hasOn('keyup.focus') ){
				this.on('keyup.focus', function (e){
					if( this.hasMod('press') ){
						this.onFocusHotKey(e);
					}
					this.delMod('press').off('keyup.focus');
				});
			}

			var key = evt.keyCode;
			if( key == 13 || key == 32 ){
				if( this.onFocusHotKeyCheck(evt) !== false ){
					this.addMod('press');
					evt.preventDefault();
				}
			}
		},

		href: function (href){
			if( href !== undef ){
				this._href = href;
				if( !this.hasMod('disabled') ) this.$attr('href', href);
				return	this;
			}
			return	this.$attr('href') || this._href;
		}

	}, {
		mods: 'hover press focus',
		live: {
			leftclick: 'onClick'
		}
	});


	/**
	 * Button
	 */
	$.bem(['b-control', 'b-button'], {
		role: 'button',

		onMod: {
			press: function (state, mod){
				this.$aria({ pressed: state });
				this.parent(state, mod);
			}
		},

		onClick: function (){
			if( this.isDisabled() ){
				this._href = this.$attr('href') || this._href;
				this.$attr('href', null);
			}
			else if( !this.isClickSimulated ){
				this.isClickSimulated = true;
				this.$(':input').click();
				this.isClickSimulated = false;
			}
		}
	});


	/**
	 * Checkbox
	 */
	$.bem(['b-control', 'b-checkbox'], {
		role: 'checkbox',

		onMod: {
			'checked': function (state){
				var attrs = { checked: state };

				this
					.$aria(attrs)
					[this._checkedLock ? 'F' : '$prop'](':checkbox', attrs)
				;

				if( !this._chengeEmitLock ){
					this.$(':checkbox').trigger({ type: 'change', isBEM: true });
				}

				this.trigger({ type: 'checked', state: state });
			}
		},

		onClick: function (evt){
			var $cbx = $(evt.target), type = evt.type, emit = type == 'keyup';

			if( evt.isBEM || (type == 'leftclick' && $cbx.is(':checkbox')) ) return;

			this._checkedLock = false;

			if( !$cbx.is(':checkbox') && evt.type == 'leftclick' ){
				if( $cbx.closest('label')[0] ){
					this._checkedLock = true;
				} else {
					emit = true;
				}
			}

			if( emit ){
				evt.preventDefault();
			}

			this._chengeEmitLock = !emit;
			this.toggleMod('checked', type == 'change' ? $cbx.prop('checked') : undef);
			this._chengeEmitLock = false;
		},

		val: function (){
			return	this.$(':checkbox').val();
		}

	}, {
		cache: true,
		live: {
			change: function(evt){
				this.onClick(evt);
			}
		}
	});
})(jQuery);
