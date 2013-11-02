(function() {
  var Adventure, Cat, Character, Item, Monkey, Scene, SuperWrench, Wrench, _ref, _ref1, _ref2, _ref3,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Character = this.Character;

  Item = this.Item;

  Scene = this.Scene;

  Adventure = this.Adventure;

  Cat = (function(_super) {
    __extends(Cat, _super);

    function Cat() {
      _ref = Cat.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Cat.prototype.name = "cat";

    Cat.prototype.description = function() {
      return "Do you like cats? Because here's a cat.";
    };

    return Cat;

  })(Character);

  Monkey = (function(_super) {
    __extends(Monkey, _super);

    function Monkey() {
      _ref1 = Monkey.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Monkey.prototype.name = "monkey";

    Monkey.prototype.description = function() {
      return "Of course it's a monkey.";
    };

    return Monkey;

  })(Character);

  Wrench = (function(_super) {
    __extends(Wrench, _super);

    function Wrench() {
      _ref2 = Wrench.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    Wrench.prototype.name = "wrench";

    Wrench.prototype.description = function() {
      return "It is a good wrench. Good and true.";
    };

    return Wrench;

  })(Item);

  SuperWrench = (function(_super) {
    __extends(SuperWrench, _super);

    function SuperWrench() {
      _ref3 = SuperWrench.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    SuperWrench.prototype.name = "Superwrench!";

    SuperWrench.prototype.description = function() {
      return "Not just any wrench! Do what you will!";
    };

    return SuperWrench;

  })(Wrench);

  new Adventure({
    story: function() {
      return this.go("car 2");
    },
    scenes: {
      "car 1": new Scene({
        description: function() {
          return "You are in **car 1**, just behind the locomotive engine. " + (this.objects.wrench && "There is a fine wrench resting on a bench near the door to the engine." || "") + "\n\nHuh. The scent is _weaker_ here. You would have thought, closer\nto the engine...";
        },
        objects: {
          "wrench": new Wrench({
            count: 2
          })
        },
        exits: ["car 2"],
        softExits: ["the tracks outside"]
      }),
      "car 2": new Scene({
        intro: function() {
          return "In all the times that you've taken the train to the coast,\nyou've never noticed the smell of the train car before. It's not\nunpleasant now, but it's all you can think about: cigarettes,\ndisinfectant, and mechanical grease, like a motel set on top of\nan engine block.\n\nThere's another scent in there, now that you notice, that you\ncan't name right away. A vaguely dangerous, sharp note hanging in\nthe background. You've gradually sunk into your seat until you're\nactually quite uncomfortable, so you decide to get up and\nexplore.";
        },
        description: function() {
          return "You are in **car 2**, and the strange scent is barely perceptible\nhere.";
        },
        exits: ["car 1", "car 3"],
        softExits: ["the tracks outside"]
      }),
      "car 3": new Scene({
        description: function() {
          return "You are in **car 3**. The smell is quite noticable here, and reminds\nyou of fireworks.";
        },
        exits: ["car 2", "room 1"],
        softExits: ["the tracks outside"]
      }),
      "room 1": new Scene({
        description: function() {
          return "This story's *going somewhere*, I promise.";
        },
        exits: ["car 3", "window"]
      }),
      "the tracks outside": new Scene({
        description: function() {
          return "***What are you thinking?*** This is a *moving train*.\n\nYou step out onto the tracks as if you were alighting at the\nstation, but a sleeper snags your shoe at 70MPH and you are\ncrushed and variously destroyed by the train, which is\ndisappearing into the distance without most of you.";
        },
        event: function() {
          return this.state = "dead";
        }
      }),
      "window": new Scene({
        description: function() {
          return "***!?***\n\nOkay. You just ***leapt out of the window***. About half a\nheartbeat after your foot leaves the coping, your spinal cord\ninsists that you *grab something*, something firmly anchored to\nthe ground, far from gnashing teeth and rocky ballast.\n\nBut there is nothing to grab but the fluid air, and your ego\ncalmly watches as your id scrambles to survive. I don't hope to\never learn what you wanted to *achieve* by this. ***You are\ndead***.";
        },
        event: function() {
          return this.state = "dead";
        }
      })
    },
    actions: {
      wonder: {
        pattern: /wonder/i,
        deed: function(match) {
          return this.prompt("You think you're so important.");
        }
      },
      when: {
        pattern: /when/i,
        deed: function(match) {
          return this.prompt("Buy a watch.");
        }
      }
    },
    cast: {
      "steve": new Cat({
        name: "steve"
      }),
      "hank": new Monkey({
        name: "hank"
      })
    }
  });

}).call(this);
