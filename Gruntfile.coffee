module.exports = (grunt) ->
  require("matchdep")
    .filterDev("grunt-*")
    .forEach(grunt.loadNpmTasks)

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"
    coffee:
      default:
        options:
          join: true
        files:
          "public/js/game.js": [
            "src/adventure.litcoffee"
            "src/story.litcoffee"
          ]
    uglify:
      min:
        files:
          "public/js/game.js": ["public/js/game.js"]
    watch:
      options:
        livereload: true
      scripts:
        files: ["src/*"]
        tasks: ["coffee", "uglify"]

  grunt.registerTask "default", ["watch"]
