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
      constructor: (options) ->
        @interface = options.interface
        @start()

      start: () ->
        @history =
          been: {}
          at: null
          back: null
        @scene = null
        @state = "breathing"
        @inventory = {}
        @go @firstScene

      narrate: (statement) ->
        @interface.print statement

      prompt: (statement, callback) ->
        self = @
        @narrate "#{statement}\n" if statement?
        @interface.read (input) ->
          if callback?
            callback input
          else
            self.act(input) or self.prompt("")

      act: (statement) ->
        self = @
        actionFound = false
        if @state is "dead"
          @prompt """
            You're still dead. Continue from the beginning? (Say "yes")
            """,
            (answer) ->
              if /yes/i.test answer
                self.start()
              else
                self.act answer
          actionFound = true
        else
          for name, act of @actions
            if match = statement.match act.pattern
              act.deed.apply @, [match]
              actionFound = true

        actionFound

      go: (sceneName) ->
        sceneName = @history.back if sceneName is "back"
        pattern = new RegExp sceneName, "i"
        if not @scene? or (@scene.exits? and pattern.test @scene.exits.toString())
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
            @scene.event.call(@)?
            @prompt @scene.describe(@haveBeen())
            @history.been[sceneName] = true
          else
            @prompt "Can you be more specific?"
        else
          @prompt "You can't go there from here."

      use: (object, target) ->
        if target?
          @narrate "You use the #{object} on #{target}"
        else
          @narrate "You use the #{object}"

      haveBeen: (sceneName) ->
        sceneName = @history.at if not sceneName?
        @history.been[sceneName]?


    class Scene
      constructor: (options) ->
        @intro = options.intro
        @description = options.description
        @exits = options.exits
        @event = options.event or () -> null

      describe: (been = false) ->
        if @intro? and not been
          output = "\n#{@intro}"
        else
          output = "\n#{@description}"
        output += "\n\nExits are **#{@exits.join "**, **"}**." if @exits?
        output

    class Item
      constructor: (options) ->
        @name = options.name

    class Character
      constructor: (options) ->
        @name = options.name
