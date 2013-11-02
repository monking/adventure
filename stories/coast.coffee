Character = @Character
Item = @Item
Scene = @Scene
Scenery = @Scenery
Adventure = @Adventure

class Cat extends Character
  name: "cat"
  description: () -> "Do you like cats? Because here's a cat."

class Monkey extends Character
  name: "monkey"
  description: () -> "Of course it's a monkey."

class Wrench extends Item
  name: "wrench"
  description: () -> "It is a good wrench. Good and true."

class SuperWrench extends Wrench
  name: "Superwrench!"
  description: () -> "Not just any wrench! Your will be done!"

class Window extends Scenery
  name: "window"
  description: () -> "It's stuffy in here. Maybe open a window? Yeah!"
  constructor: (params) ->
    super params
    @state = (params and params.state) or "closed"
    @actions.open = () ->
      @state = "open"
      {go:"window"}
    @actions.close = () ->
      @state = "closed"
      {message:"The window is now shut."}
    @actions.go = () ->
      if @state isnt "open"
        {message:"You have to open the window first."}
      else
        {message:"Okay!"}

new Adventure
  story: () ->
    @go "car 2"
  scenes:
    "car 1": new Scene
      description: () -> """
        You are in **car 1**, just behind the locomotive engine. 
        """ + (@objects.wrench and """
        There is a fine wrench resting on a bench near the door to the engine.
        """ or "") + """


        Huh. The scent is _weaker_ here. You would have thought, closer
        to the engine...
        """
      objects:
        "wrench": new Wrench
          count: 1
      exits: [
        "car 2"
      ]
      softExits: [
        "the tracks outside"
      ]
    "car 2": new Scene
      intro: () -> """
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
      description: () -> """
        You are in **car 2**, and the strange scent is barely perceptible
        here.
        """
      exits: [
        "car 1"
        "car 3"
      ]
      softExits: [
        "the tracks outside"
      ]
    "car 3": new Scene
      description: () -> """
        You are in **car 3**. The smell is quite noticable here, and reminds
        you of fireworks.
        """
      exits: [
        "car 2"
        "room 1"
      ]
      softExits: [
        "the tracks outside"
      ]
    "room 1": new Scene
      description: () -> """
        This story's *going somewhere*, I promise.
        """
      exits: [
        "car 3"
      ]
      softExits: [
        "window"
      ]
      objects:
        "window": new Window()
    "the tracks outside": new Scene
      description: () -> """
        ***What are you thinking?*** This is a *moving train*.

        You step out onto the tracks as if you were alighting at the
        station, but a sleeper snags your shoe at 70MPH and you are
        crushed and variously destroyed by the train, which is
        disappearing into the distance without most of you.
        """
      event: () ->
        @state = "dead"
    "window": new Scene
      description: () -> """
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
  actions:
    wonder:
      pattern: /wonder/i
      deed: (match) ->
        @prompt "You think you're so important."
    when:
      pattern: /when/i
      deed: (match) ->
        @prompt "Buy a watch."
  cast:
    "steve": new Cat
      name: "steve"
    "hank": new Monkey
      name: "hank"
