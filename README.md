# jQuery BEM

Это инструмент, предназначенный для описания поведения DOM элемента в BEM терминологии.


## Зачем это нужно?

Каждый из нас, хоть раз, сталкиваться с задачей, в рамках которой
нужно стилизовать элемент формы или сделать какой-то свой контрол. И тут
приходится сделать выбор, отправиться в гугл или написать самому. Знакомая
история, не правда ли?

Мне попадались разные библиотеки, но у них было одно общее - их нужно
иницализировать. Есть конечно такие, которые делают инициализацию по DOMReady. Но
что делать с теми элементами, которые мы создали позже, например,
получив контен через ajax?

Кроме того, инициализация по DOMReady замедляет загрузку страницы. В тоже время,
велика вероятность, что пользователь не использует стилизованный элемент,
а он может быть не один. Тогда зачем нужно тратить рессурсы на их инициализацию?

Все эти проблемы меня очень печалили, а ведь хотелось простого -  чтобы
все работало само и по необходимости, как бы смешно это не звучало :]

Идея сформировалась давно и не нова. Суть её проста - в верстке мы используем
CSS для определения стиля элемента, описываем селектор и дальше применяем его
к нужным элементам. Еще есть BEM c блок, элемент и модификатор, осталось
только описать поведение для этого нужного блока, и дело в шляпе


Для себя я сформировал следующие требования:
 * Все необходимые элементы находятся в верстке изначально. Ничего не генирируется скриптом во время исполнения страницы.
 * Инициализация происходит по необходимости, т.е. перед непосредственным  использованием
 * Поведение максимально приближено к нативному
 * Код прозрачен как для верстальшика, так и разработчика
 * Расширямость (возможность написания своих компонентов)


В итоге, я получил иструмент, который позволил мне описывать поведение
элемента для нужного селектора. Если применить класс `b-button`к некоторому элементу,
то этот элемент будет вести себя, как кнопка, со всеми состояниями
и событиями присущими кнопке. И самое замечательное, что не нужно беспокоиться о его инициализиции.



## Пример 1
Рассмотрим простой пример, вам нужно, чтобы при наведении на элемент, к нему добавлялся
модификатор `_hover`, а при фокусе (например при помощи tab) `_focus`:
```html
<a href="#" class="link" tabindex="1">link</a>
или
<span class="link" tabindex="2">...</span>
```
```js
$.bem('link', null, {
	// static methods and properties
	mods: 'focus hover'
});
```


И все, больше никаких телодвижений, теперь если вы наведетесь на элемент с классом "link",
то получите:
```html
<a href="#" class="link link_hover" tabindex="1">link</a>
```


## Пример 2
Пример посложней, нам нужно сделать счетчик подсчета введенных символов:
```html
<div class="b-input">
	<input value="" type="text" class="b-input__input" />
	<span class="b-input__length"></span>
</div>
```
```js
$.bem('b-input', {
	_onKeyUpCalc: function (){
		// Работа с элементами, внутри блока
		this.$('__length').text( this.$('__input').val().length );

		// можно и так
		// this.$('.b-input__length').text( this.$(':input').val().length );
	}
}, {
	cache: true, // кешировать выборки
	live: {
		'focusin focusout': function (evt){
			// обработчик события "keyup" назначаем в зависимости от фокуса
			this[evt.type == 'focusin' ? 'on' : 'off']('keyup.calc', '_onKeyUpCalc');
		}
	}
});
```


## b-button
Вот и настало время написать полноценный элемент-контрол-кнопка
```html
<a href="..." class="b-button" tabindex="1">
	<span class="b-button__label">button</span>
	<input type="submit" class="b-button__input" />
</a>
```
```js
$.bem('b-button', {
	role: 'button',

	onMod: {
		disabled: function (state){
			var attrs = { disabled: state };

			// Сохраним url ссылки
			this._href = state || !this._href ? this.$attr('href') : this._href;

			this
				.$aria(attrs)
				.$attr(attrs)
				.$attr('href', state ? null : this._href) // установить или удалить href, в зависимости от состояния
			;

			if( state ){
				// кнопка disabled, так что удалим все модификаторы
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
				// вешаем событие за пределами элемента
				this.onOutside('keydown.focus', 'onFocusKeyDown');
			} else {
				this.offOutside('keyup.focus keydown.focus');
			}
		},

		'*': function (mod, state){
			if( state && this.isDisabled() ){
				return	!~'press hover focus'.indexOf(mod);
			}
		}
	},


	onClick: function (evt){
		if( !this.isDisabled ){
			this.$('__input').click();
		}
	},


	onFocusKeyDown: function (evt){
		if( !this.hasOn('keyup.focus') ){
			this.on('keyup.focus', function (evt){
				if( this.hasMod('press') ){
					this.onClick(evt);
				}
				this.delMod('press').off('keyup.focus');
			});
		}

		var key = evt.keyCode;
		if( key == 13 || key == 32 ){
			this.addMod('press');
			evt.preventDefault();
		}
	}
}, {
	mods: 'hover press focus',
	live: {
		leftclick: 'onClick'
	}
});
```


### Наследование:
```js
$.bem(['b-button', 'b-submit'], {
	onMod: {
		'*': function (mod, state){
			var ret = this.parent(mod, state);
			// you logic ...
		}
	},

	onFocusKeyDown: function (evt){
		// you logic ...
		this.parent(evt); // call parent method
	}
});
```


------------------------------------------



## Готовые элементы

### b-control
 * b-control_hover
 * b-control_focus
 * b-control_press
 * b-control_disabled


### b-button  <-  b-control
```html
<a href="#" class="b-button">Кнопка</a>
```


### b-checkbox  <-  b-control
 * Space OR Enter — for toggle "checked"
 * b-checkbox_checked
 * b-checkbox_checked_mixed

```html
<span class="b-checkbox">
	<span class="b-checkbox__checkmark">
		<input name="cbx" type="checkbox"/>
	</span>
</span>
```


### b-radio  <-  b-checkbox
```html
<span class="b-radio">
	<span class="b-radio__bubble">
		<input name="radio" type="radio"/>
	</span>
</span>
```


### b-list
 * UP/DOWN arrows — move "b-list\_\_item\_hover" between "b-list\_\_item"
 * b-list_focus
 * b-list_active
 * b-list__item_hover

```html
<ul class="b-list">
	<li class="b-list__item">item 1</li>
	<li class="b-list__item">item 2</li>
</ul>
```


### b-dropdown  <-  b-control
 * ESC — remove "expanded"
 * Space OR Enter — toggle "expanded"
 * UP/DOWN arrows — move "b-dropdown\_\_list\_\_item" between "b-dropdown\_\_list\_\_item\_hover", if before include b-list
 * b-dropdown_expanded
 * b-dropdown__ctrl_focus
 * b-dropdown__ctrl_hover
 * b-dropdown__ctrl_expanded
 * b-dropdown__list_expanded
 * b-dropdown\_\_list\_\_item\_hover — if before define b-list

```html
<div class="b-dropdown">
	<div class="b-dropdown__ctrl">text</div>
	<div class="b-dropdown__list">
		<div class="b-dropdown__list__item">item 1</div>
		<div class="b-dropdown__list__item">item 2</div>
	</div>
</div>
```


### b-filter
 * b-filter\_\_list\_\_item\_filtered — hidden element

```html
<div class="b-filter">
	<input type="text" class="b-filter__input" />
	<div class="js-filter-item">item 1</div>
	<div class="js-filter-item">item 2</div>
</div>
```



------------------------------------------



## API

### Создание описания
$.bem(className`:String`, methods`:Object`, statics`:Object`);
 * className — название css-класса, для которого описываем поведение
 * methods — методы экземпляра класса
 * statics — статические методы класса


### Наследование
$.bem(className`:String`, extend`:String`, methods`:Object`, statics`:Object`);
 * extend — название того, кого наследуем


### Статические методы и свойства
 * .$win`:jQuery` — ссылка на $(window)
 * .$doc`:jQuery` — ссылка на $(document)
 * .lazy`:Boolean = false` — ленивая инициализация
 * .cache`:Boolean = false` — кешировать все выборки
 * .forced`:Boolean = false` — принудительно инициализировать все элементы
 * .live`:Object` — делигируемые события
 * .mods`:Set(hover,focus,press)` — авто-модификаторы (перечисление через пробел)
 * .attrs`:Object` — аттрибуты, которые необходимо выставить DOM-элементу


### Свойства класса
 * .self`:BEM` — ссылка на класс, для доступа к статическим методам и свойствам
 * .boundAll`:String` — название методов, через пробел которые нужно привязать к контексту инстанса
 * .debouceAll`:String` — формат записи "methodName:mSec"
 * .cache`:Boolean` — кешировать выборки
 * .forced`:Boolean` — инициализировать объект сразу, после его появления
 * .uniqId`:Number` — уникальный модификатор в рамках BEM-элементов
 * .role`:String` — role-атрибут
 * .$el`:jQuery` — ссылка на jQuery-элемент
 * .el`:HTMLElement` — ссылка на DOM-элемент
 * onMod`:Object` — список слушателей, на установку того или иного модификатора


### Методы класса
 * .init() — вызывается при инициализация объекта (@protected)
 * .getId()`:Number` — получить уникальный идентификатор
 * .bound(fn`:Function|String`[, arg1[, argsN]])`:Function` — связать функцию с контекстом класса
 * .debounce(fn`:Function|String`[, delay`:Number`])`:Function` — вызов функции будет произведен только один раз, через N ms
 * .throttle(fn`:Function|String`[, delay`:Number`])`:Function` — вызов функции будет произведен только один раз в N ms
 * .hasMod(mod`:String`[, state`:Mixed`])`:Boolean` — проверить наличие модификатора
 * .addMod(mods`:String`[, state`:Mixed`])`:this` — добавить список модификатор, разделитель пробел
 * .delMod(mods`:String`[, state`:Mixed`])`:this` — убрать модификаторы
 * .toggleMod(mod`:String`[, state`:Mixed`]))`:this` — addMod/delMod
 * .$()`:this.$el` — вернет ссылку на элемент
 * .$(selector`:String`)`:jQuery` — найти все элементы соответствующие css-селектору в this.$el
 * .$(__name`:String`)`:jQuery` — найти элементы в соответствии c BEM именованием
 * .$attr(name`:String`)`:Mixed` — получить значение атрибута
 * .$attr(name`:String`, value`:Mixed`)`:this` — изменить атрибут
 * .$attr(attrs`:Object`)`:this` - изменить атрибуты
 * .$attr(name`:String`, null)`:this` — установка атрибута в null равносильно его удалению
 * .$attr(selector`:String`, attrs`:Object`)`:this` — изменить атрибуты для элементов, соответствующих css-селектору
 * .$aria() - тоже самый $attr, только ко всем атрибутам добавляем префикс "aria-"
 * .$css(), $prop() — аналогично $attr
 * .on(name`:String`, fn`:String|Function`)`:this` — подписаться на событие, this.$el.bind(name, fn)
 * .on(name`:String`, selector`:String`, fn`:String|Function`)`:this` - слушать событие с конкретных элементов, this.$el.delegate(selecotr, name, fn)
 * .off(name`:String`)`:this` — убрать всех слушателей, this.$el.unbind(name)
 * .off(name`:String`, selector`:String`)`:this` — снять слушателя, с конкретных элементов, this.$el.undelegate(selecotr, name)
 * .hasOn(name`:String`)`:Boolean` — проверить наличие подписки на конкретное событие
 * .onOutside(name`:String`, fn`:String|Function`)`:this` — подписаться на событие, за пределами элемента
 * .offOutside(name`:String`)`:this` — убрать слушателя
 * .trigger(name`:String`[, args`:Array`])`:this` — испустить событие
 * .isDisabled()`:Boolean` — проверить элемент на наличие модификатора disabled
 * .destroy() — уничтожить экземпляр класса
 * .destroy(true) — уничтожить + удалить связанные элемент


## Пример работы с onMod
```js
onMod: {
	size: {
		S: function (){ /* set: _size_S */ },
		M: function (){ /* set: _size_M */ },
		L: function (){ /* set: _size_S */ },
		'': function (){ /* remove mod */ }
	},

	size_XL: function (){}

	focus: function (state/**Mixed*/){
		// (2) after "*"
	},

	focus_yes: function (){
		// (3) call after "focus"
	},

	'*': function (mod/**String*/, state/**Mixed*/){
		// (1) Call before set modifier
		// return false, to break
	}
}
```
