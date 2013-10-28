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
        self = @

        @scenes = options.scenes or {}
        @cast = options.cast or {}
        @items = options.items or {}
        @actions[name] = action for name, action of options.actions if options.actions?
        @story = options.story

        interfaceCallback = () -> self.start()
        if options.interface?
          @interface = new options.interface(interfaceCallback)
        else
          @interface = new (if module? then NodeInterface else BrowserInterface)(interfaceCallback)
        console.log @interface

      start: () ->
        @inventory = {}
        @history =
          been: {}
          at: null
          back: null
        @scene = null
        @state = "breathing"
        @story()

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

      actions:
        help:
          pattern: /help/i
          deed: (match) ->
            @narrate "Commands are 'go', 'pick up', 'use', 'look', and 'help'"
            @prompt @scene.describe(@haveBeen())
        look:
          pattern: /where(( am i| are we)\??)?|look( at( the)?)?( (.*))?/i
          deed: (match) ->
            if match[6]?
              @prompt "You look right at #{match[6]}"
            else
              @prompt @scene.describe(@haveBeen())
        pickUp:
          pattern: /pick up( ([0-9]+|the|a|some|an|all))? (.*)/i
          deed: (match) ->
            article = match[2] or "the"
            object = match[3]
            @prompt "You pick up #{article} #{object}."
        go:
          pattern: /go( (to( the)?))? (.*)\.?/i
          deed: (match) ->
            @go match[4]
        use:
          pattern: /use (.*?)(( (with|on) )?(.*))/i
          deed: (match) ->
            object = if match[1] then match[1] else match[5]
            target = match[5] if match[1]
            @use object, target
            @prompt()
        restart:
          pattern: /restart/i
          deed: () ->
            @start()
        say:
          pattern: /say (.*)/i
          deed: (match) ->
            @prompt "\"#{match[1]}\""


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

    this.Adventure = Adventure
    this.Scene = Scene
    this.Item = Item
    this.Character = Character
