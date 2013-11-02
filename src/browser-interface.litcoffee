# an interface to play the game in the browser

    class BrowserInterface extends AdventureInterface
      attach: (callback) ->
        oldOnload = window.onload
        window.onload = () ->
          oldOnload() if oldOnload?
          callback()
      print: (markdown) ->
        log = document.getElementById "log"
        li = document.createElement "li"
        li.className = "new"
        li.innerHTML = marked markdown
        log.appendChild li
      read: (callback) ->
        log = document.getElementById "log"
        field = document.createElement "li"
        field.className = "new"
        field.setAttribute "contenteditable", "true"
        log.appendChild field
        field.onkeydown = (event) ->
          if event.keyCode is 13 # <ENTER>
            event.preventDefault()
            @innerHTML = "> #{@innerHTML}"
            @removeAttribute "contenteditable"
            newLI = document.getElementsByClassName("new");
            li.className = li.className.replace(/(^| )new( |$)/, "") while li = newLI[0]
            callback @innerHTML
        field.focus()

    this.BrowserInterface = BrowserInterface
