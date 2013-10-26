# `grunt-contrib-coffee` is not currently compiling Literate CoffeeScript when
# joining first, so the literate chunks are commented out as CoffeeScript for
# now.

# Set up your story as a class extending this engine. You'll need some `@scenes`,
# a `@cast` of characters, a list of `@inventory` items, and a set of `@actions`
# that the player can invoke. Each action is paired with a Regular Expression
# which your story will use to understand these commands.
#
# Let's get started!

    class Adventure
      constructor: () ->
        @history =
          been: {}
          at: null
          back: null

      narrate: (statement) ->
        console.log statement

      act: (statement) ->
        actionFound = false
        for act, pattern of @actions
          if match = statement.match pattern
            @["action#{act}"](match)
            actionFound = true

        actionFound

      go: (sceneName) ->
        sceneName = @history.back if sceneName is "back"
        pattern = new RegExp sceneName, "i"
        if not @scene? or pattern.test @scene.exits.toString()
          sceneMatchCount = 0
          if not @scene?
            sceneMatchCount = 1
          else
            for name in @scene.exits
              if pattern.test name
                sceneName = name
                sceneMatchCount++
          if sceneMatchCount is 1
            @history.back = @history.at
            @history.at = sceneName
            @scene = @scenes[sceneName]
            @scene.describe()
            @history.been[sceneName] = true
          else
            @prompt "Can you be more specific?"
        else
          @prompt "You can't go there from here."

      haveBeen: (sceneName) ->
        sceneName = @history.at if not sceneName?
        @history.been[sceneName]?

      prompt: (statement) ->
        self = @
        @narrate "#{statement}\n"
        process.stdout.write ":"
        process.stdin.once "data", (data) ->
          self.act(data.toString().trim()) or self.prompt("")

    class Scene
      constructor: (@adventure, options) ->
        @intro = options.intro
        @description = options.description
        @exits = options.exits

      describe: () ->
        if @intro? and not @adventure.haveBeen()
          @adventure.narrate "\n#{@intro}"
        else
          @adventure.narrate "\n#{@description}"
        @adventure.prompt "\nExits are #{@exits.join ", "}." if @exits?

    class Item
      constructor: (options) ->
        @name = options.name

    class Character
      constructor: (options) ->
        @name = options.name
