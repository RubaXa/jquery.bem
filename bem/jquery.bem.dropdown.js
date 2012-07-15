/**
 * @require	jquery.bem.control, jquery.bem.list
 */

(function ($){
	var _rinput = /input|select|textarea/i, zIndex = 10000;

	$.bem('b-dropdown', 'b-control', {
		boundAll: 'collapse',

		elCtrl:	'ctrl',
		elList:	'list',

		timeout: 0,
		autoCollapse: true,


		_init: function (){
			this.__ctrl	= '__' + this.elCtrl;
			this.__list	= '__' + this.elList;

			this.on('leftclick', this.__ctrl, 'onFocusHotKey');

			if( this.autoCollapse ){
				this.on('selectitem', this.collapse);
			}
		},


		onFocusHotKey: function (evt){
			if( !evt.isDefaultPrevented() || this.hasMod('expanded') ){
				this.toggleMod('expanded');
			}
		},


		onFocusHotKeyCheck: function (evt){
			if( this.hasMod('expanded') && _rinput.test(evt.target.tagName) ){
				return	false;
			}
		},


		collapse: function (){
			this.delMod('expanded');
		},


		_collapseByLeave: function (evt){
			clearTimeout(this._collapseLeaveId);
			if( evt.type == 'mouseleave' ){
				this._collapseLeaveId	= setTimeout(this.collapse, this.timeout);
			}
		},


		onMod: {
			expanded: function (state){
				var __list = this.__list;

				zIndex	+= state ? 1 : -1;

				this
					[state ? 'onOutside' : 'offOutside']('keyup.esc', '_onKeyUpEsc')
					.$css(__list, { zIndex: state ? zIndex : '' })
					.$aria({ expanded: state })
					.elem(this.elList)
						.mod('active', state)
				;

				if( this.timeout ){
					// collapse by onMouseLeave, after timeout (mSec)
					this.$(this.__ctrl)
						.add(this.$(__list))
							[state ? 'on' : 'off']('hover', this._collapseByLeave)
					;
				}

				this.trigger(state ? 'expand' : 'collapse');
			},


			disabled: function (state){
				state && this.collapse();
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
					this.elem(this.elCtrl).mod(mod, state);
					if( mod == 'expanded' ){
						this.elem(this.elList).mod(mod, state);
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
		mods:	'focus',
		cache:	true
	});


	$.bem('b-dropdown__ctrl', null, { mods: 'hover' });
	$.bem('b-dropdown__list', 'b-list');
})(jQuery);
