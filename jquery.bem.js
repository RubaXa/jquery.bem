/*!
 * jQuery BEM
 * https://github.com/RubaXa/jquery.bem#readme
 *
 * @author	RubaXa	<trash@rubaxa.org>
 */

(function (window, document, $, undef){
	'use strict';

	var
		  F = function (){} // Функция пустышка
		, $dummy = $({})
		, _slice = [].slice
		, addEvent = 'addEventListener'

		, _idAttr = 'bemId' // название атрибута в котором храниться id экземпляра класса
		, _queue = 0 // Сколько ждут активации
		, _classes = window.clasess = {} // "ООП" классы, которые описывают поведение для селектора
		, _collector = {} // тут будем хранить связанные с эементами экземпляры класса

		, _rname = /\b([a-z\d-]+(?:__[a-z\d-]+)*)\b/ig // Получить именно название селектора из this.className, но не его модификаторы
		, _rspace = /\s+/g // Повторяющиеся пробелы
		, _relemSelector = /\b__/g // быстрый селектор по элементам в БЕМ терминалогии

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

		_eachBySpace = function (list, fn, ctx, i){
			list = $.trim(list).split(_rspace);
			i = list.length;
			while( i-- ){
				fn.call(ctx, list[i], i);
			}
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

		/**
		 * @param	{Object}	target
		 * @param	{Object}	methods
		 * @param	{Object}	[parents]
		 */
		_inherit = function (target, methods, parents){
			for( var key in methods ){
				target[key] = parents ? _makeParent(methods[key], parents[key]) : methods[key];
			}
		},


		_bound = function (ctx, fn, args){
			if( typeof fn == 'string' ) fn = ctx[fn];
			if( args === undef ) args = [];
			return	fn === undef ? fn : fn.bind ? fn.bind.apply(fn, [ctx].concat(args)) : function (){ return fn.apply(ctx, args.concat(_slice.call(arguments))); };
		},


		_findInst = function(node, BEM, name){
			var
				  Inst = _collector[node.getAttribute(_idAttr)]
				, className = ' '+node.className+' '
			;

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

				if( Inst === undef && (name in _classes || BEM) ){
					Inst = (_classes[name] || BEM).init(node, undef, name);
				}
			}

			return	Inst;
		},

		returnFalse = function (){ return false;},

		_nodeInserted = [],
		_nodeInsertedId,
		_nodeRemovedId
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
	$.expr[':'].isVisible = function (node){
		return	node.offsetHeight > 5;
	};


	$.is = function (elm, sel){
		$dummy[0] = elm;
		return	$dummy.is(sel);
	};


	$.fn.hasOn = function (name, fn){
		var events = this.data('events'), ns = name.split('.'), i, has = false;

		name = ns.splice(0, 1)[0];
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
			, onElemMod = {}
			, proto = self.fn
			// Создаем новый класс
			, New = function (){
				this.__lego.apply(this, arguments);
			}
		;

		// Переносим все статические методы и свойства
		for( key in this ) if( self.hasOwnProperty(key) ){
			New[key] = self[key];
		}

		New.lazy =
		New.cache =
		New.forced =
		New.inactive = false;

		// Меняем прототип функции-пустышки, на текущий
		F.prototype = proto;

		// Наследуем
		New.fn =
		New.prototype = new F;

		// Устанавливаем ссылку на "себя", для доступа к статическим методам
		New.fn.self = New;

		// Сохраняем название селектора, для которого мы создали этот класс
		New._name = name;

		// Определяем статические методы, если таковые есть
		if( statics ){
			$.each(['events', 'live'], function (i, name){
				_inherit(New[name] = {}, self[name]);
				_inherit(New[name], statics[name] || {}, self[name]);
				delete statics[name];
			});

			_inherit(New, statics);
		}

		// Переносим обработчики от родителя
		_inherit(onMod, proto.onMod);
		_inherit(onElemMod, proto.onElemMod);

		// Переопределяем методы класса
		if( methods ){
			$.each({ 'onMod': onMod, 'onElemMod': onElemMod }, function (name, onMod) {
				_inherit(onMod, methods[name] || {}, proto[name]);

				$.each(onMod, function (key, fn){
					delete onMod[key];
					key = key.split(_rspace);

					for( var i = 0; i < key.length; i++ ){
						onMod[key[i]] = fn;
					}
				});

				delete methods[name];
			});

			_inherit(New.fn, methods, proto);
		}

		New.fn.onMod = onMod;
		New.fn.onElemMod = onElemMod;

		return	New;
	};


	// Определяем статические методы
	$.extend(Element, {
		/**
		 * Единый обработчик событий для всех эклемпляров
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
		 * Ленивая (отложенная) инициализация
		 */
		lazy: false,


		/**
		 * Инициализировать элементы в принудительном порядке
		 */
		forced: false,


		/**
		 * Статус элемента элемент, не добавляется в очеред на инициализацуию
		 */
		inactive: false,


		mods: '',


		/**
		 * Список live-событий и их обработчиков
		 */
		live: {},


		/**
		 * Список событий, которые нужно повесить при инициализации элемента
		 */
		events: {},


		/**
		 * Инициализация/создание инстанса
		 *
		 * @param	{HTMLElement} node
		 * @param	{Event}		[evt]
		 * @param	{String}	[name]
		 * @return	{Element}
		 */
		init: function (node, evt, name){
			var
				  self	= this
				, live	= []
				, i
				, j
			;


			if( !self.active ){
				self.active = !self.inactive;

				if( self.mods ) $.each(self.mods.split(_rspace), function (i, mod){
					live.push(_autoMods[mod] || '');
				});

				// Соберем массив событий, которые нужно делегировать
				i = {}; // сюда будем собирать функции-слушатели
				$.each(self.live, function (name, fn){
					name = $.trim(name).toLowerCase().split(_rspace);
					j = name.length;
					while( j-- ){
						i[name[j]] = fn;
						if( $.inArray(name[j], live) == -1 ){
							live.push(name[j]);
						}
					}
				});
				self.live = i;


				if( self.active ){
					$(self.getBody()).on(live.join(' '), '.'+self.getName(), _bound(self, '_onEvent'));
				}
				else if( node ){
					$(node).on(live.join(' '), _bound(self, '_onEvent'));
				}
			}


			if( node && !node.getAttribute(_idAttr) ){
				var Inst = new this(node, name), type;

				if( evt ){
					type = evt.type;
					Inst._onEvent(evt);

					if( type == 'mouseover' ){
						evt.type = 'mouseenter';
						Inst._onEvent(evt);
					}

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
		 * @param	{HTMLElement}	node
		 * @returns	{Element}
		 */
		find: function (node){
			return	_findInst(node, this);
		},


		getName: function (){
			return	this._name;
		},


		override: function (methods, statics){
			if( methods ){
				var fn = this.fn;
				if( methods.onMod ){
					_inherit(fn.onMod, methods.onMod, fn.onMod);
					delete methods.onMod;
				}
				_inherit(fn, methods, fn);
			}

			if( statics ){
				_inherit(this, statics, this);
			}
		}
	});


	// Element methods
	Element.fn = Element.prototype = {
		self: Element,

		onMod: { '*': F },
		onElemMod: { '*': F },

		role: null,
		boundAll: '',
		debounceAll: '',


		/**
		 * Кешировать все выборки
		 */
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

			this.name = name = (name || this.self.getName());
			this.cache = this.self.cache;

			this.$el	= $(node).removeAttr('onclick');
			this.el		= this.$el[0];
			this.uniqId	= ++$.guid;
			this._mods	= {};
			this._cache	= {};

			this.block = name;
			this.element = '';

			if (this.name.indexOf('__') > -1) {
				// Это элемент
				var tmp = name.split('__');
				this.block = tmp[0];
				this.element = tmp[1];
				this.$el.trigger('bem:element:init');
			}


			var attrs = this.self.attrs || {};

			attrs[_idAttr] = this.uniqId;
			_collector[this.uniqId] = this;

			if (this.role) {
				attrs.role = this.role;
			}

			this.$attr(attrs);
			this.on('bem:element:mod', '_onElemMod');

			if (this.self.lazy) {
				this.debounce('ready')();
			} else {
				this.ready();
			}
		},

		ready: function (){
			this.ready = function (){ return this; };

			// Extract all modifiers
			var
				  boundAll = this.boundAll
				, debounceAll = this.debounceAll
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


			// Bind all
			_eachBySpace(boundAll+' _onFocusOut', function (name){
				this[name] = this.bound(name);
			}, this);


			// Debounce all
			_eachBySpace(debounceAll, function (name){
				name = name.split(':');
				this[name[0]] = this.debounce(name[0], name[1]);
			}, this);


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
			}
			else {
				this._qevents.push(evt);
			}
		},


		/**
		 * Единый обработчик событий
		 *
		 * @private
		 * @param {Event} evt
		 */
		__onEvent: function (evt){
			var
				  type = evt.type
				, mod = _eventMod[type]
				, self = this.self
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
		 * @param	{String}	mod
		 * @param	{Boolean}	state
		 * @param	{Boolean}	[inner]
		 * @return	{Boolean}
		 */
		_emitMod: function (mod, state, inner){
			var
				  fn
				, onMod	= this.onMod
				, ret	= inner || onMod['*'].call(this, mod, state)
				, isStr = typeof state === 'string'
				, fnType
				, strState
			;

			if( ret !== false ){
				fn = onMod[mod];

				if( fn === false ){
					ret	= false;
				}
				else if( fn ){
					fnType = typeof fn;

					if( fnType === 'string' ){
						ret	= this[fn](state, mod);
					}
					else if( fnType === 'object' ){
						if( fn['*'] !== undef )
							ret = fn['*'].call(this, state, mod);

						if( ret !== false && fn[strState = (isStr ? state : (state ? 'yes' : ''))] !== undef )
							ret = fn[strState].call(this, state, mod);
					} else {
						ret	= fn.call(this, state, mod);
					}
				}

				if( ret !== false && inner !== true && this._emitMod(mod +'_'+ (isStr ? state : (state ? 'yes' : 'no')), state, true) === false ){
					ret = false;
				}
			}

			if (ret !== false && inner !== true && this.element) {
				var evt = $.Event('bem:element:mod');

				this.$el.trigger(evt, {
					$el: this.$el,
					block: this.block,
					element: this.element,
					name: mod,
					state: state
				});

				if (evt.isDefaultPrevented()) {
					ret = false;
				}
			}

			return	ret;
		},


		_emitElemMod: function ($elem, elemName, mod, state) {
			var fn,
				onElemMod = this.onElemMod,
				ret = onElemMod['*'].call(this, $elem, elemName, mod, state);

			if (ret !== false) {
				// Получаем элемент
				fn = onElemMod[elemName];

				if (fn === false) {
					ret = false;
				}
				else if (fn) {
					if (fn['*'] !== void 0) {
						// Установка любого модификатора
						ret = fn['*'].call(this, $elem, mod, state, elemName);
					}

					if (ret !== false && (fn = fn[mod])) {
						if (fn.call(this, $elem, state, mod, elemName) === false) {
							ret = false;
						}
					}
					else if (fn === false) {
						ret = false;
					}
				}
			}

			return ret;
		},


		/**
		 * Слушаем события на изменения модификатора у элементов
		 * @param  {Event} evt
		 * @param  {Object}  mod
		 * @private
		 */
		_onElemMod: function (evt, mod) {
			if (mod.block === this.block && !this.element) {
				evt.stopPropagation();

				if (this._emitElemMod(mod.$el, mod.element, mod.name, mod.state) === false) {
					evt.preventDefault();
				}
			}
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
		 * @param	{Object|String}	fn
		 * @return	{Function}
		 */
		bound: function (fn){
			return	_bound(this, fn, _slice.call(arguments, 1));
		},


		/**
		 * Название css-класс по имени модификатора
		 *
		 * @private
		 * @param	{String}	mod
		 * @param	{String}	state
		 * @return	{String}
		 */
		_modClassName: function (mod, state){
			return	this.name +'_'+ mod + (state && typeof state === 'string' ? '_'+state: '');
		},


		/**
		 * Проверить/Добавить/Удалить модификатор
		 *
		 * @public
		 * @param	{String}	name
		 * @param	{Boolean}	[state]
		 * @return	{*}
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

				if( currentMod === undef ){
					currentMod = false;
				}

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
					}
					else {
						// revert mod -- WTF????
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


		/**
		 * Селектор
		 *
		 * @param	{String}	sel
		 * @param	{Boolean}	[className]
		 * @return	{String}
		 */
		s: function (sel, className){
			if( typeof sel == 'string' && /__/.test(sel) ){
				sel = sel.replace(_relemSelector, (className ? '' : '.') + this.name + '__');
			}

			return	sel;
		},


		c: function (sel){
			return	this.s(sel, 1);
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
		 * @param	{String}	sel
		 * @param	{Boolean}	[force]
		 * @return	{jQuery}
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

		clearCache: function (){
			this._cache = {};
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
				$el[$.camelCase('remove-'+method)](name);
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


		debounce: function (fn, delay){
			var ctx = this, id, args;

			if( typeof fn === 'string' ){
				fn	= ctx[fn];
			}

			return function (){
				args = arguments;
				clearTimeout(id);
				id = setTimeout(function (){
					fn.apply(ctx, args);
				}, ~~delay);
			};
		},

		throttle: function(fn, delay) {
			var id, args, needInvoke, ctx = this;

			if( typeof fn === 'string' ){
				fn	= ctx[fn];
			}

			return function _throttle(){
				args = arguments;
				needInvoke = true;

				if( !id ) (function (){
					if( needInvoke ){
						fn.apply(ctx, args);
						needInvoke = false;
						id = setTimeout(_throttle, delay);
					}
					else {
						id = null;
					}
				})();
			};
		},

		onOutside: function (name, fn){
			this.self.$doc.on(this.eventNS(name), _bound(this, fn || returnFalse));
			return	this;
		},


		offOutside: function (name){
			this.self.$doc.off(this.eventNS(name));
			return	this;
		},


		one: function (name, sel, fn){
			if( fn === undef ){
				fn = sel;
				sel = undef;
			}

			this.$el.one(this.eventNS(name), this.s(sel), _bound(this, fn));
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
			return	this.self.$doc.hasOn(this.eventNS(name), fn);
		},


		on: function (name, sel, fn){
			if( fn === undef ){
				fn	= sel;
				sel	= undef;
			}

			this.$el.on(this.eventNS(name), this.s(sel), _bound(this, fn || returnFalse));
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


		toBEM: function (selector, name){
			var $elem = this.$(selector);
			if( !$elem.bem() ){
				$elem.bem('add', name);
			}
			return	$elem.bem();
		},


		destroy: function (absolute){
			this.destroy = F;
			delete _collector[this.getId()];

			var self = this.self;

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
				if( (_class !== undef) && !_class.active && !_class.inactive ){
					_queue--;
					_class.init(node, evt);
				}
			}

			node = node.parentNode;
		}

		if( !_queue ){
			$(document).off('click leftclick mouseover mousedown focusin change', _activation);
		}
	};


	/**
	 * Создаем поведение
	 *
	 * @param	{Array}		name
	 * @param	{String}	[extend]
	 * @param	{Object}	[methods]
	 * @param	{Object}	[statics
	 */
	$.bem = function (name, extend, methods, statics){
		if( name.nodeType == 1 ){
			return	_findInst(name);
		}
		else {
			if( typeof name == 'string' ){
				if( _classes[name] ){
					_classes[name].override(methods, statics);
					return;
				}
			}

			if( typeof extend != 'string' || !extend ){
				statics	= methods;
				methods	= extend;
				extend	= undef;
			}

			var
				  Elm = _classes[extend] || Element
				, normal = !Elm.inactive
			;

			_classes[name] = Elm = Elm.extend(name, methods, statics);

			if( !_queue && normal ){
				$(document).on('click leftclick mouseover mousedown focusin change', _activation);
			}

			if( normal ){
				_queue++;
			}
		}
	};


	/**
	 * Инициализировать "принудительные" элементы
	 *
	 * @param	{jQuery}	$root
	 */
	$.bem.init = function ($root){
		$.each(_classes, function (name, Elm/**Element*/){
			if( Elm.forced ){
				var
					  sel = '.'+name
					, $items = $root.find(sel).add($root.filter(sel))
					, i = $items.length
				;

				while( i-- ){
					Elm.init($items[i]);
				}
			}
		});
	};


	/**
	 * Переименовать элемент
	 *
	 * @param	{String}	name
	 * @param	{String}	newName
	 */
	$.bem.rename = function (name, newName){
		var Elm = _classes[newName] = _classes[name];
		Elm._name = newName;
		delete _classes[name];
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
			// Get BEM instance
			return	_findInst(this[0]);
		}
		else if( mod == 'init' ){
			// Init "forced" elements
			$.bem.init(this);
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
					Inst.ready();

					if( Inst[mod] === undef ){
						ret	= Inst.mod(mod, state);
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


	if( document[addEvent] ){
		var _autoInit = function (){
			$(_nodeInserted).bem('init');
			_nodeInserted = [];
		};

		document[addEvent]('DOMNodeInserted', function (evt){
			var node = evt.target;
			if( node.nodeType == 1 ){
				_nodeInserted.push(node);
				clearTimeout(_nodeInsertedId);
				_nodeInsertedId = setTimeout(_autoInit, 200);
			}
		}, false);

		document[addEvent]('DOMNodeRemoved', function (evt){
			var node = evt.target;
			if( node.nodeType == 1 ){
				clearTimeout(_nodeRemovedId);
				_nodeRemovedId = setTimeout($.bemGarbageCollect, 10000);
			}
		}, false);
	}


	// DOMReady
	$(function (){
		$.bem.init($(document));
	});

	$(document).on('bem:element:init', _activation);

	window.BEM = _classes;
})(window, document, jQuery);
