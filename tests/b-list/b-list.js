(function ($){
	module('b-list');

	test('hover', function (){
		var log = [];

		$('#list').simulate('mouseover');
		equal($('#list .b-list__item_hover').length, 0, 'list items hovered');

		$('#list')
			.on('hoveritem', function (evt){
				if( evt.target ) log.push(evt.target.innerHTML);
			})
			.simulate('focus')
		;

		$('body').simulate('keydown', { keyCode: 40 });
		equal($('#list .b-list__item_hover').length, 1, 'item hover');
		$('body').simulate('keydown', { keyCode: 40 });
		$('body').simulate('keydown', { keyCode: 40 });
		$('body').simulate('keydown', { keyCode: 40 });
		$('body').simulate('keydown', { keyCode: 40 });
		$('body').simulate('keydown', { keyCode: 40 });
		$('#list').simulate('keydown', { keyCode: 38 });


		$('#list :eq(0)').simulate('click');
		equal(log.join(','), '1,2,4,1,2,4,2,1', 'hoveritem + selectitem');

		$('#list').simulate('mouseout');
		equal($('#list .b-list__item_hover').length, 0, 'list items hovered');
	});
})(jQuery);
