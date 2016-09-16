(function ($, undef){
	module('b-block');

	var log;


	// Описание блока
	$.bem('b-block', {
		onElemMod: {
			'foo': {
				'ok': function () {
				},

				'fail-false': false,

				'fail-fn': function () {
					return false;
				},

				'*': function ($el, mod, state, elemName) {
					log.push('foo*' + elemName + '__' + mod + '_' + state);
				}
			},

			'bar': {
				'baz': function ($el, state, mod, elemName) {
					log.push(elemName + '__' + mod + '_' + state);
				}
			},

			'*': function ($el, elemName, mod, state) {
				log.push('*' + elemName + '__' + mod + '_' + state);
			}
		}
	});

	$.bem('b-block__foo', { });
	$.bem('b-block__bar', { });


	test('api', function () {
		log = [];

		$('.b-block__bar').trigger('mouseover');
		$('.b-block__foo').bem()
			.addMod('mod')
			.addMod('ok')
			.addMod('fail-fn')
			.addMod('fail-false')
		;

		deepEqual(log, [
			'*bar__baz_true',
			'bar__baz_true',
			'*foo__mod_true',
			'foo*foo__mod_true',
			'*foo__ok_true',
			'foo*foo__ok_true',
			'*foo__fail-fn_true',
			'foo*foo__fail-fn_true',
			'*foo__fail-false_true',
			'foo*foo__fail-false_true'
		]);

		ok($('.b-block__foo').hasMod('ok'), 'foo_ok');
		ok(!$('.b-block__foo').hasMod('fail-fn'), 'foo_fail-fn');
		ok(!$('.b-block__foo').hasMod('fail-false'), 'foo_fail-false');
	});


})(jQuery);
