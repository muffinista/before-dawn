var webpackConfig = require("./webpack.config");

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    eslint: {
      options: {
        configFile: "eslint.json"
      },
      target: ["Gruntfile.js", "app/lib/**/*.js", "app/js/**/*.js?"]
    },
    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          "dist/styles.css": "css/styles.scss"
        }
      }
    },
    webpack: {
      options: {
        stats: !process.env.NODE_ENV || process.env.NODE_ENV === "development"
      },
      prod: webpackConfig,
      dev: webpackConfig
    },
    mochaTest: {
      options: {
        reporter: "spec",
        //captureFile: "results.txt", // Optionally capture the reporter output to a file
        quiet: false, // Optionally suppress output to standard out (defaults to false)
        clearRequireCache: true, // Optionally clear the require cache before running tests (defaults to false)
        clearCacheFilter: (key) => true, // Optionally defines which files should keep in cache
        noFail: false // Optionally set to not fail on failed tests (will still fail on other errors)
      },
      test: {
        src: ["test/**/*.js"]
      },
      lib: {
        src: ["test/lib/*.js"]
      }
      
    },
    watch: {
      /* options: {
         interval: 1000,
         spawn: false
         }, */
      mocha: {
        files: ["app/**/*.js", "test/**/*.js"],
        tasks: ["mochaTest:lib"],
        options: {
          spawn: false
        }
      },
      sass: {
        files: ["app/css/**/*"],
        tasks: ["sass"]
      },
      scripts: {
        files: ["Gruntfile.js", "app/**/*.js", "app/**/*.js?", "!app/dist/*.*"],
        tasks: ["eslint", "webpack"],
        options: {
          interval: 1000,
          debounceDelay: 250,
          //          spawn: false,
        },
      }
    }
  });

  grunt.event.on("watch", function(action, filepath, target) {
    grunt.log.writeln(target + ": " + filepath + " has " + action);
  });


  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("gruntify-eslint");
  grunt.loadNpmTasks("grunt-sass");
  grunt.loadNpmTasks("grunt-webpack");

  // On watch events, if the changed file is a test file then configure mochaTest to only
  // run the tests from that file. Otherwise run all the tests
/*  var defaultTestSrc = grunt.config("mochaTest.test.src");
  grunt.event.on("watch", function(action, filepath) {
    console.log(filepath);
    grunt.config("mochaTest.test.src", defaultTestSrc);
    if (filepath.match("test/")) {
      grunt.config("mochaTest.test.src", filepath);
    }
  });
  */
  
  // Default task(s).
  grunt.registerTask("default", ["eslint", "sass", "webpack"]);
  grunt.registerTask("mocha", ["mochaTest"]);
  grunt.registerTask("work", ["mochaTest:lib", "watch"]);
};
