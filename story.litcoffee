# Hash

In all the times that you've taken the train to the coast, you've never noticed
the smell of the train car before. It's not unpleasant now, but it's all you
can think about: cigarettes, disinfectant, and mechanical grease, like a motel
set top of an engine block.

There's another scent in there, now you notice, that you can't name right away.
A vaguely dangerous, sharp note hanging in the background. You've gradually
sunk into your seat until you're actually quite uncomfortable, so you decide to
get up and explore.

    class Story extends Adventure
      constructor () ->
        @cast = {
        }
        @inventory = {
        }
        @actions = {
          PickUp: /pick up( (the|a|some|an|all) (.*)\.?/i
        }

      actionPickUp (match) ->
        article = match[2]
        object = match[3]
