(function ($, undef){
	module('b-tags');

	test('focus', function (){
		$('.js-test-2').simulate('focus');
		equal(document.activeElement.nodeName, 'INPUT', 'Active element input');

//		$('.js-test-1').simulate('keypress', { which: 'e'.charCodeAt(0) });
	});

})(jQuery);
