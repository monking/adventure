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

        if options.interface?
          @interface = new options.interface()
        else
          @interface = new (if module? then NodeInterface else BrowserInterface)()
        @interface.attach () ->
          self.start()
          self.prompt()

      start: () ->
        scene.been = false for name, scene of @scenes
        @inventory = []
        @history =
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
            self.parse(input)
            self.prompt()

      parse: (statement) ->
        self = @
        actionFound = false
        if @state is "dead" and not /restart/i.test statement
          @prompt """
            You're still dead. Continue from the beginning? (Say "yes")
            """,
            (answer) ->
              if /yes/i.test answer
                self.start()
              else
                self.parse answer
          actionFound = true
        else
          for name, act of @actions
            if match = statement.match act.pattern
              act.deed.apply @, [match]
              actionFound = true
              break

        actionFound

      get: (item) ->
        @inventory.push item
        count = 0
        (count++ if holding.name is item.name) for holding in @inventory
        "You now have #{count} #{item.name}"

      actOn: (objectName, verb, itemName, article) ->
        # console.log "actOn: #{objectName}, #{verb}, #{itemName}, #{article}"
        if not objectName or objectName is "scene"
          context = null
          object = @scene
        else
          context = @scene
          object = context.objects? and context.objects[objectName] ? null

        if object
          count = 1
          if item = itemName and @scene.objects[itemName] ? null
            if article is "all"
              count = item.count
            else if not isNaN article and article isnt ""
              count = Number article
          if item and count > item.count
            output = "You don't have #{article} #{itemName}"
          else
            result = object.receiveAction {verb, item, count}
            if result.item?
              @get result.item
            if result.go?
              @go result.go
            output = result.message or ""
            if context? and object.count is 0
              delete context.objects[objectName]
        else
          output = "There is no #{objectName} here."
        output

      go: (sceneName) ->
        sceneName = @history.back if sceneName is "back"
        pattern = new RegExp sceneName, "i"

        if not @scene?
          sceneMatchCount = 1
        else
          exits = @scene.exits.slice() ? []
          exits = exits.concat(@scene.softExits) if @scene.softExits?

          sceneMatchCount = 0
          for name in exits
            if pattern.test name
              sceneName = name
              sceneMatchCount++

        if sceneMatchCount is 0
          @narrate "You can't go there from here."
        else if sceneMatchCount is 1
          @history.back = @history.at
          @history.at = sceneName
          @scene = @scenes[sceneName]
          if @scene.event?
            @scene.event.call @
          else
            @narrate @actOn "scene", "look"
          @scene.been = true
        else
          @narrate "Can you be more specific?"

      actions:
        help:
          pattern: /help/i
          deed: (match) ->
            @narrate "Commands are 'go', 'pick up', 'use', 'look', and 'help'"
            @narrate @actOn "scene", "look"
        open:
          pattern: /open (.*)/i
          deed: (match) ->
            if /inv(entory)?/i.test match[1]
              @actions.inventory.deed.call(@)
            else
              if match[1]?
                @narrate @actOn match[1], "open"
              else
                @narrate "Open...what?"

        look:
          pattern: /where( am i| are we)?|(look( at)?|check out|what is|what's)( the| a)?( (.*))?/i
          deed: (match) ->
            if /me|self|health/i.test match[6]
              @actions.state.deed.call(@)
            else
              if not match[6]? or /around|about/i.test match[6]
                objectName = "scene"
              else
                objectName = match[6]

              @narrate @actOn objectName, "look"
        pickUp:
          pattern: /(pick up|take|get)( ([0-9]+|the|a|some|an|all))? (.*)/i
          deed: (match) ->
            article = match[3] or "the"
            itemName = match[4]
            @actOn itemName, "take", null, article
        state:
          pattern: /how am|state|health/i
          deed: (match) ->
            @narrate "Well, you're #{@state}."
        inventory:
          pattern: /inv(entory)?/i
          deed: (match) ->
            items = []
            items.push "  - #{item.count} #{item.name}" for item in @inventory
            @narrate items.join "\n"
        go:
          pattern: /go( (to( the)?))? (.*)\.?/i
          deed: (match) ->
            @go match[4]
        use:
          pattern: /use( ([0-9]+|the|a|some|an|all))? (.+?)( (with|on)( the)? (.*))?/i
          deed: (match) ->
            itemName = match[3]
            article = match[2]
            objectName = match[7]
            @narrate @actOn objectName, "use", itemName, article
        restart:
          pattern: /restart/i
          deed: () ->
            @start()
        say:
          pattern: /say (.*)/i
          deed: (match) ->
            @narrate "\"#{match[1]}\""

# The base class for things you can look at or interact with is `Scenery`.
# Scenes, items, and characters, all extend this class.
#
# The method `receiveAction` tries to do something to an object this bit of
# Scenery, and if there is an item involved, the `count` lets the action know
# how many of the item to involve in the action ("the", "2", "all", etc.)

    class Scenery
      constructor: (options) ->
        @options = options
        @actions =
          look: () -> {message:@description()}
        @name = options.name if options? and options.name?
        @description = options.description if options? and options.description?
        @actions[name] = action for name, action of options.actions if options? and options.actions?

      clone: () ->
        newInstance = new @constructor(@options)

      receiveAction: (params) ->
        if @actions[params.verb]?
          @actions[params.verb].apply @, [params]
        else
          {message: "I'm not sure what you mean."}

# Each Scene consists of an `intro`, a `description`, a list of `exits`, and an
# `event`.
#
# The intro is printed the first time the player enters the scene, and the
# description is printed each time after that, and when they use the `look`
# command. Exits are the names of other scenes you can access from that scene).
# The event is a function which is called when the user enters the scene.  If a
# scene has any complex logic, it will be controlled by the `event` function.

    class Scene extends Scenery
      constructor: (options) ->
        super(options)
        {
          @intro
          @exits
          @softExits
          @event
          @objects
        } = options
        @options = options
        @been = false

        @actions.look = options.look ? () ->
          if @intro? and not @been
            output = "\n#{@intro()}"
          else
            output = "\n#{@description()}"
          output += "\n\nExits are **#{@exits.join "**, **"}**." if @exits?
          {message:output}

    class Item extends Scenery
      constructor: (options) ->
        super(options)
        @count = options? and options.count ? 1

        @actions.take = options? and options.take ? (params) ->
          item = @take params.count
          {
            item: item
            dest: "inventory"
            message: if item? then "You take the #{@name}." else "You can't take #{params.count} #{@name}"
          }

      take: (quantity = 1) ->
        quantity = Math.min quantity, @count
        newInstance = @clone()
        newInstance.count = quantity
        @count -= quantity
        newInstance

      description: () -> "It's a thing, for sure."

    class Character extends Scenery
      constructor: (options) ->
        @name = options.name

      description: () -> "Who or what could it be?"

    @Adventure = Adventure
    @Scenery   = Scenery
    @Scene     = Scene
    @Item      = Item
    @Character = Character
