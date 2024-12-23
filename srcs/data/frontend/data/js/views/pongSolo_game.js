export { canvas } from './pong.js'; // space game
import {fetchUserGameSettings} from './menuPong.js';
import { getCookie } from './utils.js';
import { inGameSolo } from './pongSolo.js';
import { setIngameSolo } from './pongSolo.js';


// export var game; // statut game
export var anim;

const colorMapping = {
	'black': '#000000',
	'white': '#fdfefe',
	'purple': '#7d3c98',
	'pink': '#FFC0CB',
	'yellow': '#f4d03f',
	'green': '#229954',
	'gray': '#a6acaf',
	'blue': '#1a5276',
	'lila': '#d7bde2',
	'red': '#c0392b',
	'brown': '#873600',
	'green_light': '#58d68d',
	'blue_light': '#85c1e9'
};

var game = {
	player: {
		score: 0
	},
	computer: {
		score: 0,
		speedRatio: 0.75
	},
	ball: {
		r: 5,
		speed: {}
	}
};

const PLAYER_HEIGHT = 100;
const PLAYER_WIDTH = 5;
const MAX_SPEED = 10;
const PLAYER_SPEED = 9;

var playerMovingUp = false;
var playerMovingDown = false;
var escapeDown = false;
export let GameOn = false;
var spaceDown = false;

var background_color_key;
var pads_color_key;
var ball_color_key;

async function get_gameSettings_drawing() {
    const response = await fetch('/api/game_settings/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    background_color_key = data.background_game;
    pads_color_key = data.pads_color;
    ball_color_key = data.ball_color;
}

export async function initialize_color() {
    await get_gameSettings_drawing();

}

export async function draw() {
    if (!document.getElementById('canvas')) {
        return;
    }

    var context = canvas.getContext('2d');

	const background_color  = colorMapping[background_color_key] || "#000";
    const pads_color = colorMapping[pads_color_key] || "#fdfefe";
    const ball_color =colorMapping[ball_color_key] || "#fdfefe";

	context.fillStyle = background_color;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw middle line
    context.strokeStyle = 'white'; //Line middle
    context.beginPath();
    context.moveTo(canvas.width / 2, 0);
    context.lineTo(canvas.width / 2, canvas.height);
    context.stroke();

    // draw player
    context.fillStyle = pads_color; //Pads
    context.fillRect(0, game.player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    context.fillRect(canvas.width - PLAYER_WIDTH, game.computer.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    // Draw ball
    context.beginPath();
    context.fillStyle = ball_color; // balls
    context.arc(game.ball.x, game.ball.y, game.ball.r, 0, Math.PI * 2, false);
    context.fill();
}

export function changeDirection(playerPosition) {
    var impact = game.ball.y - playerPosition - PLAYER_HEIGHT / 2;
    var ratio = 100 / (PLAYER_HEIGHT / 2);

    // get value 0 and 10
    game.ball.speed.y = Math.round(impact * ratio / 10);
}

export function movePlayerWithKeyboard() {
    if (!document.getElementById('canvas')) {
        return;
    }

    if (playerMovingUp) {
        game.player.y -= PLAYER_SPEED;
    }
    if (playerMovingDown) {
        game.player.y += PLAYER_SPEED;
    }

    // player don't exit of canva
    if (game.player.y < 0) {
        game.player.y = 0;
    } else if (game.player.y > canvas.height - PLAYER_HEIGHT) {
        game.player.y = canvas.height - PLAYER_HEIGHT;
    }
}

export function computerMove() {
    game.computer.y += game.ball.speed.y * game.computer.speedRatio;
}

export function collide(player) {
    // The player does not hit the ball
    if (game.ball.y < player.y || game.ball.y > player.y + PLAYER_HEIGHT) {
        reset();

       if (!document.getElementById('#computer-score') || !document.getElementById('#player-score')) {
           return;
       }

        // Update score
        if (player == game.player) {
            game.computer.score++;
            document.querySelector('#computer-score').textContent = game.computer.score;
        } else {
            game.player.score++;
            document.querySelector('#player-score').textContent = game.player.score;
        }
    } else {
        // Change direction
        game.ball.speed.x *= -1;
        changeDirection(player.y);

        // Increase speed if it has not reached max speed
        if (Math.abs(game.ball.speed.x) < MAX_SPEED) {
            game.ball.speed.x *= 1.2;
        }
    }
}

export function ballMove() {
    if (!document.getElementById('canvas')) {
        return;
    }

    // Rebounds on top and bottom
    if (game.ball.y > canvas.height || game.ball.y < 0) {
        game.ball.speed.y *= -1;
    }

    if (game.ball.x > canvas.width - PLAYER_WIDTH) {
        collide(game.computer);
    } else if (game.ball.x < PLAYER_WIDTH) {
        collide(game.player);
    }

    game.ball.x += game.ball.speed.x;
    game.ball.y += game.ball.speed.y;
}

export async function play() {

    if (GameOn == false)
        setIngameSolo(true);
        GameOn = true;
    draw();
    movePlayerWithKeyboard();
    computerMove();
    ballMove();
    anim = requestAnimationFrame(play);
}

export function reset() {
    if (!document.getElementById('canvas')) {
        return;
    }

    // Set ball and players to the center
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    game.player.y = canvas.height / 2 - PLAYER_HEIGHT / 2;
    game.computer.y = canvas.height / 2 - PLAYER_HEIGHT / 2;

    // Reset speed
    game.ball.speed.x = 3;
    game.ball.speed.y = Math.random() * 3;
}

export function stop() {
    setIngameSolo(false);
    console.log('stop');
    cancelAnimationFrame(anim);
    reset();

    // Init score
    game.computer.score = 0;
    game.player.score = 0;

    if (document.getElementById('#computer-score') && document.getElementById('#player-score')) {
        document.querySelector('#computer-score').textContent = game.computer.score;
        document.querySelector('#player-score').textContent = game.player.score;
    }

    draw();
    GameOn = false;
}

// Key Down
export function handleKeyDown(event, startButton, stopButton) {

	if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W')
		playerMovingUp = true;
	if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S')
		playerMovingDown = true;
    // if (event.key === ' ' && GameOn == false) {
    //     play();
    //     spaceDown = true;
    //     startButton.disabled = true;
    //     stopButton.disabled = false;
    //     GameOn = true;
    // }
    // else if (event.key === ' ' && GameOn == true )
    // {
    //     spaceDown = true;
    //     stop();
    //     startButton.disabled = false;
    //     stopButton.disabled = true;
    // }
    // if (event.key === "Escape")
    // {
    //     escapeDown = true;
    //     stop();
    //     startButton.disabled = false;
    //     stopButton.disabled = true;
    // }
    // if (event.key === ' ' && !GameOn) {
    //     play();
    //     GameOn = true;
    // }
}

// Key Up
export function handleKeyUp(event) {

	if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W')
		playerMovingUp = false;
	if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S')
		playerMovingDown = false;
    // if (event.key === "Escape")
    //     escapeDown = false;
    // if (event.key === ' ')
    //     spaceDown = false;
}
