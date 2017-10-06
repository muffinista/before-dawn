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
      target: ["Gruntfile.js", "*.js", "lib/**/*.js"]
    },
    watch: {
      lint: {
        files: ["Gruntfile.js", "*.js", "lib/**/*.js"],
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
  grunt.registerTask("default", ["eslint", "babel"]);
};
