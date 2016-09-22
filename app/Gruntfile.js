module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015', 'react']
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: 'ui/',
            src: ['*.jsx'],
            ext: '.js',
            dest: 'ui/'
          }
        ],
        oldfiles: {
          'ui/prefs.js': 'ui/prefs.jsx',
          'ui/components.js': 'ui/components.jsx'
        }
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('load-grunt-tasks');
  grunt.registerTask('default', ['babel']);
};
