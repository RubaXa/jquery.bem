/**
 * @require	jquery.bem.control, jquery.bem.list
 */

(function ($){
	var _rinput = /input|select|textarea/i;

	$.bem(['b-control', 'b-dropdown'], {
		autoCollapse: true,

		_init: function (){
			this
				[this.autoCollapse ? 'on' : 'F']('selectitem', 'collapse')
				.on('leftclick', '__link', 'onFocusHotKey')
			;
		},


		onFocusHotKey: function (evt){
			if( !evt.isDefaultPrevented() || this.hasMod('expanded') )
				this.toggleMod('expanded');
		},


		onFocusHotKeyCheck: function (evt){
			if( this.hasMod('expanded') && _rinput.test(evt.target.tagName) ){
				return	false;
			}
		},


		collapse: function (){
			this.delMod('expanded');
		},


		onMod: {
			expanded: function (state){
				this
					[state ? 'on' : 'off']('keyup.esc', '_onKeyUpEsc')
					.$css('__list', { zIndex: state ? 1500 : '' })
					.$aria({ expanded: state })
					.elem('list')
						.mod('active', state)
				;
				this.trigger(state ? 'expand' : 'collapse');
			},

			disabled: function (state){
				if( state ){
					this.collapse();
				}
			},

			focus_no: function (){
				this.collapse();
			},

			'*': function (mod, state){
				var ret = this.parent(mod, state);

				if( ret !== false && state && this.isDisabled() ){
					ret	= !~'expanded'.indexOf(mod);
				}

				if( ret !== false ){
					this.elem('link').mod(mod, state);
					if( mod == 'expanded' ){
						this.elem('list').mod(mod, state);
					}
				}

				return	ret;
			}
		},

		_onKeyUpEsc: function (evt){
			if( evt.keyCode == 27 ){
				this.collapse();
			}
		}
	}, {
		mods:	'hover focus',
		cache:	true
	});


	$.bem(['b-list', 'b-dropdown__list']);
})(jQuery);
