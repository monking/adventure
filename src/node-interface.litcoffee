# an interface to play the game in the command line

    class NodeInterface
      attach: (callback) ->
        callback()
      print: (string) ->
        process.stdout.write "#{string}\n"
      read: (callback) ->
        process.stdout.write "> "
        process.stdin.resume()
        process.stdin.once "data", (data) ->
          callback data.toString().trim()

    this.NodeInterface = NodeInterface
