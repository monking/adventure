(function() {
  var Adventure, AdventureInterface, BrowserInterface, Character, Item, NodeInterface, Scene,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Adventure = (function() {
    function Adventure(options) {
      var action, interfaceCallback, name, self, _ref;
      self = this;
      this.scenes = options.scenes || {};
      this.cast = options.cast || {};
      this.items = options.items || {};
      if (options.actions != null) {
        _ref = options.actions;
        for (name in _ref) {
          action = _ref[name];
          this.actions[name] = action;
        }
      }
      this.story = options.story;
      interfaceCallback = function() {
        return self.start();
      };
      if (options["interface"] != null) {
        this["interface"] = new options["interface"](interfaceCallback);
      } else {
        this["interface"] = new (typeof module !== "undefined" && module !== null ? NodeInterface : BrowserInterface)(interfaceCallback);
      }
      console.log(this["interface"]);
    }

    Adventure.prototype.start = function() {
      this.inventory = {};
      this.history = {
        been: {},
        at: null,
        back: null
      };
      this.scene = null;
      this.state = "breathing";
      return this.story();
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

    Adventure.prototype.actions = {
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

  this.Adventure = Adventure;

  this.Scene = Scene;

  this.Item = Item;

  this.Character = Character;

  AdventureInterface = (function() {
    function AdventureInterface(callback) {
      callback();
    }

    AdventureInterface.prototype.print = function(markdown) {
      if (typeof console !== "undefined" && console !== null) {
        return console.log(markdown);
      }
    };

    AdventureInterface.prototype.read = function(callback) {
      if (typeof window !== "undefined" && window !== null) {
        return callback(window.prompt());
      }
    };

    return AdventureInterface;

  })();

  this.AdventureInterface = AdventureInterface;

  NodeInterface = (function() {
    function NodeInterface(callback) {
      callback();
    }

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

  this.NodeInterface = NodeInterface;

  BrowserInterface = (function(_super) {
    __extends(BrowserInterface, _super);

    function BrowserInterface(callback) {
      var oldOnload;
      oldOnload = window.onload;
      window.onload = function() {
        if (oldOnload != null) {
          oldOnload();
        }
        return callback();
      };
    }

    BrowserInterface.prototype.print = function(markdown) {
      var li, log;
      log = document.getElementById("log");
      li = document.createElement("li");
      li.className = "new";
      li.innerHTML = marked(markdown);
      return log.appendChild(li);
    };

    BrowserInterface.prototype.read = function(callback) {
      var field, log;
      log = document.getElementById("log");
      field = document.createElement("li");
      field.className = "new";
      field.setAttribute("contenteditable", "true");
      log.appendChild(field);
      field.onkeydown = function(event) {
        var li, newLI;
        if (event.keyCode === 13) {
          event.preventDefault();
          this.innerHTML = "> " + this.innerHTML;
          this.removeAttribute("contenteditable");
          newLI = document.getElementsByClassName("new");
          while (li = newLI[0]) {
            li.className = li.className.replace(/(^| )new( |$)/, "");
          }
          return callback(this.innerHTML);
        }
      };
      return field.focus();
    };

    return BrowserInterface;

  })(AdventureInterface);

  this.BrowserInterface = BrowserInterface;

}).call(this);
