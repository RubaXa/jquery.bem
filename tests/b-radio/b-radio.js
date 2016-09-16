(function ($, undef){
	module('b-radio');

	test('checked', function (){
		// check "1"
		equal($('[name="radio_a"]:checked').val(), '1', 'checked first radio');
		utils.check('#radio_a-1', 'checked');

		// check "2"
		$('[name="radio_a"]').eq(1).simulate('click');
		equal($('[name="radio_a"]:checked').val(), '2', 'checked second radio');
		utils.check('#radio_a-1', '!checked');
		utils.check('#radio_a-2', 'checked');

		// check "3"
		$('.b-radio').eq(2).bem('checked', true);
		equal($('[name="radio_a"]:checked').val(), '3', 'checked three radio');
		utils.check('#radio_a-2', '!checked');
		utils.check('#radio_a-3', 'checked');

		// check "1"
		$('.b-radio').eq(0).simulate('click');
		equal($('[name="radio_a"]:checked').val(), '1', 'checked three radio');
		utils.check('#radio_a-3', '!checked');
		utils.check('#radio_a-1', 'checked');

		// check "2"
		$('#radio_a-2-label').simulate('click');
		equal($('[name="radio_a"]:checked').val(), '2', 'checked three radio');
		utils.check('#radio_a-1', '!checked');
		utils.check('#radio_a-2', 'checked');

		// check "3"
		$('#radio_a-3-label').simulate('click');
		equal($('[name="radio_a"]:checked').val(), '3', 'checked three radio');
		utils.check('#radio_a-2', '!checked');
		utils.check('#radio_a-3', 'checked');
	});


	test('events', function (){
		var log = { change: [0,0,0], checked: [0,0,0] };

		$('#radio_b-1').on('change checked', function (e){ log[e.type][0]++; });
		$('#radio_b-2').on('change checked', function (e){ log[e.type][1]++; });
		$('#radio_b-3').on('change checked', function (e){ log[e.type][2]++; });

		$('#radio_b-1').simulate('click');
		$('#radio_b-2 :input').simulate('click');

		$('#radio_b-3-label').simulate('click');
		$('#radio_b-2-label').simulate('click');

		equal(log.change[0], 1, 'radio_b-1 -> onChange');
		equal(log.checked[0], 2, 'radio_b-1 -> onChecked');

		equal(log.change[1], 2, 'radio_b-2 -> onChange');
		equal(log.checked[1], 3, 'radio_b-2 -> onChecked');

		equal(log.change[2], 1, 'radio_b-3 -> onChange');
		equal(log.checked[2], 2, 'radio_b-3 -> onChecked');
	});
})(jQuery);
