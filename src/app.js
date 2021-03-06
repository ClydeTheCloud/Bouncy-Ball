let ball = document.querySelector('.ball')
const action = document.querySelector('.action')
const layers = document.querySelectorAll('.layer')
const tapZone = document.querySelector('.tap-zone')
const wrapper = document.querySelector('.wrapper')
const gameView = document.querySelector('.game-view')

// Labels
const playerNameLabel = document.querySelector('.player-name')
const gameOverLabel = document.getElementById('game-over-label')
const startLabel = document.getElementById('start-label')
const warningLabel = document.querySelector('.warning')
const scoreLabel = document.getElementById('score')
const highScoreLabel = document.getElementById('high-score')

// Menu
const changeNameBtn = document.querySelector('.change-name-btn')
const leaderboardBtn = document.querySelector('.leaderboard-btn')
const settingsElement = document.querySelector('.settings')
const quialityBtn = document.querySelector('.quality-btn')

// Modals
const nameModal = document.querySelector('.modal-name')
const leaderboardModal = document.querySelector('.modal-leaderboard')
const leaderboardContent = document.querySelector('.leaderboard-wrapper')
const leaderboardPopup = document.querySelector('.modal-leaderboard .popup')
const nameBtn = document.querySelector('.name-btn')
const warningText = document.querySelector('.warning-text')
const closeLeaderboardBtn = document.querySelector('.close-leaderboard')

let isInAir = false
let gravity = 0.92
let isGameOver = true
let isGameReady = false
let position = 0
let highScore = 0
let score = 0
let speedCoefficient = 1
let playerName
let clickOrTouch = 'click'
let qualitySettings = localStorage.getItem('bouncy-quality') || 'high'

quialityBtn.textContent = `Quality: ${qualitySettings}`

let allTimeouts = []
let allObstacles = []
let backgroundTimeouts = []

const leaderboardAPI = '/score/'

// check for touchscreen, adapt for mobile if found
if ('ontouchstart' in document.documentElement) {
    clickOrTouch = 'touchstart'
    tapZone.style.display = 'flex'
    startLabel.innerHTML = '<h2>Tap to start</h2>'
    tapZone.addEventListener('touchstart', control)
    tapZone.innerHTML = 'Start'
} else {
    document.addEventListener('keydown', control)
}

function control(e) {
    if (clickOrTouch === 'touchstart' || (clickOrTouch === 'click' && e.key === ' ')) {
        e.preventDefault()
        if (isGameOver && isGameReady) {
            restart()
        } else if (!isInAir && !isGameOver) {
            jump()
        }
    }
}

function restart() {
    score = 0
    scoreLabel.innerHTML = `Score: ${score}`
    position = 0
    isInAir = false
    speedCoefficient = 1
    isGameOver = false
    isGameReady = false
    gameOverLabel.style.display = 'none'
    tapZone.innerHTML = 'Jump'
    if (!ball) {
        const newBall = document.createElement('div')
        for (let i = 0; i < 4; i++) {
            const quarter = document.createElement('div')
            quarter.classList.add('quarter')
            newBall.appendChild(quarter)
        }
        newBall.classList.add('ball')
        action.appendChild(newBall)
        ball = newBall
    }
    generateObstacles()
    speedUp()
    startLabel.style.display = 'none'
    settingsElement.style.display = 'none'
}

function jump() {
    const baseMovementRate = 0.7
    let start
    let previousTotalAnimationTime
    isInAir = true
    let prevPosition = -10
    let positionDifference

    function goUp(timestamp) {
        if (ball) {
            if (start === undefined) {
                start = timestamp
                previousTotalAnimationTime = 0
            }
            const totalAnimationTime = timestamp - start
            const timeToRenderFrame = totalAnimationTime - previousTotalAnimationTime
            const step = baseMovementRate * timeToRenderFrame

            position += step
            position *= gravity
            ball.style.bottom = position + 'px'

            positionDifference = position - prevPosition

            if (positionDifference > baseMovementRate && position < 200) {
                requestAnimationFrame(goUp)
            } else {
                requestAnimationFrame(fallDown)
            }
            prevPosition = position
            previousTotalAnimationTime = totalAnimationTime
        }
    }

    function fallDown(timestamp) {
        if (ball) {
            const totalAnimationTime = timestamp - start
            const timeToRenderFrame = totalAnimationTime - previousTotalAnimationTime
            const step = baseMovementRate * timeToRenderFrame

            position -= step
            position /= gravity
            if (position <= 0) {
                position = 0
                isInAir = false
                ball.style.bottom = position + 'px'
                return
            }
            ball.style.bottom = position + 'px'
            requestAnimationFrame(fallDown)
            previousTotalAnimationTime = totalAnimationTime
        }
    }

    requestAnimationFrame(goUp)
}

function speedUp() {
    let randomTime = Math.random() * 5000 + 5000

    let speedUpTimeoutId = setTimeout(() => {
        if (!isGameOver) {
            speedCoefficient = (Number(speedCoefficient) + 0.1).toFixed(1)
            speedUp()
            allTimeouts = allTimeouts.filter(id => id !== speedUpTimeoutId)
        }
    }, randomTime)
    allTimeouts.push(speedUpTimeoutId)
}

function generateObstacles() {
    let randomTime = Math.random() * 3000 + 1000
    let obstaclePosition = 1000
    let start
    let previousTotalAnimationTime
    let animationId

    const obstacle = document.createElement('div')
    obstacle.classList.add('obstacle')
    obstacle.classList.add(qualitySettings)
    action.appendChild(obstacle)
    obstacle.style.left = obstaclePosition + 'px'

    function moveObstacle(timestamp) {
        if (start === undefined) {
            start = timestamp
            previousTotalAnimationTime = 0
        }
        const totalAnimationTime = timestamp - start
        const timeToRenderFrame = totalAnimationTime - previousTotalAnimationTime
        const step = 0.5 * timeToRenderFrame * speedCoefficient

        if (obstaclePosition > -60 && obstaclePosition < 60 && position < 60) {
            gameOver()
            return
        } else if (obstaclePosition < -60) {
            allObstacles = allObstacles.filter(id => id !== animationId)
            action.removeChild(obstacle)
            score += 10 * speedCoefficient
            scoreLabel.innerHTML = `Score: ${score}`
            return
        }

        obstaclePosition -= step
        obstacle.style.left = obstaclePosition + 'px'

        allObstacles = allObstacles.filter(id => id !== animationId)
        animationId = requestAnimationFrame(moveObstacle)
        allObstacles.push(animationId)
        previousTotalAnimationTime = totalAnimationTime
    }

    animationId = requestAnimationFrame(moveObstacle)
    allObstacles.push(animationId)

    let genTimeoutId = setTimeout(() => {
        if (!isGameOver) {
            generateObstacles()
            allTimeouts = allTimeouts.filter(id => id !== genTimeoutId)
        }
    }, randomTime)
    allTimeouts.push(genTimeoutId)
}

async function gameOver() {
    allTimeouts.forEach(id => {
        clearTimeout(id)
    })
    allTimeouts = []

    allObstacles.forEach(id => {
        cancelAnimationFrame(id)
    })
    allObstacles = []

    gameOverLabel.style.display = 'flex'
    startLabel.style.display = 'block'
    settingsElement.style.display = 'flex'
    isGameOver = true
    while (action.firstChild) {
        action.removeChild(action.lastChild)
    }
    ball = null
    tapZone.innerHTML = 'Start'
    if (score > highScore) {
        isGameReady = false
        leaderboardModal.style.display = 'flex'
        leaderboardContent.innerHTML = '<p>Loading, please wait...</p>'

        const newLeaderboard = await postHighScore()
        showLeaderboard(newLeaderboard.leaderboard, newLeaderboard.personal)
    } else {
        isGameReady = true
    }
}

async function postHighScore() {
    const response = await fetch(leaderboardAPI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName, score: score }),
    })
        .then(res => res.json())
        .catch(err => {
            showError(err)
        })

    highScore = response.personal.score
    highScoreLabel.innerHTML = `High score: ${highScore}`

    return response
}

function fetchLeaderboard() {
    leaderboardContent.innerHTML = '<p>Loading, please wait...</p>'

    fetch(leaderboardAPI)
        .then(res => res.json())
        .then(data => showLeaderboard(data))
        .catch(err => {
            showError(err)
        })
}

function openLeaderboardModal(e) {
    e.stopPropagation()
    isGameReady = false
    leaderboardModal.style.display = 'flex'
    fetchLeaderboard()
}

function showLeaderboard(leaderboard, player) {
    if (typeof leaderboard === 'object') {
        leaderboardTable = generateTable(leaderboard)
        leaderboardContent.innerHTML = ''
        leaderboardContent.appendChild(leaderboardTable)

        if (player) {
            if (player.position < 11) {
                const position = document.querySelector(`.modal-leaderboard tbody tr:nth-child(${player.position})`)
                position.classList.add('player-in-leaderboard')
            } else {
                const tableBody = document.querySelector('.modal-leaderboard tbody')
                const playerOutOfLeaderboard = document.createElement('tr')
                const playerPosition = document.createElement('td')
                playerPosition.innerText = player.position
                const playerName = document.createElement('td')
                playerName.innerText = player.name
                const playerScore = document.createElement('td')
                playerScore.innerText = player.score
                playerOutOfLeaderboard.appendChild(playerPosition)
                playerOutOfLeaderboard.appendChild(playerName)
                playerOutOfLeaderboard.appendChild(playerScore)
                tableBody.appendChild(playerOutOfLeaderboard)
            }
        }
    } else if (typeof leaderboard === 'string') {
        leaderboardContent.innerHTML = `<h2>${leaderboard}</h2>`
    }
}

function closeLeaderboardModal(e) {
    e.stopPropagation()
    leaderboardModal.style.display = 'none'
    isGameReady = true
}

function generateTable(leaderboard) {
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    table.appendChild(thead)
    const tr = document.createElement('tr')
    thead.appendChild(tr)
    const thPosition = document.createElement('th')
    thPosition.innerText = '#:'
    const thName = document.createElement('th')
    thName.innerText = 'Name:'
    const thScore = document.createElement('th')
    thScore.innerText = 'Score:'
    tr.appendChild(thPosition)
    tr.appendChild(thName)
    tr.appendChild(thScore)
    const tbody = document.createElement('tbody')
    table.appendChild(tbody)
    leaderboard.forEach((record, index) => {
        const tr = document.createElement('tr')
        const tdPosition = document.createElement('td')
        tdPosition.innerText = index + 1
        const tdName = document.createElement('td')
        tdName.innerText = record.name
        const tdScore = document.createElement('td')
        tdScore.innerText = record.score
        tr.appendChild(tdPosition)
        tr.appendChild(tdName)
        tr.appendChild(tdScore)
        tbody.appendChild(tr)
    })
    return table
}

function getPersonalHighScore(name) {
    fetch(`${leaderboardAPI}/${name}/`)
        .then(res => res.json())
        .then(data => {
            if (data.score) {
                highScore = data.score
                highScoreLabel.innerHTML = `High score: ${highScore}`
            } else {
                highScore = 0
                highScoreLabel.innerHTML = `High score: none`
            }
        })
        .catch(err => {
            showError(err)
        })
}

function generateBackground() {
    layers.forEach((layer, index, array) => {
        generateBackgroundLayer(layer, index, array.length)
    })
}

function generateBackgroundLayer(layer, index, arrayLength) {
    const randomTime = (Math.random() * 2 + 2 / speedCoefficient) * 1000
    if (qualitySettings !== 'low') {
        const indexFixed = index + 1
        const timeToPassLayer = 30 / indexFixed / speedCoefficient
        let backgroundElementPosition = 1050
        const randomShadeOfGray = Math.round(Math.random() * 10 + 60) + 20 * indexFixed

        const backgroundElement = document.createElement('div')
        backgroundElement.classList.add('background-element')
        backgroundElement.classList.add(qualitySettings)
        layer.appendChild(backgroundElement)
        backgroundElement.style.left = backgroundElementPosition + 'px'
        backgroundElement.style.height = Math.round(Math.random() * 60 + 60) * indexFixed + 'px'
        backgroundElement.style.width = Math.round(Math.random() * 50 + 50) * indexFixed + 'px'
        backgroundElement.style.backgroundColor = `rgb(${randomShadeOfGray}, ${randomShadeOfGray}, ${randomShadeOfGray + 40})`
        backgroundElement.style.zIndex = indexFixed
        backgroundElement.style.padding = 10 * indexFixed + 'px'

        const numberOfRows = Math.round((parseInt(backgroundElement.style.height) - 25) / (30 * indexFixed))

        if (qualitySettings === 'high') {
            // create rows of windows
            for (let i = 0; i < numberOfRows; i++) {
                const row = document.createElement('div')
                row.classList.add('row')
                backgroundElement.appendChild(row)

                const columns = parseInt(backgroundElement.style.width) > 20 * indexFixed * 3 ? 3 : 2

                // create columns of windows
                for (let i = 0; i < columns; i++) {
                    const window = document.createElement('div')
                    window.classList.add('window')
                    window.style.height = 10 * indexFixed + 'px'
                    window.style.width = 10 * indexFixed + 'px'
                    row.appendChild(window)
                }
            }
        }

        backgroundElement.style.animationDuration = timeToPassLayer + 's'

        let backgroundTimoutId = setTimeout(() => {
            layer.removeChild(backgroundElement)
            backgroundTimeouts.filter(id => id !== backgroundTimoutId)
        }, timeToPassLayer * 1000)
        backgroundTimeouts.push(backgroundTimoutId)
    }

    setTimeout(() => {
        generateBackgroundLayer(layer, index, arrayLength)
    }, randomTime)
}

function setPlayerName(e) {
    e.preventDefault()
    const newName = document.getElementById('name').value.trim()
    const nameRegExp = new RegExp(/^[a-z0-9]+$/i)

    let isValidName = nameRegExp.test(newName)
    let isNameLengthOk = newName.length > 2 && newName.length < 14

    if (isValidName && isNameLengthOk) {
        playerName = newName
        nameModal.style.display = 'none'
        isGameReady = true
        startLabel.style.display = 'block'
        settingsElement.style.display = 'flex'

        playerNameLabel.innerHTML = playerName
        getPersonalHighScore(playerName)
    } else if (!isValidName) {
        warningLabel.removeAttribute('hidden')
        warningText.innerHTML = 'Only letters and numbers are allowed.'
    } else {
        warningLabel.removeAttribute('hidden')
        warningText.innerHTML = 'Minimum 3, maximum 13 characters'
    }
    return false
}

function changeNameModal(e) {
    nameModal.style.display = 'flex'
    isGameReady = false
    startLabel.style.display = 'none'
    settingsElement.style.display = 'none'
}

function showError(message) {
    const errorPopup = document.createElement('div')
    const gameWrapper = document.querySelector('.wrapper')
    errorPopup.innerHTML = `<p>Something went wrong: ${message}</p>`
    errorPopup.classList.add('error-popup')
    gameWrapper.appendChild(errorPopup)

    setTimeout(() => {
        gameWrapper.removeChild(errorPopup)
    }, 5000)
}

function changeQuality(e) {
    e.stopPropagation()
    if (qualitySettings === 'low') {
        qualitySettings = 'high'
        document.querySelectorAll('.background-element').forEach(b => b.classList.replace('low', 'high'))
    } else if (qualitySettings === 'mid') {
        qualitySettings = 'low'
        document.querySelectorAll('.background-element').forEach(b => b.remove())
        backgroundTimeouts.forEach(id => {
            clearTimeout(id)
        })
        backgroundTimeouts = []
    } else if (qualitySettings === 'high') {
        qualitySettings = 'mid'
        document.querySelectorAll('.window').forEach(w => w.remove())
        document.querySelectorAll('.background-element').forEach(b => b.classList.replace('high', 'mid'))
    }
    localStorage.setItem('bouncy-quality', qualitySettings)
    quialityBtn.textContent = `Quality: ${qualitySettings}`
}

nameBtn.addEventListener(clickOrTouch, setPlayerName)
changeNameBtn.addEventListener(clickOrTouch, changeNameModal)
leaderboardBtn.addEventListener(clickOrTouch, openLeaderboardModal)
closeLeaderboardBtn.addEventListener(clickOrTouch, closeLeaderboardModal)
quialityBtn.addEventListener(clickOrTouch, changeQuality)

// Fix for mobile

window.onresize = scaleGame

function scaleGame() {
    if (screen.width < 1000) {
        const windowWidth = screen.width
        wrapper.classList.add('fullscreen')
        const scaleAmount = windowWidth / 1100
        gameView.style.transform = `scale(${scaleAmount > 1 ? 1 : scaleAmount})`
        tapZone.style.transform = `scale(${scaleAmount > 1 ? 1 : scaleAmount}) translateY(-50%)`
    } else {
        wrapper.classList.remove('fullscreen')
        gameView.style.transform = ''
        tapZone.style.transform = 'translateY(-50%)'
    }
}

scaleGame()

generateBackground()
