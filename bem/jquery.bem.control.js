/**
 * @require	jquery.bem
 */
(function ($, noop, undef){
	/**
	 * Abstract control
	 */
	$.bem('b-control', {
		boundAll: '_setLoadingMod',

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

		onFocusHotKeyCheck: noop,


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
		live: { leftclick: 'onClick' },
		abstract: true
	});


	/**
	 * Button
	 */
	$.bem('b-button', 'b-control', {
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
	$.bem('b-checkbox', 'b-control', {
		role: 'checkbox',

		onMod: {
			'checked': function (state){
				var attrs = { checked: state };

				this
					.$aria(attrs)
					[this._checkedLock ? 'F' : '$prop'](':input', attrs)
				;

				if( !this._changeEmitLock ){
					this.$(':input').trigger({ type: 'change', isBEM: true });
				}

				this.trigger({ type: 'checked', state: state });
			}
		},

		onClick: function (evt){
			var
				  $elm	= $(evt.target)
				, type	= evt.type
				, emit	= type == 'keyup'
				, isInp	= $elm.is(':input')
			;

			if( evt.isBEM || (type == 'leftclick' && isInp) ) return;

			this._checkedLock = false;

			if( !isInp && evt.type == 'leftclick' ){
				if( $elm.closest('label')[0] ){
					this._checkedLock = true;
				} else {
					emit = true;
				}
			}

			if( emit ){
				evt.preventDefault();
			}

			this._changeEmitLock = !emit;

			if( this.role == 'radio' ){
				this.addMod('checked');
			} else {
				this.toggleMod('checked', type == 'change' ? $elm.prop('checked') : undef);
			}

			this._changeEmitLock = false;
		}

	}, {
		cache:	true,
		live:	{ change: 'onClick' }
	});



	/**
	 * Radio
	 */
	$.bem('b-radio', 'b-checkbox', {
		role: 'radio',

		onMod: {
			'checked_yes': function (){
				this._uncheckAll();
			}
		},

		_uncheckAll: function (){
			var
				  cur = this.$(':input')[0]
				, group = document.getElementsByName(cur.name)
				, i = group.length
				, radio
				, $dummy = $({})
			;

			while( i-- ){
				radio = group[i];
				if( radio.type == 'radio' && radio !== cur ){
					$dummy[0] = radio;
					$dummy.trigger('uncheck');
				}
			}
		}

	}, {
		live: {
			uncheck: function (){
				this._changeEmitLock = true;
				this.delMod('checked');
				this._changeEmitLock = false;
			}
		}
	});
})(jQuery, jQuery.noop);
