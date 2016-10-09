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
    },
    watch: {
      scripts: {
        files: ['**/*.jsx'],
        tasks: ['babel'],
        options: {
          spawn: false,
        },
      },
    }
  });
  
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('load-grunt-tasks');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['babel']);
};
