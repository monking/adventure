(function() {
  var Adventure, Character, Item, NodeInterface, Scene, Story, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Adventure = (function() {
    function Adventure(options) {
      this["interface"] = options["interface"];
      this.start();
    }

    Adventure.prototype.start = function() {
      this.history = {
        been: {},
        at: null,
        back: null
      };
      this.scene = null;
      this.state = "breathing";
      this.inventory = {};
      return this.go(this.firstScene);
    };

    Adventure.prototype.narrate = function(statement) {
      return this["interface"].print(statement);
    };

    Adventure.prototype.prompt = function(statement, callback) {
      var self;
      self = this;
      if (statement != null) {
        this.narrate("" + statement + "\n");
      }
      return this["interface"].read(function(input) {
        if (callback != null) {
          return callback(input);
        } else {
          return self.act(input) || self.prompt("");
        }
      });
    };

    Adventure.prototype.act = function(statement) {
      var act, actionFound, match, name, self, _ref;
      self = this;
      actionFound = false;
      if (this.state === "dead") {
        this.prompt("You're still dead. Continue from the beginning? (Say \"yes\")", function(answer) {
          if (/yes/i.test(answer)) {
            return self.start();
          } else {
            return self.act(answer);
          }
        });
        actionFound = true;
      } else {
        _ref = this.actions;
        for (name in _ref) {
          act = _ref[name];
          if (match = statement.match(act.pattern)) {
            act.deed.apply(this, [match]);
            actionFound = true;
          }
        }
      }
      return actionFound;
    };

    Adventure.prototype.go = function(sceneName) {
      var name, pattern, sceneMatchCount, _i, _len, _ref;
      if (sceneName === "back") {
        sceneName = this.history.back;
      }
      pattern = new RegExp(sceneName, "i");
      if ((this.scene == null) || ((this.scene.exits != null) && pattern.test(this.scene.exits.toString()))) {
        sceneMatchCount = 0;
        if (this.scene == null) {
          sceneMatchCount = 1;
        } else {
          _ref = this.scene.exits;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            name = _ref[_i];
            if (pattern.test(name)) {
              sceneName = name;
              sceneMatchCount++;
            }
          }
        }
        if (sceneMatchCount === 1) {
          this.history.back = this.history.at;
          this.history.at = sceneName;
          this.scene = this.scenes[sceneName];
          this.scene.event.call(this) != null;
          this.prompt(this.scene.describe(this.haveBeen()));
          return this.history.been[sceneName] = true;
        } else {
          return this.prompt("Can you be more specific?");
        }
      } else {
        return this.prompt("You can't go there from here.");
      }
    };

    Adventure.prototype.use = function(object, target) {
      if (target != null) {
        return this.narrate("You use the " + object + " on " + target);
      } else {
        return this.narrate("You use the " + object);
      }
    };

    Adventure.prototype.haveBeen = function(sceneName) {
      if (sceneName == null) {
        sceneName = this.history.at;
      }
      return this.history.been[sceneName] != null;
    };

    return Adventure;

  })();

  Scene = (function() {
    function Scene(options) {
      this.intro = options.intro;
      this.description = options.description;
      this.exits = options.exits;
      this.event = options.event || function() {
        return null;
      };
    }

    Scene.prototype.describe = function(been) {
      var output;
      if (been == null) {
        been = false;
      }
      if ((this.intro != null) && !been) {
        output = "\n" + this.intro;
      } else {
        output = "\n" + this.description;
      }
      if (this.exits != null) {
        output += "\n\nExits are **" + (this.exits.join("**, **")) + "**.";
      }
      return output;
    };

    return Scene;

  })();

  Item = (function() {
    function Item(options) {
      this.name = options.name;
    }

    return Item;

  })();

  Character = (function() {
    function Character(options) {
      this.name = options.name;
    }

    return Character;

  })();

  Story = (function(_super) {
    __extends(Story, _super);

    function Story() {
      _ref = Story.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Story.prototype.firstScene = "car 2";

    Story.prototype.scenes = {
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
    };

    Story.prototype.cast = {
      "cat": new Character({
        name: "Moonbeam"
      }),
      "monkey": new Character({
        name: "Monkey"
      })
    };

    Story.prototype.inventory = {
      "wrench": new Item({
        name: "wrench"
      })
    };

    Story.prototype.actions = {
      help: {
        pattern: /help/i,
        deed: function(match) {
          this.narrate("Commands are 'go', 'pick up', 'use', 'look', and 'help'");
          return this.prompt(this.scene.describe(this.haveBeen()));
        }
      },
      look: {
        pattern: /where(( am i| are we)\??)?|look( at( the)?)?( (.*))?/i,
        deed: function(match) {
          if (match[6] != null) {
            return this.prompt("You look right at " + match[6]);
          } else {
            return this.prompt(this.scene.describe(this.haveBeen()));
          }
        }
      },
      pickUp: {
        pattern: /pick up( ([0-9]+|the|a|some|an|all))? (.*)/i,
        deed: function(match) {
          var article, object;
          article = match[2] || "the";
          object = match[3];
          return this.prompt("You pick up " + article + " " + object + ".");
        }
      },
      go: {
        pattern: /go( (to( the)?))? (.*)\.?/i,
        deed: function(match) {
          return this.go(match[4]);
        }
      },
      use: {
        pattern: /use (.*?)(( (with|on) )?(.*))/i,
        deed: function(match) {
          var object, target;
          object = match[1] ? match[1] : match[5];
          if (match[1]) {
            target = match[5];
          }
          this.use(object, target);
          return this.prompt();
        }
      },
      restart: {
        pattern: /restart/i,
        deed: function() {
          return this.start();
        }
      },
      say: {
        pattern: /say (.*)/i,
        deed: function(match) {
          return this.prompt("\"" + match[1] + "\"");
        }
      }
    };

    return Story;

  })(Adventure);

  NodeInterface = (function() {
    function NodeInterface() {}

    NodeInterface.prototype.print = function(string) {
      process.stdin.resume();
      return process.stdout.write("" + string + "\n");
    };

    NodeInterface.prototype.read = function(callback) {
      process.stdout.write("> ");
      return process.stdin.once("data", function(data) {
        return callback(data.toString().trim());
      });
    };

    return NodeInterface;

  })();

  new Story({
    "interface": new NodeInterface
  });

}).call(this);
