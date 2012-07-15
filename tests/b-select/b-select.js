(function ($, undef){
	module('b-select');

	test('expanded', function (){
		$('#select').simulate('focus');
		ok($('#select').bem(), 'init by focus');

		$('#select').bem('expanded', true);

		equal(
			  $('#select select').find('*').length
			, $('#select .b-select__options').find('.b-select__options__optgroup,.b-select__options__option').size()
			, 'count elements'
		);


		ok($('#select .b-select__options__optgroup:first .icon').hasClass('icon_first-group'), 'has icon in first optgroup');
		ok($('#select .b-select__options__option:eq(3) .icon').hasClass('icon_ico-three'), 'has icon in option');

		$('#select').bem('expanded', false);

		sleep(function (){
			$('body')
				.simulate('key', { keyCode: 40 })
				.simulate('key', { keyCode: 40 })
				.simulate('key', { keyCode: 13 })
			;


			equal($('#select .b-select__ctrl').text().trim(), 'second', 'BEM: current value');
			equal($('#select select :selected').text(), 'second', 'SELECT: current value');

			$('#select .b-select__ctrl').simulate('click');

			sleep(function (){
				$('#select')
					.simulate('key', { keyCode: 40 })
					.simulate('key', { keyCode: 13 })
				;

				equal($('#select .b-select__ctrl').text().trim(), '3', 'BEM: current value');
				equal($('#select select :selected').text(), '3', 'SELECT: current value');
			}, 50);
		}, 50);
	});


	test('search', function (){
		$('#select')
			.simulate('focus')
			.simulate('keypress', { which: 's'.charCodeAt(0) })
		;

		sleep(function (){
			equal($('#select select :selected').text(), 'second', '"second" selected');
			$('#select').simulate('keypress', { which: 'e'.charCodeAt(0) });
			$('#select').simulate('keypress', { which: 'v'.charCodeAt(0) });

			sleep(function (){
				equal($('#select .b-select__ctrl').text().trim(), 'seven', '"seven" selected');

				$('#select')
					.bem('expanded', true)
					.simulate('keypress', { which: 'f'.charCodeAt(0) })
				;

				sleep(function (){
					equal($('#select .b-select__options__option_hover').text().trim(), 'first in group', '"first in group" selected');
					$('#select').simulate('keypress', { which: 'o'.charCodeAt(0) });

					sleep(function (){
						equal($('#select .b-select__options__option_hover').text().trim(), 'four', '"four" selected');

						$('#select').simulate('blur');
						equal($('#select .b-select__ctrl').text().trim(), 'seven', '"seven" current selected');
					}, 300);
				}, 300);
			}, 300);
		}, 300);
	});
})(jQuery);
