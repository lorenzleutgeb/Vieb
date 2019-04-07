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
"use strict"

const { ipcRenderer } = require("electron")
const path = require("path")

let lastUpdate = new Date()

window.update = (action=null, downloadId=null) => {
    ipcRenderer.sendToHost("download-list-request", action, downloadId)
}

window.removeAll = () => {
    document.getElementById("list").textContent = ""
    window.update("removeall")
}

window.remove = id => {
    window.update("remove", id)
    document.getElementById("list").removeChild(
        document.querySelectorAll("#list .download")[id])
}

window.pause = id => {
    window.update("pause", id)
}

window.resume = id => {
    window.update("resume", id)
}

window.addEventListener("load", () => {
    const removeAll = document.createElement("img")
    removeAll.id = "remove-all"
    removeAll.style.display = "none"
    removeAll.src = path.join(__dirname, "../../img/trash.png")
    removeAll.setAttribute("onclick", "window.removeAll()")
    document.body.insertBefore(removeAll, document.body.firstChild)
    lastUpdate = new Date()
    setInterval(window.update, 500)
    window.update()
})

ipcRenderer.on("download-list", (e, list, unconfirmed) => {
    //unconfirmed
    const unconfirmedElement = document.getElementById("unconfirmed")
    if (unconfirmed) {
        unconfirmedElement.style.display = "flex"
        unconfirmedElement.querySelector(".name").textContent = unconfirmed.name
        unconfirmedElement.querySelector(".url").textContent = unconfirmed.url
    } else {
        unconfirmedElement.style.display = ""
    }
    //list
    const listOnPage = [...document.querySelectorAll("#list .download")]
    if (listOnPage.length === 0) {
        if (list.length === 0) {
            document.getElementById("list").textContent =
                "Nothing has been downloaded during the current session."
            const removeAll = document.getElementById("remove-all")
            removeAll.style.display = "none"
        } else {
            document.getElementById("list").textContent = ""
            const removeAll = document.getElementById("remove-all")
            removeAll.style.display = ""
        }
    }
    for (let i = 0;i < list.length;i++) {
        if (listOnPage[i] === undefined) {
            addDownload(list[i], i)
        } else {
            updateDownload(list[i], listOnPage[i], i)
        }
    }
    lastUpdate = new Date()
})

const addDownload = (download, id) => {
    const element = document.createElement("div")
    element.className = "download"
    // toggle pause and remove buttons
    const remove = document.createElement("img")
    remove.className = "remove"
    remove.src = path.join(__dirname, "../../img/trash.png")
    remove.setAttribute("onclick", `window.remove(${id})`)
    element.appendChild(remove)
    const togglePause = document.createElement("img")
    togglePause.className = "toggle-pause"
    togglePause.src = path.join(__dirname, "../../img/pause.png")
    togglePause.setAttribute("onclick", `window.pause(${id})`)
    element.appendChild(togglePause)
    // title
    const title = document.createElement("div")
    title.textContent = download.name
    title.className = "title"
    element.appendChild(title)
    // progress
    const progress = document.createElement("progress")
    if (download.current > download.total) {
        progress.max = download.current
    } else {
        progress.max = download.total
    }
    progress.value = download.current
    element.appendChild(progress)
    // change looks depending on the state
    if (download.state === "completed") {
        title.style.color = "lime"
        progress.style.display = "none"
        togglePause.style.display = "none"
    }
    if (download.state === "cancelled") {
        title.style.color = "red"
        progress.style.display = "none"
        togglePause.style.display = "none"
    }
    if (download.state === "paused") {
        title.style.color = "orange"
        togglePause.src = path.join(__dirname, "../../img/resume.png")
        togglePause.setAttribute("onclick", `window.resume(${id})`)
    }
    // other info
    const misc = document.createElement("div")
    misc.className = "misc"
    const state = document.createElement("span")
    state.className = "state"
    state.textContent = download.state
    misc.appendChild(state)
    const downloadUrl = document.createElement("a")
    downloadUrl.href = download.url
    downloadUrl.textContent = decodeURIComponent(download.url)
    misc.appendChild(downloadUrl)
    const file = document.createElement("span")
    file.textContent = download.file
    misc.appendChild(file)
    const date = document.createElement("span")
    date.textContent = formatDate(download.date)
    misc.appendChild(date)
    const speed = document.createElement("span")
    speed.className = "speed"
    if (download.total === 0) {
        speed.textContent = formatSize(download.current)
    } else {
        speed.textContent = formatSize(download.total)
    }
    misc.appendChild(speed)
    element.appendChild(misc)
    document.getElementById("list").appendChild(element)
}

const updateDownload = (download, element, id) => {
    const progress = element.querySelector("progress")
    // speed
    const timeSinceUpdate = ((new Date()).getTime() - lastUpdate) / 1000
    const speed = formatSize(
        (download.current - progress.value) / timeSinceUpdate)
    const done = download.state === "completed"
    if (download.total === 0) {
        if (done) {
            element.querySelector(".speed").textContent =
                formatSize(download.current)
        } else {
            element.querySelector(".speed").textContent =
                `${formatSize(download.current)} / ??? - ${speed}/s`
        }
    } else if (download.current === download.total || done) {
        element.querySelector(".speed").textContent = formatSize(download.total)
    } else if (download.current === progress.value) {
        element.querySelector(".speed").textContent =
            `${formatSize(download.current)} / ${formatSize(download.total)}`
    } else {
        element.querySelector(".speed").textContent =
            `${formatSize(download.current)} / ${formatSize(download.total)}
            - ${speed}/s`
    }
    // progress & title color
    if (download.current > download.total) {
        progress.max = download.current
    } else {
        progress.max = download.total
    }
    progress.value = download.current
    // change looks depending on the state
    const title = element.querySelector(".title")
    title.style.color = ""
    const togglePause = element.querySelector(".toggle-pause")
    const remove = element.querySelector(".remove")
    remove.setAttribute("onclick", `window.remove(${id})`)
    togglePause.src = path.join(__dirname, "../../img/pause.png")
    togglePause.setAttribute("onclick", `window.pause(${id})`)
    if (download.state === "completed") {
        title.style.color = "lime"
        progress.style.display = "none"
        togglePause.style.display = "none"
    }
    if (download.state === "cancelled") {
        title.style.color = "red"
        progress.style.display = "none"
        togglePause.style.display = "none"
    }
    if (download.state === "paused") {
        title.style.color = "orange"
        togglePause.src = path.join(__dirname, "../../img/resume.png")
        togglePause.setAttribute("onclick", `window.resume(${id})`)
    }
    // state
    element.querySelector(".state").textContent = download.state
}

const formatDate = date => {
    if (typeof date === "string") {
        date = new Date(date)
    }
    return `${date.toISOString().slice(0, -14)}
        ${date.toTimeString().slice(0, 8)}`
}

const formatSize = size => {
    if (size < 1024) {
        return size + " B"
    }
    const exp = Math.floor(Math.log(size) / Math.log(1024))
    return `${(size / Math.pow(1024, exp)).toFixed(2)} ${"KMGTPE"[exp - 1]}B`
}