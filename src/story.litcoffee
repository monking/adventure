# # Hash
#
# In all the times that you've taken the train to the coast, you've never noticed
# the smell of the train car before. It's not unpleasant now, but it's all you
# can think about: cigarettes, disinfectant, and mechanical grease, like a motel
# set top of an engine block.
#
# There's another scent in there, now you notice, that you can't name right away.
# A vaguely dangerous, sharp note hanging in the background. You've gradually
# sunk into your seat until you're actually quite uncomfortable, so you decide to
# get up and explore.

    class Story extends Adventure
      constructor: () ->
        super()
        @scenes =
          "car 1": new Scene this,
            description: """
              You are in car 1, just behind the locomotive engine.

              Huh. The scent is weaker here. You would have thought, closer to
              the engine...
              """
            exits: ["car 2", "the tracks"]
          "car 2": new Scene this,
            intro: """
              In all the times that you've taken the train to the coast,
              you've never noticed the smell of the train car before. It's not
              unpleasant now, but it's all you can think about: cigarettes,
              disinfectant, and mechanical grease, like a motel set on top of
              an engine block.

              There's another scent in there, now that you notice, that you
              can't name right away. A vaguely dangerous, sharp note hanging in
              the background. You've gradually sunk into your seat until you're
              actually quite uncomfortable, so you decide to get up and
              explore.
              """
            description: """
              You are in car 2, and the strange scent is barely perceptible
              here.
              """
            exits: ["car 1", "car 3", "the tracks"]
          "car 3": new Scene this,
            description: """
              You are in car 3. The smell is quite noticable here, and reminds
              you of fireworks.
              """
            exits: ["car 2", "room 1", "the tracks"]
          "room 1": new Scene this,
            description: """
              This story's going somewhere, I promise.
              """
            exits: ["car 3", "window"]
          "the tracks": new Scene this,
            description: """
              What are you thinking? This is a moving train. You step out onto
              the tracks as if you were alighting at the station, but a sleeper
              snags your shoe at 70MPH and you are crushed and variously
              destroyed by the train now leaving without most of you.
              """
          "window": new Scene this,
            description: """
              !?

              Okay. You just leapt out of the window. About half a heartbeat
              after your foot leaves the coping, your spinal cord insists that
              you grab something, something firmly anchored to the ground, far
              from gnashing teeth and rocky ballast.

              But there is nothing to grab but the fluid air, and your ego
              calmly watches as your id scrambles to survive. I don't hope to
              ever learn what you wanted to achieve by this. You are dead.
              """
        @cast =
          "cat": new Character
            name: "Moonbeam"
          "monkey": new Character
            name: "Monkey"
        @inventory =
          "wrench": new Item
            name: "wrench"
        @actions =
          Help: /help/i
          Look: /look/i
          PickUp: /pick up( (the|a|some|an|all)) (.*)\.?/i
          Go: /go( (to( the)?))? (.*)\.?/i
          Use: /use (.*?)( (with|on) (.*))?/i

        @go("car 2")

      actionUse: (match) ->
        @narrate "somehow you expect to affect #{match[4]} by using #{match[1]}"

      actionGo: (match) ->
        @go match[4]

      actionHelp: (match) ->
        @narrate "Commands are 'go', 'pick up', 'use', 'look', and 'help'"
        @scene.describe()

      actionLook: (match) ->
        @scene.describe()

      actionPickUp: (match) ->
        article = match[2]
        object = match[3]
        @narrate "You pick up #{article} #{object}."
        @scene.describe()

# Start telling your story!

    story = new Story
