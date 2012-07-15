(function ($){
	module('b-dropdown');

	test('expanded', function (){
		$('#dropdown').simulate('focus');

		ok($('#dropdown .b-dropdown__ctrl').hasClass('b-dropdown__ctrl_focus'), 'focus');

		$('#dropdown .b-dropdown__ctrl').simulate('click');
		$('#dropdown .js-text').simulate('click');

		ok($('#dropdown').hasClass('b-dropdown_expanded'), 'expanded');
		ok($('#dropdown .b-dropdown__ctrl').hasClass('b-dropdown__ctrl_expanded'), 'expanded');

		sleep(function (){
			equal($('#dropdown .b-dropdown__list__item_hover').length, 0, 'not hover');

			$('#dropdown').simulate('key', { keyCode: 38 });
			equal($('#dropdown .b-dropdown__list__item_hover').html(), 2, 'key up');
			$('#dropdown').simulate('blur');
		}, 30);
	});


	test('select item', function (){
		ok(!$('#dropdown2').hasClass('b-dropdown_expanded'), 'blur fail');
		ok(!$('#dropdown2 .b-dropdown__ctrl').hasClass('b-dropdown__ctrl_expanded'), 'blur fail: link is expanded');
		ok(!$('#dropdown2 .b-dropdown__ctrl').hasClass('b-dropdown__ctrl_focus'), 'blur fail: link is focused');

		$('#dropdown2 .b-dropdown__ctrl').simulate('focus');
		$('#dropdown2').simulate('key', { keyCode: 32 }); // expand
		ok($('#dropdown2').hasClass('b-dropdown_expanded'), 'expand by hot key and select by keydown');

		$('#dropdown2 .b-dropdown__list__item:eq(2)').simulate('click');
		ok($('#dropdown2').hasClass('b-dropdown_expanded'), 'click by disabled item');

		$('#dropdown2 .b-dropdown__list__item:eq(1)').simulate('click');
		ok(!$('#dropdown2').hasClass('b-dropdown_expanded'), 'click by item');

		$('#dropdown2').simulate('blur');
	});


	test('expanded + esc', function (){
		$('#dropdown').bem('expanded', true);
		utils.check('#dropdown', 'expanded');

		$('#dropdown').simulate('key', { keyCode: 27 });
		utils.check('#dropdown', '!expanded');
	});


	test('expanded + input', function (){
		$('#dropdown-input').bem('expanded', true);
		utils.check('#dropdown-input', 'expanded');

		$('#dropdown-input .js-input').simulate('focus').simulate('click');
		ok($('#dropdown-input').hasMod('expanded'), 'click on input: expanded');

		// collapse
		$('#dropdown-input').bem('expanded', false);
		$('#dropdown-input .js-input').simulate('blur');

		$('#dropdown-input').on('expand', function (){
			$(':input:first', this).focus();
		});

		$('#dropdown-input .b-dropdown__ctrl').simulate('focus').simulate('click');
		ok($('#dropdown-input').hasMod('expanded'), 'click on input: expanded');
		equal($('#dropdown-input .js-input-1')[0], document.activeElement, 'activeElement === input');

		$('#dropdown-input .js-input-2').simulate('focus');
		equal($('#dropdown-input .js-input-2')[0], document.activeElement, 'activeElement === input');

		$('#dropdown-input .js-input-2').simulate('blur');
		$('#dropdown-input .js-text').simulate('click');

		utils.check('#dropdown-input', 'expanded');
	});


	test('select item by enter', function (){
		ok(!$('#dropdown3').hasClass('b-dropdown_expanded'), 'dropdown3 is expanded');

		$('#dropdown3').simulate('focus');
		$('#dropdown3 .b-dropdown__ctrl').simulate('click');

		sleep(function (){
			ok($('#dropdown3').hasClass('b-dropdown_expanded'), 'dropdown3 is not expanded');

			$('#dropdown3').simulate('key', { keyCode: 40 }); // move down
			$('#dropdown3').simulate('key', { keyCode: 40 }); // move down
			ok($('#dropdown3 .b-dropdown__list__item:eq(1)').hasClass('b-dropdown__list__item_hover'), 'dropdown3 second item hover, fail');

			$('#dropdown3').simulate('key', { keyCode: 13 });

			sleep(function (){
				ok(!$('#dropdown3').hasClass('b-dropdown_expanded'), 'select item by enter');
				$('#dropdown3').simulate('blur');
			}, 300);
		}, 30)
	});
})(jQuery);
