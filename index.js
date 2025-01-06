const introMusic = new Audio("./music/introSong.mp3");
const shootingSound = new Audio("./music/shoooting.mp3");
const killEnemySound = new Audio("./music/killEnemy.mp3");
const gameOverSound = new Audio("./music/gameOver.mp3");
const heavyWeaponSound = new Audio("./music/heavyWeapon.mp3");
const hugeWeaponSound = new Audio("./music/hugeWeapon.mp3");

const canvas = document.createElement("canvas");
const gameArea = document.getElementById("gameArea");
gameArea.appendChild(canvas);
canvas.width = innerWidth;
canvas.height = innerHeight;
const context = canvas.getContext("2d");

const lightWeaponDamage = 20;
const heavyWeaponDamage = 40;
const HUGE_WEAPON_COST = 50;
let difficulty = 1;
let playerScore = 0;
let lastUpdateTime = Date.now();
let gamePaused = false;

const scoreBoard = document.querySelector(".scoreBoard");
const difficultySelect = document.getElementById("difficulty");
const difficultyLevel = document.getElementById("difficultyLevel");
const startGameBtn = document.getElementById("startGame");
const restartGameBtn = document.getElementById("restartGame");
const controls = document.querySelector(".controls");
const hugeWeaponBtn = document.getElementById('hugeWeaponBtn');
const pauseGameBtn = document.getElementById('pauseGame');

const playerPosition = {
    x: canvas.width / 2,
    y: canvas.height / 2,
};

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fillStyle = this.color;
        context.fill();
    }
}

class Weapon {
    constructor(x, y, radius, color, velocity, damage) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.damage = damage;
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fillStyle = this.color;
        context.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class HugeWeapon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = "rgb(0, 255, 106)";
    }

    draw() {
        context.beginPath();
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, 200, canvas.height);
    }

    update() {
        this.draw();
        this.x += 20;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fillStyle = this.color;
        context.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

const friction = 0.98;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        context.save();
        context.globalAlpha = this.alpha;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fillStyle = this.color;
        context.fill();
        context.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

const player = new Player(playerPosition.x, playerPosition.y, 15, "white");
const weapons = [];
const hugeWeapons = [];
const enemies = [];
const particles = [];

function updateControlsVisibility() {
    if (playerScore >= HUGE_WEAPON_COST) {
        hugeWeaponBtn.style.display = 'block';
        if (!hugeWeaponBtn.classList.contains('pulse')) {
            hugeWeaponBtn.classList.add('pulse');
        }
    } else {
        hugeWeaponBtn.style.display = 'none';
        hugeWeaponBtn.classList.remove('pulse');
    }
}

hugeWeaponBtn.addEventListener('click', () => {
    if (playerScore >= HUGE_WEAPON_COST && !gamePaused) {
        playerScore -= HUGE_WEAPON_COST;
        scoreBoard.innerHTML = `Score: ${playerScore} | Difficulty: ${difficultyLevel.textContent}`;
        hugeWeaponSound.play();
        hugeWeapons.push(new HugeWeapon(0, 0));
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gamePaused) return;

    const touch = e.touches[0];
    shootingSound.play();

    const angle = Math.atan2(
        touch.clientY - canvas.height / 2,
        touch.clientX - canvas.width / 2
    );

    const velocity = {
        x: Math.cos(angle) * 6,
        y: Math.sin(angle) * 6,
    };

    weapons.push(
        new Weapon(
            canvas.width / 2,
            canvas.height / 2,
            6,
            "white",
            velocity,
            lightWeaponDamage
        )
    );
});

addEventListener("keypress", (e) => {
    if (e.key === " ") {
        if (gamePaused || playerScore < HUGE_WEAPON_COST) return;
        playerScore -= HUGE_WEAPON_COST;
        scoreBoard.innerHTML = `Score: ${playerScore} | Difficulty: ${difficultyLevel.textContent}`;
        hugeWeaponSound.play();
        hugeWeapons.push(new HugeWeapon(0, 0));
    }
});

pauseGameBtn.addEventListener('click', () => {
    gamePaused = !gamePaused;
    if (!gamePaused) {
        animation();
        pauseGameBtn.textContent = "Pause";
    } else {
        pauseGameBtn.textContent = "Resume";
    }
});

function startGame() {
    introMusic.pause();
    scoreBoard.style.display = "block";
    document.querySelector('.mobile-controls').style.display = "flex";
    startGameBtn.disabled = true;
    controls.classList.add("hidden");

    const userValue = difficultySelect.value;
    difficultyLevel.textContent = userValue;

    switch (userValue) {
        case "Easy":
            setInterval(spawnEnemy, 2000);
            difficulty = 3;
            break;
        case "Medium":
            setInterval(spawnEnemy, 1400);
            difficulty = 5;
            break;
        case "Hard":
            setInterval(spawnEnemy, 1000);
            difficulty = 8;
            break;
        case "Insane":
            setInterval(spawnEnemy, 700);
            difficulty = 12;
            break;
    }

    updateControlsVisibility();
    animation();
}

// document.addEventListener('touchmove', (e) => {
//     e.preventDefault();
// }, { passive: false });

// document.addEventListener('touchstart', (e) => {
//     if (e.target.tagName !== 'BUTTON') {
//         e.preventDefault();
//     }
// }, { passive: false });

const spawnEnemy = () => {
    const enemySize = Math.random() * (40 - 5) + 5;
    const enemyColor = `hsl(${Math.floor(Math.random() * 360)},100%,50%)`;
    let random;

    if (Math.random() < 0.5) {
        random = {
            x: Math.random() < 0.5 ? canvas.width + enemySize : 0 - enemySize,
            y: Math.random() * canvas.height,
        };
    } else {
        random = {
            x: Math.random() * canvas.width,
            y: Math.random() < 0.5 ? canvas.height + enemySize : 0 - enemySize,
        };
    }

    const angle = Math.atan2(
        canvas.height / 2 - random.y,
        canvas.width / 2 - random.x
    );

    const velocity = {
        x: Math.cos(angle) * difficulty,
        y: Math.sin(angle) * difficulty,
    };

    enemies.push(new Enemy(random.x, random.y, enemySize, enemyColor, velocity));
};

let animationId;

function animation() {
    if (gamePaused) return;
    animationId = requestAnimationFrame(animation);
    scoreBoard.innerHTML = `Score: ${playerScore} | Difficulty: ${difficultyLevel.textContent}`;
    context.fillStyle = "rgba(49, 49, 49,0.2)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    hugeWeapons.forEach((hugeWeapon, index) => {
        if (hugeWeapon.x > canvas.width) {
            hugeWeapons.splice(index, 1);
        } else {
            hugeWeapon.update();
        }
    });

    weapons.forEach((weapon, index) => {
        weapon.update();

        if (
            weapon.x + weapon.radius < 1 ||
            weapon.y + weapon.radius < 1 ||
            weapon.x - weapon.radius > canvas.width ||
            weapon.y - weapon.radius > canvas.height
        ) {
            weapons.splice(index, 1);
        }
    });

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        if (dist - player.radius - enemy.radius < 1) {
            cancelAnimationFrame(animationId);
            gameOverSound.play();
            return gameOverLoader();
        }

        hugeWeapons.forEach((hugeWeapon) => {
            const dist = hugeWeapon.x - enemy.x;
            if (dist <= 200 && dist >= -200) {
                playerScore += 10;
                setTimeout(() => {
                    killEnemySound.play();
                    enemies.splice(enemyIndex, 1);
                }, 0);
            }
        });

        weapons.forEach((weapon, weaponIndex) => {
            const dist = Math.hypot(weapon.x - enemy.x, weapon.y - enemy.y);
            if (dist - weapon.radius - enemy.radius < 1) {
                killEnemySound.play();

                if (enemy.radius > weapon.damage + 8) {
                    gsap.to(enemy, {
                        radius: enemy.radius - weapon.damage,
                    });
                    setTimeout(() => {
                        weapons.splice(weaponIndex, 1);
                    }, 0);
                } else {
                    for (let i = 0; i < enemy.radius * 3; i++) {
                        particles.push(
                            new Particle(weapon.x, weapon.y, Math.random() * 2, enemy.color, {
                                x: (Math.random() - 0.5) * (Math.random() * 7),
                                y: (Math.random() - 0.5) * (Math.random() * 7),
                            })
                        );
                    }
                    playerScore += 10;
                    scoreBoard.innerHTML = `Score: ${playerScore} | Difficulty: ${difficultyLevel.textContent}`;
                    setTimeout(() => {
                        enemies.splice(enemyIndex, 1);
                        weapons.splice(weaponIndex, 1);
                    }, 0);
                }
            }
        });
    });

    const currentTime = Date.now();
    if (currentTime - lastUpdateTime > 500) {
        updateControlsVisibility();
        lastUpdateTime = currentTime;
    }
}

const gameOverLoader = () => {
    const gameOverBanner = document.createElement("div");
    const gameOverBtn = document.createElement("button");
    const highScore = document.createElement("div");
    const finalScore = document.createElement("div");
    const finalDifficulty = document.createElement("div");


    finalScore.innerHTML = `Final Score: ${playerScore}`;


    finalDifficulty.innerHTML = `Level: ${difficultyLevel.textContent}`;


    highScore.innerHTML = `High Score: ${localStorage.getItem("highScore")
        ? localStorage.getItem("highScore")
        : playerScore
        }`;

    const oldHighScore =
        localStorage.getItem("highScore") && localStorage.getItem("highScore");

    if (oldHighScore < playerScore) {
        localStorage.setItem("highScore", playerScore);
        highScore.innerHTML = `High Score: ${playerScore}`;
    }

    gameOverBtn.innerText = "Play Again";
    gameOverBanner.appendChild(finalScore);
    gameOverBanner.appendChild(finalDifficulty);
    gameOverBanner.appendChild(highScore);
    gameOverBanner.appendChild(gameOverBtn);

    gameOverBtn.onclick = () => {
        window.location.reload();
    };

    gameOverBanner.classList.add("gameover");
    document.querySelector("body").appendChild(gameOverBanner);
};

startGameBtn.addEventListener("click", startGame);
restartGameBtn.addEventListener("click", () => window.location.reload());

canvas.addEventListener("click", (e) => {
    shootingSound.play();
    const angle = Math.atan2(
        e.clientY - canvas.height / 2,
        e.clientX - canvas.width / 2
    );
    const velocity = {
        x: Math.cos(angle) * 6,
        y: Math.sin(angle) * 6,
    };
    weapons.push(
        new Weapon(
            canvas.width / 2,
            canvas.height / 2,
            6,
            "white",
            velocity,
            lightWeaponDamage
        )
    );
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (playerScore <= 0) return;
    heavyWeaponSound.play();
    playerScore -= 2;
    scoreBoard.innerHTML = `Score: ${playerScore} | Difficulty: ${difficultyLevel.textContent}`;
    const angle = Math.atan2(
        e.clientY - canvas.height / 2,
        e.clientX - canvas.width / 2
    );
    const velocity = {
        x: Math.cos(angle) * 3,
        y: Math.sin(angle) * 3,
    };
    weapons.push(
        new Weapon(
            canvas.width / 2,
            canvas.height / 2,
            30,
            "cyan",
            velocity,
            heavyWeaponDamage
        )
    );
});

addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

addEventListener("resize", () => {
    window.location.reload();
});