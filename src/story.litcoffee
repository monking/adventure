    class Story extends Adventure
      firstScene: "car 2"
      scenes:
        "car 1": new Scene
          description: """
            You are in **car 1**, just behind the locomotive engine.

            Huh. The scent is _weaker_ here. You would have thought, closer
            to the engine...
            """
          exits: [
            "car 2"
            "the tracks"
          ]
        "car 2": new Scene
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
            You are in **car 2**, and the strange scent is barely perceptible
            here.
            """
          exits: [
            "car 1"
            "car 3"
            "the tracks"
          ]
        "car 3": new Scene
          description: """
            You are in **car 3**. The smell is quite noticable here, and reminds
            you of fireworks.
            """
          exits: [
            "car 2"
            "room 1"
            "the tracks"
          ]
        "room 1": new Scene
          description: """
            This story's *going somewhere*, I promise.
            """
          exits: [
            "car 3"
            "window"
          ]
        "the tracks": new Scene
          description: """
            ***What are you thinking?*** This is a *moving train*.

            You step out onto the tracks as if you were alighting at the
            station, but a sleeper snags your shoe at 70MPH and you are
            crushed and variously destroyed by the train, which is
            disappearing into the distance without most of you.
            """
          event: () ->
            @state = "dead"
        "window": new Scene
          description: """
            ***!?***

            Okay. You just ***leapt out of the window***. About half a
            heartbeat after your foot leaves the coping, your spinal cord
            insists that you *grab something*, something firmly anchored to
            the ground, far from gnashing teeth and rocky ballast.

            But there is nothing to grab but the fluid air, and your ego
            calmly watches as your id scrambles to survive. I don't hope to
            ever learn what you wanted to *achieve* by this. ***You are
            dead***.
            """
          event: () ->
            @state = "dead"
      cast:
        "cat": new Character
          name: "Moonbeam"
        "monkey": new Character
          name: "Monkey"
      inventory:
        "wrench": new Item
          name: "wrench"
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
