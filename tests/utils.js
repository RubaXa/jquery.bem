(function ($, utils, undef){
	utils.recalcTabIndex = function (){
		$('.js-tab').each(function (i, node){
			node.tabIndex = i+1;
		});
	};

	utils.check = function (id, event, mod, not){
		var $elm = $(id);

		if( !$elm[0] ){
			ok(false, event +': '+id+' — not found');
		}

		if( mod === undef ){
			mod	= event;
			event = 'check';
		}
		else if( typeof event === 'string' ){
			$elm.simulate(event);
		}
		else {
			$elm.simulate(event.type, event);
			event = event.type;
		}

		if( mod.charAt(0) == '!' ){
			not	= false;
			mod	= mod.substr(1);
		}
		else {
			not	= true;
		}


		var className = $elm.bem().name +'_'+ mod;
		var arMod = mod.split('_');

		ok($elm.hasClass(className) === not, event+': '+id+' hasClass("'+className+'") === '+not.toString()+' ['+$elm.attr('class')+']');

		if( arMod[1] ){
			ok($elm.hasMod(arMod[0], arMod[1]) === not, event+': '+id+' hasMod("'+arMod[0]+'","'+arMod[1]+'") === '+not.toString()+' ['+$elm.attr('class')+']');
		}
		else {
			ok($elm.hasMod(mod) === not, event+': '+id+' hasMod("'+mod+'") === '+not.toString()+' ['+$elm.attr('class')+']');
		}
	};


	$(function (){
		utils.recalcTabIndex();
	});


	window.sleep = function (fn, ms){
		if( !ms ){
			ms	= fn;
			fn	= $.noop;
		}

		stop();
		setTimeout(function (){
			start();
			fn();
		}, ms);
	};
})(jQuery, this.utils = {});
