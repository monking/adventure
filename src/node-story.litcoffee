# an interface to play the game in the command line

    class NodeStory extends Story
      narrate: (statement) ->
        process.stdin.resume()
        process.stdout.write "#{statement}\n"
      prompt: (statement) ->
        self = @
        @narrate "#{statement}\n"
        process.stdout.write ":"
        process.stdin.once "data", (data) ->
          self.act(data.toString().trim()) or self.prompt("")

    new NodeStory()
