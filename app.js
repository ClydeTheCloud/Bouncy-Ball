let ball = document.querySelector('.ball')
const action = document.querySelector('.action')
const layers = document.querySelectorAll('.layer')

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

// Modals
const nameModal = document.querySelector('.modal-name')
const leaderboardModal = document.querySelector('.modal-leaderboard')
const leaderboardContent = document.querySelector('.leaderboard-wrapper')
const nameBtn = document.querySelector('.name-btn')
const warningText = document.querySelector('.warning-text')
const closeLeaderboardBtn = document.querySelector('.close-leaderboard')

let isInAir = false
let gravity = 0.91
let isGameOver = true
let isGameReady = false
let position = 0
let highScore = 0
let score = 0
let speedCoefficient = 1
let playerName

let allTimeouts = []
let allIntervals = []

const leaderboardAPI = 'http://localhost:3001/score'

function control(e) {
    if (e.key === ' ' && isGameOver && isGameReady) {
        restart()
    } else if (e.key === ' ' && !isInAir && !isGameOver) {
        isInAir = true
        jump()
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
    let lastPosition = 100
    let jumpUpLoopId = setInterval(() => {
        if (ball) {
            let positionDifference = Math.abs(lastPosition - position)
            if (positionDifference < 1) {
                clearInterval(jumpUpLoopId)
                allIntervals = allIntervals.filter(id => id !== jumpUpLoopId)
                let fallDownLoopId = setInterval(() => {
                    if (ball) {
                        position -= 10
                        position /= gravity
                        if (position <= 0) {
                            position = 0
                            clearInterval(fallDownLoopId)
                            allIntervals = allIntervals.filter(id => id !== fallDownLoopId)
                            isInAir = false
                        }
                        ball.style.bottom = position + 'px'
                    }
                }, 20)
                allIntervals.push(fallDownLoopId)
            }

            lastPosition = position
            position += 10
            position *= gravity
            ball.style.bottom = position + 'px'
        }
    }, 20)
    allIntervals.push(jumpUpLoopId)
}

function speedUp() {
    let randomTime = Math.random() * 5000 + 5000

    let speedUpTimeoutId = setTimeout(() => {
        if (!isGameOver) {
            speedCoefficient = (Number(speedCoefficient) + 0.1).toFixed(1)
            speedUp()
            allTimeouts.filter(id => id !== speedUpTimeoutId)
        }
    }, randomTime)
    allTimeouts.push(speedUpTimeoutId)
}

function generateObstacles() {
    let randomTime = Math.random() * 3000 + 1000
    let obstaclePosition = 1000

    const obstacle = document.createElement('div')
    obstacle.classList.add('obstacle')
    action.appendChild(obstacle)
    obstacle.style.left = obstaclePosition + 'px'

    let hitCheckLoopId = setInterval(() => {
        if (obstaclePosition > 0 && obstaclePosition < 60 && position < 60) {
            gameOver()
            clearInterval(hitCheckLoopId)
        }
        obstaclePosition -= 2 * speedCoefficient
        obstacle.style.left = obstaclePosition + 'px'
    }, 2)
    allIntervals.push(hitCheckLoopId)

    let passCheckLoopId = setInterval(() => {
        if (obstaclePosition < -60) {
            action.removeChild(obstacle)
            score += 10 * speedCoefficient
            scoreLabel.innerHTML = `Score: ${score}`
            clearInterval(passCheckLoopId)
            clearInterval(hitCheckLoopId)
            allIntervals = allIntervals.filter(id => id !== passCheckLoopId)
        }
    }, 50)

    allIntervals.push(passCheckLoopId)

    let genTimeoutId = setTimeout(() => {
        if (!isGameOver) {
            generateObstacles()
            allTimeouts.filter(id => id !== genTimeoutId)
        }
    }, randomTime)
    allTimeouts.push(genTimeoutId)
}

async function gameOver() {
    allIntervals.forEach(id => {
        clearInterval(id)
    })
    allIntervals = []

    allTimeouts.forEach(id => {
        clearTimeout(id)
    })
    allTimeouts = []

    gameOverLabel.style.display = 'flex'
    startLabel.style.display = 'block'
    settingsElement.style.display = 'flex'
    isGameOver = true
    while (action.firstChild) {
        action.removeChild(action.lastChild)
    }
    ball = null
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

//TODO

async function postHighScore() {
    const response = await fetch(leaderboardAPI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName, score: score }),
    }).then(res => res.json())

    highScore = response.personal.score
    highScoreLabel.innerHTML = `High score: ${highScore}`

    return response
}

function fetchLeaderboard() {
    leaderboardContent.innerHTML = '<p>Loading, please wait...</p>'

    fetch(leaderboardAPI)
        .then(res => res.json())
        .then(data => showLeaderboard(data))
}

function openLeaderboardModal() {
    isGameReady = false
    leaderboardModal.style.display = 'flex'
    fetchLeaderboard()
}

function showLeaderboard(leaderboard, player) {
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
}

function closeLeaderboardModal() {
    leaderboardModal.style.display = 'none'
    isGameReady = true
}

function generateTable(leaderboard) {
    const table = document.createElement('table')
    const caption = document.createElement('caption')
    caption.innerText = 'Leaderboard'
    const thead = document.createElement('thead')
    table.appendChild(caption)
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
}

function generateBackground() {
    layers.forEach((layer, index, array) => {
        generateBackgroundLayer(layer, index, array.length)
    })
}

function generateBackgroundLayer(layer, index, arrayLength) {
    const indexFixed = index + 1
    const zIndex = indexFixed
    const randomTime = (Math.random() * 20 + (2000 / indexFixed) * indexFixed) / speedCoefficient
    let backgroundElementPosition = 1500
    const randomShadeOfGray = Math.round(Math.random() * 10 + 60) + 20 * indexFixed

    const backgroundElement = document.createElement('div')
    backgroundElement.classList.add('background-element')
    layer.appendChild(backgroundElement)
    backgroundElement.style.left = backgroundElementPosition + 'px'
    backgroundElement.style.height = Math.round(Math.random() * 60 + 60) * indexFixed + 'px'
    backgroundElement.style.width = Math.round(Math.random() * 50 + 50) * indexFixed + 'px'
    backgroundElement.style.backgroundColor = `rgb(${randomShadeOfGray}, ${randomShadeOfGray}, ${randomShadeOfGray + 40})`
    backgroundElement.style.zIndex = zIndex
    backgroundElement.style.padding = 10 * indexFixed + 'px'

    const numberOfRows = Math.round((parseInt(backgroundElement.style.height) - 25) / (30 * indexFixed))

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

    let moveLoopId = setInterval(() => {
        backgroundElementPosition -= 2 * speedCoefficient
        backgroundElement.style.left = backgroundElementPosition + 'px'
    }, 30 / indexFixed)

    let passCheckLoopId = setInterval(() => {
        if (backgroundElementPosition < -350 * indexFixed) {
            layer.removeChild(backgroundElement)
            clearInterval(passCheckLoopId)
            clearInterval(moveLoopId)
        }
    }, 50)

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
}

function changeNameModal() {
    nameModal.style.display = 'flex'
    isGameReady = false
    startLabel.style.display = 'none'
    settingsElement.style.display = 'none'
}

document.addEventListener('keydown', control)
nameBtn.addEventListener('click', setPlayerName)
changeNameBtn.addEventListener('click', changeNameModal)
leaderboardBtn.addEventListener('click', openLeaderboardModal)
closeLeaderboardBtn.addEventListener('click', closeLeaderboardModal)

generateBackground()
