(function() {
  new Adventure({
    story: function() {
      return this.go("car 2");
    },
    scenes: {
      "car 1": new Scene({
        description: "You are in **car 1**, just behind the locomotive engine.\n\nHuh. The scent is _weaker_ here. You would have thought, closer\nto the engine...",
        exits: ["car 2", "the tracks"]
      }),
      "car 2": new Scene({
        intro: "In all the times that you've taken the train to the coast,\nyou've never noticed the smell of the train car before. It's not\nunpleasant now, but it's all you can think about: cigarettes,\ndisinfectant, and mechanical grease, like a motel set on top of\nan engine block.\n\nThere's another scent in there, now that you notice, that you\ncan't name right away. A vaguely dangerous, sharp note hanging in\nthe background. You've gradually sunk into your seat until you're\nactually quite uncomfortable, so you decide to get up and\nexplore.",
        description: "You are in **car 2**, and the strange scent is barely perceptible\nhere.",
        exits: ["car 1", "car 3", "the tracks"]
      }),
      "car 3": new Scene({
        description: "You are in **car 3**. The smell is quite noticable here, and reminds\nyou of fireworks.",
        exits: ["car 2", "room 1", "the tracks"]
      }),
      "room 1": new Scene({
        description: "This story's *going somewhere*, I promise.",
        exits: ["car 3", "window"]
      }),
      "the tracks": new Scene({
        description: "***What are you thinking?*** This is a *moving train*.\n\nYou step out onto the tracks as if you were alighting at the\nstation, but a sleeper snags your shoe at 70MPH and you are\ncrushed and variously destroyed by the train, which is\ndisappearing into the distance without most of you.",
        event: function() {
          return this.state = "dead";
        }
      }),
      "window": new Scene({
        description: "***!?***\n\nOkay. You just ***leapt out of the window***. About half a\nheartbeat after your foot leaves the coping, your spinal cord\ninsists that you *grab something*, something firmly anchored to\nthe ground, far from gnashing teeth and rocky ballast.\n\nBut there is nothing to grab but the fluid air, and your ego\ncalmly watches as your id scrambles to survive. I don't hope to\never learn what you wanted to *achieve* by this. ***You are\ndead***.",
        event: function() {
          return this.state = "dead";
        }
      })
    },
    cast: {
      "cat": new Character({
        name: "Moonbeam"
      }),
      "monkey": new this.Character({
        name: "Monkey"
      })
    },
    items: {
      "wrench": new this.Item({
        name: "wrench"
      })
    },
    actions: {
      wonder: {
        pattern: /wonder/i,
        deed: function(match) {
          return this.narrate("You think you're so important");
        }
      }
    }
  });

}).call(this);
