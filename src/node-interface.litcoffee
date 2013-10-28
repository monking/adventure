# an interface to play the game in the command line

    class NodeInterface
      constructor: (callback) ->
        callback()
      print: (string) ->
        process.stdin.resume()
        process.stdout.write "#{string}\n"
      read: (callback) ->
        process.stdout.write "> "
        process.stdin.once "data", (data) ->
          callback data.toString().trim()

    this.NodeInterface = NodeInterface
