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
          "public/js/node-game.js": [
            "src/adventure.litcoffee"
            "src/story.litcoffee"
            "src/node-story.litcoffee"
          ]
          "public/js/browser-game.js": [
            "src/adventure.litcoffee"
            "src/story.litcoffee"
            "src/browser-story.litcoffee"
          ]
    uglify:
      min:
        files:
          "public/js/node-game.js": ["public/js/node-game.js"]
          "public/js/browser-game.js": ["public/js/browser-game.js"]
    compass:
      default:
        options:
          sassDir: "style/sass"
          cssDir: "public/css"
    watch:
      options:
        livereload: true
      scripts:
        files: ["src/*"]
        tasks: ["coffee", "uglify"]
      styles:
        files: ["style/sass/*"]
        tasks: ["compass"]

  grunt.registerTask "default", ["coffee", "compass", "watch"]
