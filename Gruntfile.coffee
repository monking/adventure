module.exports = (grunt) ->
  require("matchdep")
    .filterDev("grunt-*")
    .forEach(grunt.loadNpmTasks)

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"
    coffee:
      src:
        options:
          join: true
        files:
          "public/js/adventure.js": [
            "src/adventure.litcoffee"
            "src/adventure-interface.litcoffee"
            "src/node-interface.litcoffee"
            "src/browser-interface.litcoffee"
          ]
      stories:
        expand  : true
        flatten : true
        cwd     : 'stories'
        src     : ['*.coffee']
        dest    : 'public/stories/'
        ext     : '.js'
    concat:
      default:
        files:
          "public/js/adventure.js": ["src/lib/marked/lib/marked.js","public/js/adventure.js"]
      stories:
        files:
          "public/tmp.js": ["public/js/adventure.js","public/stories/coast.js"]
    uglify:
      min:
        files:
          "public/js/adventure.js": ["src/lib/marked/lib/marked.js","public/js/adventure.js"]
    compass:
      default:
        options:
          sassDir: "style/sass"
          cssDir: "public/css"
    watch:
      options:
        livereload: true
      scripts:
        files: ["src/*", "stories/*"]
        tasks: ["coffee:src", "coffee:stories", "concat"]
      styles:
        files: ["style/sass/*"]
        tasks: ["compass"]

  grunt.registerTask "default", ["coffee:src", "coffee:stories", "uglify", "compass", "watch"]
  grunt.registerTask "dev", ["coffee:src", "coffee:stories", "concat", "compass", "watch"]
