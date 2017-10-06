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
            cwd: 'ui/js',
            src: ['*.js', '*.jsx'],
            ext: '.js',
            dest: 'ui/'
          }
        ]
      }
    },
    jshint: {
      all: ['Gruntfile.js', '*.js', 'lib/**/*.js'],
      options: {
        node: true,
        esversion: 6
      }
    },
    eslint: {
      options: {
        configFile: 'eslint.json'
      },
      target: ['Gruntfile.js', '*.js', 'lib/**/*.js']
    },
    watch: {
      scripts: {
        files: ['**/*.jsx'],
        tasks: ['babel'],
        options: {
          spawn: false,
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('load-grunt-tasks');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks("grunt-eslint");
//  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('default', ['babel']);
};
