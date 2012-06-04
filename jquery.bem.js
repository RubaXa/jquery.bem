/*!
 * jQuery BEM
 * https://github.com/RubaXa/jquery.bem#readme
 *
 * @author	RubaXa	<trash@rubaxa.org>
 * @build	bem/jquery.bem.control
 */

(function (window, document, $, undef){
	'use strict';

	var
		  F = function (){} // Фцнкция пустышка
		, $dummy = $({})
		, _slice = [].slice

		, _idAttr = 'bemId' // название атрибута в котором храниться id экземпляра класса
		, _queue = 0 // Сколько ждут активации
		, _classes = window.clasess = {} // "ООП" классы, которые описывают поведение для селектора
		, _collector = {} // тут будем хранить связанные с эементами экземпляры класса

		, _rname = /\b([a-z\d-]+(?:__[a-z\d-]+)*)\b/ig // Получить именно название селектора из this.className, но не его модификаторы
		, _rspace = /\s+/g // Повторяющиеся пробелы

		//  Класса, который описывает поведение
		, Element = function (){ this.__lego.apply(this, arguments); }

		, _no	= false
		, _yes	= true

		, _autoMods = {
			  hover: 'mouseenter mouseleave'
			, press: 'mouseup mousedown'
			, focus: 'focusin focusout'
		}

		// Соответсвие события и модификатора
		, _eventMod = {
			  focusin:		['focus', _yes]
			, focusout:		['focus', _no]

			, mouseup:		['press', _no]
			, mousedown:	['press', _yes]

			, mouseover:	['hover', _yes]
			, mouseenter:	['hover', _yes]
			, mouseleave:	['hover', _no]
		},

		_matchAll = function (regexp, val){
			var ret = [], match;
			while( match = regexp.exec(val) ){
				ret.push(match);
			}
			return	ret;
		},

		_makeParent = function (method, parent){
			return	$.isFunction(method) && $.isFunction(parent) && !method.fn ? function (){
					var p = this.parent, ret;
					this.parent = parent;
					ret = method.apply(this, arguments);
					this.parent = p;
					return	ret;
				} : method;
		},

		_inherit = function (target, methods, parents){
			for( var key in methods ){
				target[key] = parents ? _makeParent(methods[key], parents[key]) : methods[key];
			}
		},


		_proxy = function (ctx, fn, args){
			if( typeof fn == 'string' ) fn = ctx[fn];
			if( args === undef ) args = [];
			return	fn === undef ? fn : fn.bind ? fn.bind.apply(fn, [ctx].concat(args)) : function (){ return fn.apply(ctx, args.concat(_slice.call(arguments))); };
		},


		_findInst = function(node, BEM, name){
			var Inst = _collector[node.getAttribute(_idAttr)], className = ' '+node.className+' ';

			if( Inst === undef ){
				if( BEM === undef || !~className.indexOf(' '+BEM.getName()+' ') ){
					var names = className.match(_rname), i, _class;
					if( names !== null ){
						i = names.length;
						while( i-- ) if( _class = _classes[names[i]] ){
							Inst = _class.init(node);
						}
					}
				}

				if( BEM !== false && Inst === undef ){
					Inst = (_classes[name] || BEM).init(node, undef, name);
				}
			}

			return	Inst;
		},

		_garbageCollectId
	;


	// jQuery special events
	$.event.special.leftclick = {
		setup: function() {
			$.event.add(this, 'click', $.event.special.leftclick.handler);
		},

		teardown: function() {
			$.event.remove(this, 'click');
		},

		handler: function(evt) {
			if( !evt.button && !(evt.metaKey || evt.shiftKey || evt.altKey || evt.ctrlKey) ){
				evt.type = 'leftclick';
				$.event.handle.apply(this, arguments);
				evt.type = 'click';
			}
		}
	};


	// jQuery extensions
	$.is = function (elm, sel){
		$dummy[0] = elm;
		return	$dummy.is(sel);
	};

	$.fn.hasOn = function (name, fn){
		var events = this.data('events'), ns = name.split('.'), i, has = false;

		name = ns.splice(0, 1);
		events = events && events[name];

		if( events ){
			if( ns.length || fn ){
				ns.sort();
				ns = ns.join('.');
				i = events.length;
				while( i-- ) if( !ns || ~events[i].namespace.indexOf(ns) ){
					has	= fn ? fn == events[i].handler : true;
					break;
				}
			} else {
				has	= true;
			}
		}

		return	has;
	};

	$.fn.isClosest = function (selector, context){
		return	this.closest(selector, context).length > 0;
	};


	// Метод наследования
	Element.extend = function (name, methods, statics){
		var
			  key
			, self = this
			, onMod = {}
			, proto = self.fn
			// Создаем новый класс
			, New = function (){
				this.__lego.apply(this, arguments);
			}
		;

		// Переносим все статические методы
		for( key in this ) if( self.hasOwnProperty(key) ){
			New[key] = self[key];
		}

		// Меняем текущий прототип для функции-пустышки, на текущий, тк наследуем методы
		F.prototype = proto;

		// Наследуемся
		New.fn =
		New.prototype = new F;

		// Устанавливаем ссылку на "себя", для доступа к статическим методам
		New.fn.__self = New;

		// Сохраняем название селектора, для которого мы создали этот класс
		New._name = name;

		// Определяем статические методы, если таковые есть
		if( statics ){
			_inherit(New.live = {}, self.live);
			_inherit(New.live, statics.live || {}, self.live);
			delete statics.live;

			for( key in statics ){
				New[key] = statics[key];
			}
		}

		_inherit(onMod, proto.onMod);

		// Переопределяем методы класса
		if( methods ){
			_inherit(onMod, methods.onMod || {}, proto.onMod);

			$.each(onMod, function (key, fn){
				delete onMod[key];
				key = key.split(_rspace);
				for( var i = 0; i < key.length; i++ ){
					onMod[key[i]] = fn;
				}
			});

			delete methods.onMod;

			_inherit(New.fn, methods, proto);
		}

		New.fn.onMod = onMod;

		return	New;
	};


	Element.methods = function (methods){
		var fn = this.fn;
		_inherit(fn.onMod, methods.onMod || {}, fn.onMod);
	};


	// Определяем статические методы
	$.extend(Element, {
		_body: undef,
		_name: undef, //  название селектора

		/**
		 * Еденый обработчик событий для всех эклемпляров
		 *
		 * @private
		 * @param {Event} evt
		 */
		_onEvent: function (evt){
			this.find(evt.currentTarget)._onEvent(evt);
		},

		$win: $(window),
		$doc: $(document),

		/**
		 * Ленивая (отложенная) загрузка
		 */
		lazy: false,

		/**
		 * Список live-событий и их обработчиков
		 */
		live: {},


		mods: '',

		/**
		 * Инициализация/создание инстанса
		 *
		 * @param {HTMLElement} node
		 * @param {Event} [evt]
		 * @param {String} [name]
		 * @returns {Element}
		 */
		init: function (node, evt, name){
			var
				  self	= this
				, live = []
				, i
				, j
			;


			if( !self.active ){
				self.active = true;

				if( self.mods ) $.each(self.mods.split(_rspace), function (i, mod){
					live.push(_autoMods[mod] || '');
				});

				// Соберем массив событий, которые нужно делегировать
				i = {};
				$.each(self.live, function (name, fn){
					name = $.trim(name).toLowerCase().split(_rspace);
					for( j = 0; j < name.length; j++ ){
						i[name[j]] = fn;
						live.push(name[j]);
					}
				});
				self.live = i;

				live = live.join(' ').split(_rspace);
				i = live.length;

				while( i-- ) {
					j = i;
					while( j-- ) if( live[i] == live[j] ){
						live.splice(i, 1);
						break;
					}
				}

				$(self.getBody()).on(live.join(' '), '.'+self.getName(), _proxy(self, '_onEvent'));
			}


			if( node ){
				var Inst = new this(node, name), type;
				if( evt ){
					type = evt.type;
					if( type == 'mouseover' ) evt.type = 'mouseenter';
					Inst._onEvent(evt);
					evt.type = type;
				}
				return	Inst;
			}
		},

		getBody: function (){
			return	this._body || this.$doc;
		},


		/**
		 * Найти или создать экземпляр класса, который отвечает за поведения данного нода
		 *
		 * @param {HTMLElement} node
		 * @returns {Element}
		 */
		find: function (node){
			return	_findInst(node, this);
		},

		getName: function (){
			return	this._name;
		}
	});


	// Element methods
	Element.fn = Element.prototype = {
		__self: Element,

		onMod: { '*': F },
		bindAll: [],

		cache: false,

		/**
		 * Lego
		 *
		 * @constructor
		 * @param {HTMLElement} node
		 * @param {String} [name]
		 */
		__lego: function (node, name){
			$.extend(this, (node.onclick || $.noop)() || {});

			this.name	= name || this.__self.getName();
			this.cache	= this.__self.cache;

			this.$el	= $(node).removeAttr('onclick');
			this.el		= this.$el[0];
			this.uniqId	= ++$.guid;
			this._mods	= {};
			this._cache	= {};

			_collector[$.guid] = this;

			var attrs = this.__self.attrs || {};
			attrs[_idAttr] = this.uniqId;
			if( this.role ) attrs.role = this.role;

			this.$attr(attrs);

			if( this.__self.lazy ){
				this.gap('ready')();
			} else {
				this.ready();
			}
		},

		ready: function (){
			this.ready = function (){ return this; };

			// Extract all modifiers
			var
				  bindAll = this.bindAll
				, mods = _matchAll(new RegExp('\\b'+this.name+'_([a-zA-Z0-9-]+)(_[a-zA-Z0-9-]+)?\\b', 'g'), this.el.className)
				, i = mods.length
				, state
			;

			// disable "trigger" method
			this._silent	= true;

			while( i-- ){
				this._mods[mods[i][1]] = state = mods[i][2] ? mods[i][2].substr(1) : true;
				this._emitMod(mods[i][1], state);
			}

			this._silent	= false;

			if( typeof bindAll == 'string' ) bindAll = bindAll.split(_rspace);
			bindAll.push('_onFocusOut');
			for( i = bindAll.length; i--; ){
				this[bindAll[i]] = this.proxy(bindAll[i]);
			}

			this._init();
			this._onEvent(true);

			return	this;
		},

		_init: F,
		_qevents: [], // events queue


		/**
		 * Получить название события
		 *
		 * @private
		 * @param {String} name
		 * @return {String}
		 */
		eventNS: function (name){
			return	(name || '').split(_rspace).join('.'+this.uniqId+' ') +'.'+ this.uniqId;
		},


		_onEvent: function (evt){
			if( evt === true ){
				this._onEvent = this.__onEvent;
				while( evt = this._qevents.shift() ){
					this._onEvent(evt);
				}
			} else {
				this._qevents.push(evt);
			}
		},


		/**
		 * Единый обработчик события
		 *
		 * @private
		 * @param {Event} evt
		 */
		__onEvent: function (evt){
			var
				  type = evt.type
				, mod = _eventMod[type]
				, self = this.__self
				, fn = self.live[type]
				, ret
			;


			if( type.indexOf('focus') === 0 ){
				clearTimeout(this._focusOutId);
				if( type == 'focusin' ){
					if( this.focused ) return;
					this.focused = true;
				} else if( this.focused ){
					this._focusEvent	= evt;
					this._focusOutId	= setTimeout(this._onFocusOut, 1);
					return;
				}
			}

			if( fn !== undef ){
				if( typeof fn == 'string' ) fn = this[fn];
				ret = fn.call(this, evt);
			}

			if( ret !== false && mod !== undef && ~self.mods.indexOf(mod[0]) ){
				// Set mod by event type
				this.mod(mod[0], mod[1]);
			}
		},

		_onFocusOut: function (){
			if( !$(document.activeElement).closest(this.el, this.$el)[0] ){
				this.focused = false;
				this._onEvent(this._focusEvent);
			}
		},


		/**
		 * Рассылка событий об изменения модификатора
		 *
		 * @private
		 * @param {String} mod
		 * @param {Boolean} state
		 * @param {Boolean} inner
		 * @return {Boolean}
		 */
		_emitMod: function (mod, state, inner){
			var
				  fn
				, onMod	= this.onMod
				, ret	= inner || onMod['*'].call(this, mod, state)
				, strState = typeof state === 'string'
			;

			if( ret !== false ){
				fn = onMod[mod];

				if( fn === false ){
					ret	= false;
				}
				else if( fn ){
					if( typeof fn == 'string' ){
						ret	= this[fn](state, mod);
					} else if( typeof fn === 'object' ){
						if( fn['*'] !== undef ) ret = fn['*'].call(this, state, mod);
						if( ret !== false && fn[strState ? state : (state ? 'yes' : '')] !== undef ) fn[state].call(this, state, mod);
					} else {
						ret	= fn.call(this, state, mod);
					}
				}

				if( ret !== false && inner !== true && this._emitMod(mod + (strState ? state : (state ? '_yes' : '_no')), state, true) === false ){
					ret = false;
				}
			}

			return	ret;
		},


		/**
		 * Уникальный идентификатор элемента
		 *
		 * @public
		 * @return {String}
		 */
		getId: function (){
			return	this.uniqId;
		},


		/**
		 * Получить функцию в контексте текущего объекъта
		 *
		 * @public
		 * @param {Object|String} fn
		 * @return {Function}
		 */
		proxy: function (fn){
			return	_proxy(this, fn, _slice.call(arguments, 1));
		},


		/**
		 * Название css-класс по имени модификатора
		 *
		 * @private
		 * @param {String} mod
		 * @param {String} state
		 * @return {String}
		 */
		_modClassName: function (mod, state){
			return	this.name +'_'+ mod + (state && typeof state === 'string' ? '_'+state: '');
		},


		/**
		 * Проверить/Добавить/Удалить модификатор
		 *
		 * @public
		 * @param {String} name
		 * @param {Boolean} state
		 * @return {*}
		 */
		mod: function (name, state){
			name = $.trim(name).split(_rspace);

			var
				  el = this.el
				, i =  name.length
				, mod
				, _mods = this._mods
				, currentMod
				, classMod
				, className
			;


			if( state === undef ){
				return	_mods[name];
			}


			while( i-- ){
				mod	= name[i];
				currentMod = _mods[mod];

				if( currentMod != state ){
					_mods[mod] = state;
					if( this._emitMod(mod, state) !== false ){
						classMod	= this._modClassName(mod, currentMod);
						className	= (' '+el.className+' ').replace(' '+classMod+' ', ' ');
						_mods[mod]	= state;

						if( state ){
							className += this._modClassName(mod, state) + ' ';
						}

						el.className = $.trim(className);
					} else {
						_mods[mod]	= currentMod;
					}
				}
			}

			return	this;
		},


		/**
		 * Проверить наличие модификатора
		 *
		 * @public
		 * @param {String} name
		 * @param {String} [state]
		 * @return {Boolean}
		 */
		hasMod: function (name, state){
			var val = this._mods[name];
			return	state === undef ? !!val : val == state;
		},


		/**
		 * Добавить модификаторы
		 *
		 * @public
		 * @param {String} name
		 * @param {String} [state]
		 * @return {Element}
		 */
		addMod: function (name, state){
			return	this.mod(name, state ? state : _yes);
		},


		/**
		 * Удалить модификаторы
		 *
		 * @public
		 * @param {String} name
		 * @param {String} [state]
		 * @return {Element}
		 */
		delMod: function (name, state){
			if( state === undef || this.hasMod(name, state) ){
				this.mod(name, false);
			}
			return	this;
		},


		/**
		 * Дабавить или удлаить модификатор
		 *
		 * @private
		 * @param {String} name
		 * @param {Boolean} [state]
		 * @return {Element}
		 */
		toggleMod: function (name, state){
			return	this.mod(name, state === undef ? !this.hasMod(name) : state);
		},


		s: function (sel, className){
			sel = typeof sel === 'string'
					? (sel.substr(0, 2) == '__' ? (className ? '' : '.')+ this.name + sel : sel)
					: sel;
			return	sel;
		},


		elem: function (name){
			var selector = this.s('__'+name);
			return	_findInst(this.$(selector)[0], Element, selector.substr(1));
		},


		F: function (){
			return	this;
		},


		/**
		 * Найти все элементы, соответсвующие селектору
		 *
		 * @public
		 * @param {String} sel
		 * @param {Boolean} force
		 * @return {jQuery}
		 */
		$: function (sel, force){
			var ret = this.$el, cache = force ? false : this.cache, _cache = this._cache;

			if( sel !== undef ){
				if( cache && _cache[sel] !== undef ){
					ret	= _cache[sel];
				} else {
					ret	= ret.find(this.s(sel));
					if( cache ){
						_cache[sel] = ret;
					}
				}
			}

			return	ret;
		},


		__$attr: function (method, sel, name, val){
			var ret = this, $el = ret.$el;

			if( val !== undef || name !== null && typeof name == 'object' ){
				$el = ret.$(sel);
			} else {
				val		= name;
				name	= sel;
			}


			if( val === null ){
				$el['remove'+method.charAt(0).toUpperCase()+method.substr(1)](name);
			}
			else if( typeof name != 'string' || val !== undef ){
				$el[method](name, val);
			}
			else {
				ret	= $el[method](name);
			}

			return	ret;
		},


		/**
		 * Получить или установить атррибуты для элемента, или селектора
		 *
		 * @public
		 * @param {*} sel
		 * @param {*} [name]
		 * @param {*} [val]
		 * @return {*}
		 */
		$attr: function (sel, name, val){
			return	this.__$attr('attr', sel, name, val);
		},

		$prop: function (sel, name, val){
			return	this.__$attr('prop', sel, name, val);
		},


		$css: function (sel, name, val){
			return	this.__$attr('css', sel, name, val);
		},


		/**
		 * Установить aria-атрибут(ы)
		 *
		 * @public
		 * @param {*} name
		 * @param {String} [val]
		 * @return {*}
		 */
		$aria: function (name, val){
			var ret = this, obj;

			if( $.type(name) == 'object' || val !== undef ){
				obj = {};
				if( $.type(name) == 'string' ) obj['aria-'+name] = val;
				else $.each(name, function (k, v){ obj['aria-'+k] = v });
				ret.$attr(obj);
			} else {
				ret	= ret.$attr('aria-'+name);
			}

			return	ret;
		},

		$closest: function (sel){
			return	this.$el.closest(this.s(sel));
		},

		is: function ($elm, sel){
			return	this.$(sel).is($elm);
		},

		gap: function (fn){
			var ctx = this;
			return	function (){
				var args = arguments;
				setTimeout(function (){
					(typeof fn == 'string' ? ctx[fn] : fn).apply(ctx, args);
				}, 0);
			};
		},

		onOutside: function (name, fn){
			this.__self.$doc.on(this.eventNS(name), _proxy(this, fn));
			return	this;
		},

		offOutside: function (name){
			this.__self.$doc.off(this.eventNS(name));
			return	this;
		},

		one: function (name, sel, fn){
			if( fn === undef ){
				fn = sel;
				sel = undef;
			}

			this.$el.one(this.eventNS(name), this.s(sel), _proxy(this, fn));
			return	this;
		},

		hasOn: function (name, sel, fn){
			if( typeof sel != 'string' ){
				fn	= sel;
				sel	= undef;
			}

			return	this.$(sel).hasOn(this.eventNS(name), fn);
		},

		hasOutside: function (name, fn){
			return	this.__self.$doc.hasOn(this.eventNS(name), fn);
		},

		on: function (name, sel, fn){
			if( fn === undef ){
				fn	= sel;
				sel	= undef;
			}

			this.$el.on(this.eventNS(name), this.s(sel), _proxy(this, fn));
			return	this;
		},

		off: function (name, sel){
			this.$el.off(this.eventNS(name), this.s(sel));
			return	this;
		},

		trigger: function (event, args){
			if( !this._silent ) this.$el.trigger(event, args);
			return	this;
		},

		isDisabled: function (){
			return	this.mod('disabled');
		},

		inDOM: function (){
			var el = this.el;
			return	el && (el = el.parentNode) && el.nodeType > 0;
		},

		destroy: function (absolute){
			this.destroy = F;
			delete _collector[this.getId()];

			var self = this.__self;

			this.off();
			this.$el
				.removeAttr(_idAttr)
				.find('['+_idAttr+']')
					.bem('destory')
			;

			self.$win.add(self.$doc).off('.'+this.uniqId);

			// Absolute destroy
			absolute && this.$el.remove();

			for( var key in this ) if( this.hasOwnProperty(key) ){
				delete this[key];
			}
		}
	};


	// Base
	var _activation = function (evt){
		var
			  node = evt.target
			, names
			, _class
			, i
		;

		while( document !== node ){
			if( node == null ) break;
			names = node.className.match(_rname);

			if( names !== null ) for( i = names.length; i--; ){
				_class = _classes[names[i]];
				if( (_class !== undef) && !_class.active ){
					_queue--;
					_class.init(node, evt);
				}
			}

			node = node.parentNode;
		}

		if( !_queue ){
			$(document).off('click mouseover mousedown focusin change', _activation);
		}
	};


	/**
	 * Создаем поведение
	 *
	 * @param {Array} name
	 * @param {Object} [methods]
	 * @param {Object} [statics
	 */
	$.bem = function (name, methods, statics){
		if( name.nodeType == 1 ){
			return	_findInst(name);
		}
		else if( name === 'yes' ){
			_yes = 'yes';
			$.each(_eventMod, function (i, val){
				val[1] = val[1] ? 'yes' : 0;
			});
		}
		else {
			if( typeof name == 'string' ){
				if( _classes[name] ){
					_classes[name].methods(methods, statics);
					return;
				}
				name = [0, name];
			}

			var
				  elm = name[0]
				, Elm = _classes[elm] || Element
				, force = statics && statics.force
			;

			if( !force && !_queue && elm ){
				$(document).on('click mouseover mousedown focusin change', _activation);
			}

			if( !force && elm ) _queue++;

			name = name[1];

			_classes[name] = Elm = Elm.extend(name, methods, statics);
			if( force ){
				Elm.init();
			}
		}
	};


	/**
	 * Собрать мусор
	 *
	 * @public
	 * @param {Function} fn
	 */
	$.bemGarbageCollect = function (fn){
		var id, Inst;
		fn = fn || F;
		for( id in _collector ){
			Inst = _collector[id];
			if( !Inst.inDOM() && fn(Inst, id) !== false ){
				Inst.destroy();
			}
		}
	};


	/**
	 * Изменить модификатор
	 *
	 * @param {String} mod
	 * @param {Boolean} state
	 * @returns {jQuery}
	 */
	$.fn.bem = function (mod, state){
		var ret, args = arguments;

		if( mod === undef ){
			return	_findInst(this[0]);
		}
		else if( mod == 'add' ){
			this.addClass(state).each(function (){
				_classes[state].init(this);
			});
		}
		else if( mod === 'clear' ){
			this.find('['+_idAttr+']').andSelf().each(function (Inst, node){
				if( (Inst = _collector[node.getAttribute(_idAttr)]) !== undef ){
					Inst.destroy();
				}
			});
		}
		else {
			this.each(function (Inst){
				if( Inst = _findInst(this) ){
					if( Inst[mod] === undef ){
						ret	= Inst.ready().mod(mod, state);
					} else {
						ret	= Inst[mod].apply(Inst, _slice.call(args, 1));
					}

					if( ret === Inst ){
						ret	= undef;
					}
				}
				else if( mod == 'destory' ){
					$(this).find('['+_idAttr+']').bem('destory', state);
				}
			});
		}

		return	ret === undef ? this : ret;
	};


	$.fn.hasMod = function (mod, state){
		return	this.bem().hasMod(mod, state);
	};


	$.fn.findBEM = function (name){
		return	this.find((name && name != '*' ? '.'+name : '') +'['+_idAttr+']');
	};


	// ????
	$(document).on('DOMNodeRemoved', function (node){
		node = node.originalEvent.target;
		if( node.nodeType == 1 ){
			clearTimeout(_garbageCollectId);
			_garbageCollectId = setTimeout($.bemGarbageCollect, 10000);
		}
	});

	window.BEM = _classes;
})(window, document, jQuery);
