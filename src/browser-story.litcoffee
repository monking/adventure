# This is the browser version of the app

    class BrowserStory extends Story
      narrate: (statement) ->
        log = document.getElementById "log"
        li = document.createElement "li"
        li.appendChild document.createTextNode(statement)
        log.appendChild li
      prompt: (statement) ->
        adventure = @
        @narrate statement
        log = document.getElementById "log"
        field = document.createElement "li"
        field.className = "entry"
        field.attributes.editable = true
        log.appendChild field
        log.onkeydown = (event) ->
          if event.keyCode is 13 # <ENTER>
            @removeAttribute "editable"
            adventure.act @innerHTML

    new BrowserStory()
