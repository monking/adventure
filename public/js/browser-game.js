(function() {
  var Adventure, BrowserStory, Character, Item, Scene, Story, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Adventure = (function() {
    function Adventure() {
      this.history = {
        been: {},
        at: null,
        back: null
      };
    }

    Adventure.prototype.narrate = function(statement) {
      return console.log(statement);
    };

    Adventure.prototype.act = function(statement) {
      var act, actionFound, match, pattern, _ref;
      actionFound = false;
      _ref = this.actions;
      for (act in _ref) {
        pattern = _ref[act];
        if (match = statement.match(pattern)) {
          this["action" + act](match);
          actionFound = true;
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
      if ((this.scene == null) || pattern.test(this.scene.exits.toString())) {
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
          this.scene.describe();
          return this.history.been[sceneName] = true;
        } else {
          return this.prompt("Can you be more specific?");
        }
      } else {
        return this.prompt("You can't go there from here.");
      }
    };

    Adventure.prototype.haveBeen = function(sceneName) {
      if (sceneName == null) {
        sceneName = this.history.at;
      }
      return this.history.been[sceneName] != null;
    };

    Adventure.prototype.prompt = function(statement) {
      var self;
      self = this;
      this.narrate("" + statement + "\n");
      process.stdout.write(":");
      return process.stdin.once("data", function(data) {
        return self.act(data.toString().trim()) || self.prompt("");
      });
    };

    return Adventure;

  })();

  Scene = (function() {
    function Scene(adventure, options) {
      this.adventure = adventure;
      this.intro = options.intro;
      this.description = options.description;
      this.exits = options.exits;
    }

    Scene.prototype.describe = function() {
      if ((this.intro != null) && !this.adventure.haveBeen()) {
        this.adventure.narrate("\n" + this.intro);
      } else {
        this.adventure.narrate("\n" + this.description);
      }
      if (this.exits != null) {
        return this.adventure.prompt("\nExits are " + (this.exits.join(", ")) + ".");
      }
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
      Story.__super__.constructor.call(this);
      this.scenes = {
        "car 1": new Scene(this, {
          description: "You are in car 1, just behind the locomotive engine.\n\nHuh. The scent is weaker here. You would have thought, closer to\nthe engine...",
          exits: ["car 2", "the tracks"]
        }),
        "car 2": new Scene(this, {
          intro: "In all the times that you've taken the train to the coast,\nyou've never noticed the smell of the train car before. It's not\nunpleasant now, but it's all you can think about: cigarettes,\ndisinfectant, and mechanical grease, like a motel set on top of\nan engine block.\n\nThere's another scent in there, now that you notice, that you\ncan't name right away. A vaguely dangerous, sharp note hanging in\nthe background. You've gradually sunk into your seat until you're\nactually quite uncomfortable, so you decide to get up and\nexplore.",
          description: "You are in car 2, and the strange scent is barely perceptible\nhere.",
          exits: ["car 1", "car 3", "the tracks"]
        }),
        "car 3": new Scene(this, {
          description: "You are in car 3. The smell is quite noticable here, and reminds\nyou of fireworks.",
          exits: ["car 2", "room 1", "the tracks"]
        }),
        "room 1": new Scene(this, {
          description: "This story's going somewhere, I promise.",
          exits: ["car 3", "window"]
        }),
        "the tracks": new Scene(this, {
          description: "What are you thinking? This is a moving train. You step out onto\nthe tracks as if you were alighting at the station, but a sleeper\nsnags your shoe at 70MPH and you are crushed and variously\ndestroyed by the train now leaving without most of you."
        }),
        "window": new Scene(this, {
          description: "!?\n\nOkay. You just leapt out of the window. About half a heartbeat\nafter your foot leaves the coping, your spinal cord insists that\nyou grab something, something firmly anchored to the ground, far\nfrom gnashing teeth and rocky ballast.\n\nBut there is nothing to grab but the fluid air, and your ego\ncalmly watches as your id scrambles to survive. I don't hope to\never learn what you wanted to achieve by this. You are dead."
        })
      };
      this.cast = {
        "cat": new Character({
          name: "Moonbeam"
        }),
        "monkey": new Character({
          name: "Monkey"
        })
      };
      this.inventory = {
        "wrench": new Item({
          name: "wrench"
        })
      };
      this.actions = {
        Help: /help/i,
        Look: /look/i,
        PickUp: /pick up( (the|a|some|an|all)) (.*)\.?/i,
        Go: /go( (to( the)?))? (.*)\.?/i,
        Use: /use (.*?)( (with|on) (.*))?/i
      };
      this.go("car 2");
    }

    Story.prototype.actionUse = function(match) {
      return this.narrate("somehow you expect to affect " + match[4] + " by using " + match[1]);
    };

    Story.prototype.actionGo = function(match) {
      return this.go(match[4]);
    };

    Story.prototype.actionHelp = function(match) {
      this.narrate("Commands are 'go', 'pick up', 'use', 'look', and 'help'");
      return this.scene.describe();
    };

    Story.prototype.actionLook = function(match) {
      return this.scene.describe();
    };

    Story.prototype.actionPickUp = function(match) {
      var article, object;
      article = match[2];
      object = match[3];
      this.narrate("You pick up " + article + " " + object + ".");
      return this.scene.describe();
    };

    return Story;

  })(Adventure);

  BrowserStory = (function(_super) {
    __extends(BrowserStory, _super);

    function BrowserStory() {
      _ref = BrowserStory.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BrowserStory.prototype.narrate = function(statement) {
      var li, log;
      log = document.getElementById("log");
      li = document.createElement("li");
      li.appendChild(document.createTextNode(statement));
      return log.appendChild(li);
    };

    BrowserStory.prototype.prompt = function(statement) {
      var adventure, field, log;
      adventure = this;
      this.narrate(statement);
      log = document.getElementById("log");
      field = document.createElement("li");
      field.className = "entry";
      field.attributes.editable = true;
      log.appendChild(field);
      return log.onkeydown = function(event) {
        if (event.keyCode === 13) {
          this.removeAttribute("editable");
          return adventure.act(this.innerHTML);
        }
      };
    };

    return BrowserStory;

  })(Story);

  new BrowserStory();

}).call(this);
