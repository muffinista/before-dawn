var webpackConfig = require("./webpack.config");
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    babel: {
      options: {
        sourceMap: true,
        presets: ["es2015", "react"]
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: "ui/js",
            src: ["*.js", "*.jsx"],
            ext: ".js",
            dest: "ui/"
          }
        ]
      }
    },
    eslint: {
      options: {
        configFile: "eslint.json"
      },
      target: ["Gruntfile.js", "*.js", "lib/**/*.js", "js/**/*.js?"]
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
      //dev: Object.assign({ watch: true }, webpackConfig)
      dev: webpackConfig
    },
    watch: {
      lint: {
        files: ["Gruntfile.js", "*.js", "lib/**/*.js", "ui/**/*.jsx"],
        tasks: ["eslint"]
      },
      scripts: {
        files: ["**/*.jsx"],
        tasks: ["babel"],
        options: {
          spawn: false,
        },
      }
    }
  });


  grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-sass");  
  grunt.loadNpmTasks("grunt-webpack");
  
  grunt.registerTask("default", ["eslint", "sass", "webpack"]);
};
