/*
* Vieb - Vim Inspired Electron Browser
* Copyright (C) 2019 Jelmer van Arnhem
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
/* global SETTINGS */
"use strict"

let suggestions = []
let originalValue = ""
let commandList = [
    "quit",
    "devtools",
    "reload",
    "version",
    "help",
    "help basics",
    "history",
    "downloads",
    "accept",
    "confirm",
    "reject",
    "deny"
]

const init = () => {
    commandList = commandList.concat(SETTINGS.suggestionList())
}

const prevSuggestion = () => {
    const list = [...document.querySelectorAll("#suggest-dropdown div")]
    if (list.length === 0) {
        return
    }
    const selected = document.querySelector("#suggest-dropdown div.selected")
    if (selected) {
        const id = list.indexOf(selected)
        list.forEach(l => {
            l.className = ""
        })
        if (id === 0) {
            document.getElementById("url").value = originalValue
        } else {
            list[id - 1].className = "selected"
            document.getElementById("url").value = suggestions[id - 1]
        }
    } else {
        originalValue = document.getElementById("url").value
        list.forEach(l => {
            l.className = ""
        })
        list[list.length - 1].className = "selected"
        document.getElementById("url").value = suggestions[list.length - 1]
    }
}

const nextSuggestion = () => {
    const list = [...document.querySelectorAll("#suggest-dropdown div")]
    if (list.length === 0) {
        return
    }
    const selected = document.querySelector("#suggest-dropdown div.selected")
    if (selected) {
        const id = list.indexOf(selected)
        list.forEach(l => {
            l.className = ""
        })
        if (id < list.length - 1) {
            list[id + 1].className = "selected"
            document.getElementById("url").value = suggestions[id + 1]
        } else {
            document.getElementById("url").value = originalValue
        }
    } else {
        originalValue = document.getElementById("url").value
        list.forEach(l => {
            l.className = ""
        })
        list[0].className = "selected"
        document.getElementById("url").value = suggestions[0]
    }
}

const cancelSuggestions = () => {
    document.getElementById("suggest-dropdown").textContent = ""
}

const clear = () => {
    suggestions = []
}

const addToList = suggestion => {
    suggestions.push(suggestion)
}

const includes = suggestion => {
    return suggestions.includes(suggestion)
}

const indexOf = suggestion => {
    return suggestions.indexOf(suggestion)
}

const addHist = hist => {
    if (suggestions.length > 20) {
        return
    }
    addToList(hist.url)
    const element = document.createElement("div")
    const title = document.createElement("span")
    title.className = "title"
    title.textContent = hist.title
    element.appendChild(title)
    element.appendChild(document.createTextNode(" - "))
    const url = document.createElement("span")
    url.className = "url"
    url.textContent = hist.url
    element.appendChild(url)
    document.getElementById("suggest-dropdown").appendChild(element)
}

const suggestCommand = search => {
    document.getElementById("suggest-dropdown").textContent = ""
    clear()
    if (search.startsWith(":")) {
        search = search.replace(":", "")
    }
    if (!SETTINGS.get("suggestCommands") || !search) {
        return
    }
    const possibleCommands = commandList.filter(c => {
        if (c.toLowerCase().startsWith(search.toLowerCase())) {
            if (c.toLowerCase().trim() !== search.toLowerCase().trim()) {
                return true
            }
        }
        return false
    })
    for (const command of possibleCommands.slice(0, 10)) {
        addCommand(command)
    }
}

const addCommand = command => {
    addToList(command)
    const element = document.createElement("div")
    element.textContent = command
    document.getElementById("suggest-dropdown").appendChild(element)
}

module.exports = {
    init,
    prevSuggestion,
    nextSuggestion,
    cancelSuggestions,
    clear,
    addToList,
    includes,
    indexOf,
    addHist,
    suggestCommand
}
