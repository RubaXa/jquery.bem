(function ($){
	module('b-dropdown');

	test('expanded', function (){
		$('#dropdown').simulate('focus');

		ok($('#dropdown .b-dropdown__link').hasClass('b-dropdown__link_focus'), 'focus');

		$('#dropdown .b-dropdown__link').simulate('click');
		$('#dropdown .js-text').simulate('click');

		ok($('#dropdown').hasClass('b-dropdown_expanded'), 'expanded');
		ok($('#dropdown .b-dropdown__link').hasClass('b-dropdown__link_expanded'), 'expanded');

		equal($('#dropdown .b-dropdown__list__item_hover').length, 0, 'not hover');

		$('#dropdown').simulate('keydown', { keyCode: 38 });
		equal($('#dropdown .b-dropdown__list__item_hover').html(), 2, 'keyUp');
		$('#dropdown').simulate('blur');
	});


	test('select item', function (){
		ok(!$('#dropdown2').hasClass('b-dropdown_expanded'), 'blur fail');
		ok(!$('#dropdown2 .b-dropdown__link').hasClass('b-dropdown__link_expanded'), 'blur fail: link is expanded');
		ok(!$('#dropdown2 .b-dropdown__link').hasClass('b-dropdown__link_focus'), 'blur fail: link is focused');

		$('#dropdown2 .b-dropdown__link').simulate('focus');
		$('#dropdown2').simulate('keydown', { keyCode: 32 }); // expand
		$('#dropdown2').simulate('keyup', { keyCode: 32 });
		ok($('#dropdown2').hasClass('b-dropdown_expanded'), 'expand by hot key and select by keydown');

		$('#dropdown2 .b-dropdown__list__item:eq(2)').simulate('click');
		ok($('#dropdown2').hasClass('b-dropdown_expanded'), 'click by disabled item');

		$('#dropdown2 .b-dropdown__list__item:eq(1)').simulate('click');
		ok(!$('#dropdown2').hasClass('b-dropdown_expanded'), 'click by item');
		$('#dropdown').simulate('blur');
	});


	test('expanded + esc', function (){
		$('#dropdown').bem('expanded', true);
		utils.check('#dropdown', 'expanded');
		$('#dropdown').simulate('keyup', { keyCode: 27 });
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

		$('#dropdown-input .b-dropdown__link').simulate('focus').simulate('click');
		ok($('#dropdown-input').hasMod('expanded'), 'click on input: expanded');
		equal($('#dropdown-input .js-input-1')[0], document.activeElement, 'activeElement === input');

		$('#dropdown-input .js-input-2').simulate('focus');
		equal($('#dropdown-input .js-input-2')[0], document.activeElement, 'activeElement === input');

		$('#dropdown-input .js-input-2').simulate('blur');
		$('#dropdown-input .js-text').simulate('click');

		utils.check('#dropdown-input', 'expanded');
	});
})(jQuery);
