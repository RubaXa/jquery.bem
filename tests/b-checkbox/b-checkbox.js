(function ($, undef){
	module('b-checkbox');

	test('checked', function (){
		utils.check('#cbx1', 'focus', 'focus');
		utils.check('#cbx1', 'click', 'checked');

		equal($('#cbx1').attr('aria-checked'), 'true', 'aria-checked="true"');
		equal($('#cbx1 :checkbox').prop('checked'), true, 'prop="true"');
		equal($('#cbx1 :checkbox').attr('checked'), 'checked', 'checked="checked"');

		utils.check('#cbx1', 'click', '!checked');

		equal($('#cbx1').attr('aria-checked'), 'false', 'checked aria');
		equal($('#cbx1 :checkbox').prop('checked'), false, 'checked prop');
		equal($('#cbx1 :checkbox').attr('checked'), undef, 'checked attr');

		$('#cbx1 :checkbox').simulate('click');

		ok($('#cbx1 :checkbox').prop('checked'), 'cbx.onclick: checked prop');
		ok($('#cbx1').hasMod('checked'), 'cbx.onclick: "checked" mod');
		equal($('#cbx1').attr('aria-checked'), 'true', 'cbx.onclick: checked aria');
	});


	test('label', function (){
		labelTest('cbx-label');
	});


	test('cbx-in-label', function (){
		labelTest('cbx-in-label');
	});


	test('events', function (){
		var log = { change: [0,0,0], checked: [0,0,0] };

		$('#cbx1').on('change checked', function (e){ log[e.type][0]++; });
		$('#b-cbx-label').on('change checked', function (e){ log[e.type][1]++; });
		$('#b-cbx-in-label').on('change checked', function (e){ log[e.type][2]++; });

		$('#cbx1').simulate('focus').simulate('click');
		$('#cbx1 :checkbox').simulate('click');

		$('#b-cbx-label').simulate('click');
		$('#b-cbx-label :checkbox').simulate('click');
		$('[for="cbx-label"]').simulate('click');

		$('#b-cbx-in-label').simulate('click');
		$('#b-cbx-in-label :checkbox').simulate('click');
		$('[for="cbx-in-label"]').simulate('click');

		equal(log.change[0], 2, 'cbx1 changes');
		equal(log.checked[0], log.change[0], 'cbx1 checked');

		equal(log.change[1], 3, 'b-cbx-label changes');
		equal(log.checked[1], log.change[1], 'b-cbx-label checked');

		equal(log.change[2], 3, 'b-cbx-in-label changes');
		equal(log.checked[2], log.change[2], 'b-cbx-in-label checked');
	});

	
	function labelTest(id){
		utils.check('#b-'+id, '!focus');
		utils.check('#b-'+id, '!checked');

		$('[for="'+id+'"]').simulate('click');
		ok($('#'+id).prop('checked'), id+'.checked == true');
		ok($('#b-'+id).hasMod('checked'), id+'.hasMod("checked") == true');

		$('[for="'+id+'"]').simulate('click');
		ok(!$('#'+id).prop('checked'), id+'.checked == false');
		ok(!$('#b-'+id).hasMod('checked'), id+'.hasMod("checked") == false');

		$('#b-'+id).simulate('click');
		ok($('#'+id).prop('checked'), id+'.checked == true');
		ok($('#b-'+id).hasMod('checked'), id+'.hasMod("checked") == true');

		$('[for="'+id+'"]').simulate('click');
		ok(!$('#'+id).prop('checked'), id+'.checked == false');
		ok(!$('#b-'+id).hasMod('checked'), id+'.hasMod("checked") == false');

		$('#'+id).simulate('click');
		ok($('#'+id).prop('checked'), id+' :checkbox.checked == true');
		ok($('#b-'+id).hasMod('checked'), id+'.hasMod("checked") == true');
	}
})(jQuery);
