(function ($, undef){
	var _keys = {
		  8:	1 // backspace
		, 46:	1 // delete
		, 13:	1 // enter
		, 32:	1 // space
		, 37:	1 // left
		, 39:	1 // right
	};


	$.bem('b-tags', {
		_init: function (){
			this.$el.prop('scrollLeft', 0);

			this._$new	= this.$('__tag_new').attr('disabled', true);
			this._$inp	= this.$('__input');
			this._$tag	= this._$new
							.clone()
								.css({ position: 'absolute', visibility: 'hidden', display: '' })
								.removeClass(this.c('__tag_new'))
								.insertBefore(this._$new)
						;

			// Remove
			this._$new.find(this.s('__tag__remove')).remove();

			this
				.on('click', '__tag__remove, __tag', function (evt){
					this._$inp.focus();
					var $tag = $(evt.currentTarget);

					if( !$tag.hasClass(this.c('__tag_new')) && !evt.isDefaultPrevented() ){
						this[$tag.hasClass(this.c('__tag')) ? '_editTag' : '_removeTag']($tag);
						evt.preventDefault();
					}
				})
			;
		},


		_cancelEdit: function (){
			if( this._$edit ){
				this._$edit.css({ position: '', visibility: '' }).removeAttr('disabled');
				this._$edit = undef;
				this._$new.insertAfter(this._$tag);
				this._$inp.val('');
			}
		},


		_editTag: function ($tag){
			this._cancelEdit();

			var val = $tag
						.find(this.s('__tag__text'))
							.css('width', '')
							.text()
					;


			this._$edit = $tag
							.attr('disabled', true)
							.css({ position: 'absolute', visibility: 'hidden' })
						;

			this._$new.insertAfter($tag).show();
			this._$inp.val(val).focus();

			this._deselectTag();
			this._redraw();

			this._$inp.prop('selectionStart', 1e3).prop('selectionEnd', 1e3);
		},


		_removeTag: function ($tag){
			$tag = $tag
					.closest(this.s('__tag'))
						.attr('disabled', true)
						.animate({ width: 0, opacity: 0 }, 150, function (){
							$tag.remove();
						})
				;
			this.trigger({ type: 'removetag', target: $tag[0] });
			this._$new.show();
		},


		_deselectTag: function (){
			if( this._isSelTag ){
				this._isSelTag = false;

				var _focus = this.c('__tag_focus');
				this.$('.'+_focus).removeClass(_focus);
			}
		},


		_autoScroll: function (){
			var
				  $el = this.$el
				, $tag = this._$new
				, left = $tag.offset().left
				, absLeft = left - $el.offset().left
				, width = $tag.outerWidth()
			;

//			console.log(left);
			if( absLeft > 10 && (absLeft + width > this._tagMaxWidth) ){
				$el.prop('scrollLeft', this.$prop('scrollLeft') + (absLeft + $tag.width()) - this._tagMaxWidth);
			}
		},


		_setTagMinWidth: function ($X, $A, $B){
			var Aw = $A.width(), Bw;

			if( Aw > this._tagMaxWidth ){
				Bw = $B.width();
				$X.css('width', Bw + (($B.outerWidth(false) - Bw) - ($A.outerWidth(false) - Aw)));
			}
		},


		_redraw: function (evt){
			var
				  $text = (this._$edit || this._$tag).find(this.s('__tag__text'))
				, val = this._$inp.val()
			;

			if( val == '' ){
				$text.html('&nbsp;');
			}
			else {
				$text.text(val);
			}

			this._$inp.width(Math.min(Math.max($text.width(), 10)+5, this._tagMaxWidth));

			if( this._val !== val ){
				this._val = val;
				this._deselectTag();
			}

			this._autoScroll();
		},


		_reset: function (clone){
			if( clone ){
				var $tag = this._$edit || this._$tag.clone();

				this._setTagMinWidth($tag, this._$tag, this._$new);

				if( this._$edit ){
					this.trigger({ type: 'updatetag', target: $tag[0] });
					this._cancelEdit();
				}
				else {
					$tag
						.removeAttr('disabled')
						.css({
							  position: ''
							, visibility: ''
							, opacity: 0
							, top: -10
						})
						.insertBefore(this._$tag)
						.animate({ opacity: 1, top: 0 }, 180)
					;

					this.trigger({ type: 'inserttag', target: $tag[0] });
				}
			}

			this._$inp.val('').width(5);
			this._tagMaxWidth = this.$el.width() - this._$new.outerWidth();

			this._$inp.focus();
			this._redraw();
		},


		_onKey: function (evt){
			var
				  key = evt.keyCode
				, multiple = evt.shiftKey
				, prevent = false
			;


			if( key in _keys ){
				var val = this._$inp.val();

				if( (this._$edit === undef) && (typeof val != 'string' || !val.length) ){
					var $focusTag = this.$('__tag_focus');

					if( key == 8 || key == 46 ){
						// backspace OR delete
						if( $focusTag[0] ){
							this._removeTag($focusTag);
						}
						else if( key == 8 ){
							// backspace
							this._moveSelect(-1, multiple);
						}
						prevent	= true;
					}
					else if( key == 37 || key == 39 ){
						// left OR right
						prevent	= true;
						this._moveSelect(key == 37 ? -1 : 1, multiple);
					}
					else if( key == 13 && $focusTag.length == 1 ){
						// edit tag
						prevent	= true;
						this._editTag($focusTag);
					}
				}
				else if( key == 13 ){
					// enter (not empty): add tag
					this._reset(true);
					prevent = true;
				}

				if( prevent ){
					evt.preventDefault();
				}
			}
		},


		_moveSelect: function (offset, multiple){
			var
				  $tags = this.$('__tag:not([disabled])')
				, _focus = this.c('__tag_focus')
				, idx = $tags.filter('.'+_focus+':'+(offset == 1 ? 'last' : 'first')).index()
				, len = $tags.length
				, sel = false
			;

			if( len ){
				if( !multiple ){
					this._deselectTag();
//					$tags.eq(idx).removeClass(_focus);
				}

				if( idx == -1 ){
					sel = true;
					$tags[offset == 1 ? 'eq' : 'last'](0).addClass(_focus);
				}
				else if( $tags[idx + offset] ){
					sel = true;
					$tags.eq(idx+offset).addClass(_focus);
				}
			}

			if( !this._isSelTag || !multiple ){
				this._$new.toggle(!sel);
				this._isSelTag = sel;
			}
		},


		_hoverListener: function (){
			if( !(this.mod('focus') || this.mod('hover')) ){
				this.off('.tags__tag')
			}
			else if( !this.hasOn('mouseover') ){
				this.on('hover.tags__tag', '__tag', '_hoverTag');
			}
		},


		_hoverTag: function (evt){
			$(evt.currentTarget).toggleClass(this.c('__tag_hover'), evt.type == 'mouseenter');
		},


		onMod: {
			focus: function (state){
				this._$new.toggle(state);

				if( state ){
					this
						.onOutside('keydown.tags', '_onKey')
						.on('keypress.tags input.tags keyup.tags', '_redraw')
					;
					this._reset();
				}
				else {
					this._deselectTag();
					this.offOutside('.tags').off('.tags')._cancelEdit();
				}

				this._hoverListener();
			},

			hover: function (){
				this._hoverListener();
			}
		}
	}, {
		// @statics
		mods: 'focus hover',
		live: {
			leftclick: function (evt){
				if( !$(evt.target).closest(this.s('__tag'), this.el)[0] ){
					this._cancelEdit();
					this._$new.show();
					this._$inp.focus();
					this._deselectTag();
					this._redraw();
				}
			}
		}
	})
})(jQuery);
