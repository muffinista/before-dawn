module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    reactify: {
        ui: 'ui/**/*.jsx'
    }
  });

  //require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks
    grunt.loadNpmTasks('grunt-reactify');
    grunt.loadNpmTasks('load-grunt-tasks');
    grunt.registerTask('default', ['reactify']);
}
