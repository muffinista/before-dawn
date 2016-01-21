module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
      babel: {
          options: {
              sourceMap: true,
              presets: ['es2015', 'react']
          },
          dist: {
              files: {
                  'ui/prefs.js': 'ui/prefs.jsx'
              }
          }
      }
  });

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('load-grunt-tasks');
    grunt.registerTask('default', ['babel']);
};
