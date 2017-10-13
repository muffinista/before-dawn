module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js', 'app/**/*.js', 'test/**/*.js', '!node_modules/**', '!app/node_modules/**'],
      options: {
        jshintrc: ".jshintrc"
      }
    },
    simplemocha: {
      options: {
        globals: ['expect'],
        timeout: 3000,
        ignoreLeaks: false
      },
      all: { src: ['test/**/*.js'] }
    },
    watch: {
      options: { interval: 1000 },
      scripts: {
        files: ['gruntfile.js', 'app/*.js', 'app/**/*.js', 'test/**/*.js'],
        tasks: ['default']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');


  // On watch events, if the changed file is a test file then configure mochaTest to only
  // run the tests from that file. Otherwise run all the tests
  var defaultTestSrc = grunt.config('mochaTest.test.src');
  grunt.event.on('watch', function(action, filepath) {
    grunt.config('mochaTest.test.src', defaultTestSrc);
    if (filepath.match('test/')) {
      grunt.config('mochaTest.test.src', filepath);
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['simplemocha']);
};
