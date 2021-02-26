let ball = document.querySelector('.ball')
const action = document.querySelector('.action')
const gameOverLabel = document.getElementById('game-over-label')
const startLabel = document.getElementById('start-label')
const scoreLabel = document.getElementById('score')
const highScoreLabel = document.getElementById('high-score')
const layers = document.querySelectorAll('.layer')
const nameModal = document.querySelector('.modal')
const nameBtn = document.querySelector('.name-btn')
let isInAir = false
let gravity = 0.9
let isGameOver = true
let isGameReady = false
let position = 0
let highScore = 0
let score = 0
let speedCoefficient = 1
let playerName

let speedUpTimeoutId
let allTimeouts = []
let allIntervals = []

const oldScore = localStorage.getItem('score')
if (oldScore) {
    highScore = oldScore
    highScoreLabel.innerHTML = `High score: ${oldScore}`
}

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
    console.log(ball)
    generateObstacles()
    speedUp()
    startLabel.style.display = 'none'
}

function jump() {
    let lastPosition = 100
    let jumpUpLoopId = setInterval(() => {
        if (ball) {
            let positionDifference = Math.abs(lastPosition - position)
            if (positionDifference < 1) {
                clearInterval(jumpUpLoopId)
                let fallDownLoopId = setInterval(() => {
                    position -= 10
                    position /= gravity
                    if (position <= 0) {
                        position = 0
                        clearInterval(fallDownLoopId)
                        isInAir = false
                    }
                    ball.style.bottom = position + 'px'
                }, 20)
            }

            // console.log('move up')
            lastPosition = position
            position += 10
            position *= gravity
            ball.style.bottom = position + 'px'
            // console.log(positionDifference)
        }
    }, 20)
}

function speedUp() {
    let randomTime = Math.random() * 5000 + 5000

    speedUpTimeoutId = setTimeout(() => {
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
        // console.log(hitCheckLoopId, ' is running')
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

function gameOver() {
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
    isGameOver = true
    while (action.firstChild) {
        action.removeChild(action.lastChild)
    }
    ball = null
    // clearInterval(passCheckLoopId)
    // clearTimeout(genTimeoutId)
    // clearTimeout(speedUpTimeoutId)

    if (score > highScore) {
        highScore = score
        highScoreLabel.innerHTML = `High score: ${highScore}`
        localStorage.setItem('score', highScore)
        postMaxScore()
    } else {
        isGameReady = true
        showScoreTable()
    }
}

//TODO
function showScoreTable() {
    // code here
}

function postMaxScore() {
    // code here
}

function generateBackground() {
    layers.forEach((layer, index, array) => {
        generateBackgroundLayer(layer, index, array.length)
    })
}

function generateBackgroundLayer(layer, index, arrayLength) {
    const indexFixed = index + 1
    const zIndex = indexFixed
    // console.log(arrayLength)
    const randomTime = Math.random() * 20 + (2000 / indexFixed) * indexFixed
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

    let moveLoopId = setInterval(() => {
        backgroundElementPosition -= 2 * speedCoefficient
        backgroundElement.style.left = backgroundElementPosition + 'px'
    }, 30 / indexFixed)
    // allIntervals.push(moveLoopId)

    let passCheckLoopId = setInterval(() => {
        if (backgroundElementPosition < -500 * indexFixed) {
            layer.removeChild(backgroundElement)
            clearInterval(passCheckLoopId)
            clearInterval(moveLoopId)
            // allIntervals = allIntervals.filter(id => id !== passCheckLoopId)
        }
    }, 50)
    // allIntervals.push(passCheckLoopId)

    let genTimeoutId = setTimeout(() => {
        generateBackgroundLayer(layer, index, arrayLength)
    }, randomTime)
    // allTimeouts.push(genTimeoutId)
}

function setPlayerName() {
    playerName = document.getElementById('name').value
    nameModal.style.display = 'none'
    isGameReady = true
    startLabel.style.display = 'block'
}

document.addEventListener('keydown', control)
// document.addEventListener('keyup', control)
nameBtn.addEventListener('click', setPlayerName)

// generateObstacles()
generateBackground()
// speedUp()
