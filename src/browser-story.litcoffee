# an interface to play the game in the browser

    class BrowserInterface
      print: (markdown) ->
        log = document.getElementById "log"
        li = document.createElement "li"
        li.innerHTML = marked markdown
        log.appendChild li
      read: (callback) ->
        log = document.getElementById "log"
        field = document.createElement "li"
        field.setAttribute "contenteditable", "true"
        log.appendChild field
        field.onkeydown = (event) ->
          if event.keyCode is 13 # <ENTER>
            event.preventDefault()
            @innerHTML = "> #{@innerHTML}"
            @removeAttribute "contenteditable"
            callback @innerHTML
        field.focus()

    window.onload = () ->
      new Story {
        interface: new BrowserInterface
      }
