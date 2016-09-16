(function ($, undef){
	module('b-button');

	test('focus', function (){
		utils.check('#btn0', 'focus', 'focus');

		// hover + press
		utils.check('#btn0', 'mouseover', 'hover');
		utils.check('#btn0', 'mousedown', 'press');
		utils.check('#btn0', 'mouseout', '!hover');
		utils.check('#btn0', '!press');

		// press
		utils.check('#btn0', 'mousedown', 'press');
		utils.check('#btn0', 'mouseup', '!press');

		// keydown & hot keys
		utils.check('#btn0', { type: 'keydown', keyCode: 48 }, '!press'); // random key
		utils.check('#btn0', { type: 'keydown', keyCode: 13 }, 'press'); // enter down
		utils.check('#btn0', { type: 'keyup', keyCode: 13 }, '!press'); // enter up

		// hot keys + blur
		$('#btn0').simulate('blur');
		sleep(function (){
			utils.check('#btn0', '!focus');
			utils.check('#btn0', { type: 'keydown', keyCode: 32 }, '!press'); // space down
		}, 30);
	});


	test('tab', function (){
		$('#btn1').simulate('focus');

		utils.check('#btn1', 'focus', 'focus');

		$('#btn1').simulate('tab');

		sleep(function (){
			utils.check('#btn1', '!focus');
			utils.check('#btn2', 'focus');

			$('#btn2').simulate('tab');
			sleep(function (){
				utils.check('#btn2', '!focus');
				utils.check('#btn3', '!focus');
			}, 30);
		}, 30);
	});


	test('change mod', function (){
		$('#btn4').bem('test', 'mod');
		utils.check('#btn4', 'test_mod');

		$('#btn4').bem('test', 'X');
		ok($('#btn4').hasMod('test'), '#btn4 has mod "test"');
		utils.check('#btn4', '!test_mod');
		utils.check('#btn4', 'test_X');

		$('#btn4').bem().delMod('test', 'mod');
		utils.check('#btn4', 'test_X');

		$('#btn4').bem().delMod('test', 'X');
		utils.check('#btn4', '!test_X');

		$('#btn4').bem('test', 'X');
		utils.check('#btn4', 'test_X');

		$('#btn4').bem('test', false);
		utils.check('#btn4', '!test');

		$('#btn4').bem('unknown');
		utils.check('#btn4', '!unknown');
	});


	test('events', function (){
		var log = [];

		$('#btn1').on('press release', function (evt){
			log.push(evt.type);
		});

		$('#btn1').simulate('mousedown');
		$('#btn1').simulate('mouseup');

		equal(log.join(','), 'press,release', 'custom b-control events');
	});


	test('input.onclick', function (){
		var cnt = 0;

		$('input').on('click', function (){ cnt++; });

		$('#btn2').simulate('focus');
		$('#btn2').simulate('click');
		$('#btn2').simulate('keydown', { keyCode: 13 });
		$('#btn2').simulate('keyup', { keyCode: 13 });
		$('#btn2').simulate('keydown', { keyCode: 32 });
		$('#btn2').simulate('keyup', { keyCode: 32 });

		equal(cnt, 3, 'trigger click');
	});


	test('disabled', function (){
		// focus + hover & press
		$('#btn6').bem('hover press focus');

		// disabled = true;
		$('#btn6').bem('disabled', true);

		equal($('#btn6').attr('disabled'), 'disabled', '#btn6 — checked disabled attr');
		equal($('#btn6').attr('aria-disabled'), 'true', '#btn6 — checked aria-disabled');

		utils.check('#btn6', '!focus');
		utils.check('#btn6', '!press');
		utils.check('#btn6', '!hover');
		utils.check('#btn6', { type: 'keydown', keyCode: 13 }, '!press');

		// disabled = false
		$('#btn6').bem('disabled', false);
		equal($('#btn6').attr('disabled'), undef, '#btn6 — checked disabled attr');
		equal($('#btn6').attr('aria-disabled'), 'false', '#btn6 — checked aria-disabled');
		utils.check('#btn6', 'focus', 'focus');
		utils.check('#btn6', { type: 'keydown', keyCode: 13 }, 'press');
		utils.check('#btn6', { type: 'keyup', keyCode: 13 }, '!press');
	});


	test('loading', function (){
		// loading: true
		$('#btn1').bem('loading', true);
		utils.check('#btn1', '!loading');

		sleep(function (){
			utils.check('#btn1', 'loading');

			// loading: false
			$('#btn1').bem('loading', false);
			utils.check('#btn1', 'loading');

			sleep(function (){
				utils.check('#btn1', '!loading');

				// loading: true
				$('#btn1').bem('loading', true);
				utils.check('#btn1', '!loading');

				sleep(function (){
					// laoding: false
					utils.check('#btn1', '!loading');
					$('#btn1').bem('loading', false);

					sleep(function (){
						utils.check('#btn1', '!loading');
					}, 700);
				}, 300);
			}, 500);
		}, 1000);
	});


	test('destroy', function (){
		var firstId = $('#btn5').bem().getId();
		equal(firstId, $('#btn5').attr('bemId'), 'init.bemId');

		$('#btn5').bem('destroy');
		ok($('#btn5')[0], 'destory');
		ok(!$('#btn5').attr('bemId'), 'destory');

		var secondId = $('#btn5').bem().getId();
		equal(secondId, $('#btn5').attr('bemId'), 'reinit.bemId');
		ok(firstId != secondId, 'firstId != secondId');

		$('#btn5').bem('destroy', true);
		ok(!document.getElementById('btn5'), 'absolute destroy');
	});
})(jQuery);
