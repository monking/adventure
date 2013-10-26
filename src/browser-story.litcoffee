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
        field.setAttribute "contenteditable", "true"
        log.appendChild field
        field.onkeydown = (event) ->
          if event.keyCode is 13 # <ENTER>
            event.preventDefault()
            @innerHTML = "> #{@innerHTML}"
            @removeAttribute "contenteditable"
            adventure.act(@innerHTML) or adventure.prompt ""
        field.focus()

    window.onload = () ->
      new BrowserStory()
