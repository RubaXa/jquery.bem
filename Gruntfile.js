'use strict';


module.exports = function (grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),


		concat: {
			dist: {
				src: ['jquery.bem.js',
					'bem/jquery.bem.control.js',
					'bem/jquery.bem.list.js',
					'bem/jquery.bem.dropdown.js',
					'bem/jquery.bem.select.js',
					'bem/jquery.bem.filter.js'
				],
				dest: 'jquery.bem.min.js'
			}
		},


		uglify: {
			min: {
				files: { 'jquery.bem.min.js': ['jquery.bem.min.js'] }
			}
		}
	});


	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');


	grunt.registerTask('default', ['concat', 'uglify']);
};
