# A generic interface to play the game, though not
# very well. Extend this class to play it in your
# desired environment

    class AdventureInterface
      constructor: (callback) ->
        callback()
      print: (markdown) ->
        console.log(markdown) if console?
      read: (callback) ->
        callback(window.prompt()) if window?

    this.AdventureInterface = AdventureInterface
