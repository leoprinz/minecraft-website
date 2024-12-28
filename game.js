// Szene, Kamera und Renderer erstellen
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Himmel und Beleuchtung
const skyColor = 0x87CEEB; // Hellblau
scene.background = new THREE.Color(skyColor);

// Natürlicheres Licht hinzufügen
const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.4); // Weiches Himmellicht
scene.add(hemisphereLight);

// Direktionale Beleuchtung für Sonneneffekt
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 50); // Sonnenposition
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048; // Schattendetails
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Schatten-Parameter setzen
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Optional: Umgebung für etwas diffuse Beleuchtung
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Setze Schattenwürfe für Blöcke und Objekte
const blockTypes = {
    grass: { texture: textureLoader.load('textures/grass.png') },
    sand: { texture: textureLoader.load('textures/sand.png') },
    water: { texture: textureLoader.load('textures/water.webp') },
    stone: { texture: textureLoader.load('textures/stone.png') },
    wood: { texture: textureLoader.load('textures/wood.png') },
    dirt: { texture: textureLoader.load('textures/dirt.webp') },
    lava: { texture: textureLoader.load('textures/lava.webp') },
    gold: { texture: textureLoader.load('textures/gold.png') },
    glass: { texture: textureLoader.load('textures/glass.png') },
    leaves: { texture: textureLoader.load('textures/leaves.png') },
};

function addBlock(x, y, z, type, textureOverride = null) {
    const geometry = new THREE.BoxGeometry();
    const texture = textureOverride || blockTypes[type].texture;
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    cube.castShadow = true; // Schattenerzeugung aktivieren
    cube.receiveShadow = true;
    scene.add(cube);
    blocks.push(cube);
}

// Fadenkreuz erstellen
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.width = '10px';
crosshair.style.height = '10px';
crosshair.style.backgroundColor = 'white';
crosshair.style.borderRadius = '50%';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.zIndex = '1000';
document.body.appendChild(crosshair);

// HUD - Inventar und Herzen erstellen
const hud = document.createElement('div');
hud.id = 'hud';
hud.style.position = 'absolute';
hud.style.bottom = '0px';
hud.style.left = '50%';
hud.style.transform = 'translateX(-50%)';
hud.style.zIndex = '1000';
hud.style.display = 'flex';
hud.style.flexDirection = 'column';
hud.style.alignItems = 'center';

// Herzen hinzufügen
const heartsContainer = document.createElement('div');
heartsContainer.style.display = 'flex';
heartsContainer.style.marginBottom = '10px';
for (let i = 0; i < 10; i++) {
    const heart = document.createElement('div');
    heart.style.width = '20px';
    heart.style.height = '20px';
    heart.style.margin = '0 2px';
    heart.style.backgroundColor = 'red';
    heart.style.borderRadius = '50%';
    heart.style.border = '2px solid white';
    heartsContainer.appendChild(heart);
}
hud.appendChild(heartsContainer);

// Inventar hinzufügen
const inventoryContainer = document.createElement('div');
inventoryContainer.style.display = 'flex';
inventoryContainer.style.padding = '10px';
inventoryContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
inventoryContainer.style.borderRadius = '10px';

const textureLoader = new THREE.TextureLoader();
const inventorySlots = Object.keys(blockTypes);
let selectedSlot = 0;

inventorySlots.forEach((type, index) => {
    const slot = document.createElement('div');
    slot.style.width = '40px';
    slot.style.height = '40px';
    slot.style.margin = '0 5px';
    slot.style.backgroundColor = '#000';
    slot.style.border = index === selectedSlot ? '3px solid yellow' : '1px solid white';
    slot.style.transition = 'transform 0.1s';
    inventoryContainer.appendChild(slot);
});

function updateInventoryUI() {
    Array.from(inventoryContainer.children).forEach((slot, index) => {
        slot.style.border = index === selectedSlot ? '3px solid yellow' : '1px solid white';
        slot.style.transform = index === selectedSlot ? 'scale(1.1)' : 'scale(1)';
    });
}
hud.appendChild(inventoryContainer);
document.body.appendChild(hud);

window.addEventListener('keydown', (e) => {
    const key = parseInt(e.key);
    if (!isNaN(key) && key >= 1 && key <= inventorySlots.length) {
        selectedSlot = key - 1;
        updateInventoryUI();
    }
});

document.addEventListener('click', () => {
    if (!document.pointerLockElement) {
        document.body.requestPointerLock();
    }
});

const worldSize = 40;

function generateWorld() {
    for (let x = -worldSize; x < worldSize; x++) {
        for (let z = -worldSize; z < worldSize; z++) {
            addBlock(x, 0, z, 'grass');
            if (Math.random() < 0.02) {
                addTree(x, 1, z);
            }
        }
    }
}

const blocks = [];
function addTree(x, y, z) {
    const trunkHeight = Math.floor(Math.random() * 2) + 4;
    for (let i = 0; i < trunkHeight; i++) {
        addBlock(x, y + i, z, 'wood');
    }

    const startLeavesY = y + trunkHeight - 1;
    const layers = [
        { size: 5, yOffset: 0, removeCorners: false },
        { size: 5, yOffset: 1, removeCorners: true },
        { size: 3, yOffset: 2, removeCorners: false },
    ];

    layers.forEach(layer => {
        const halfSize = Math.floor(layer.size / 2);
        for (let dx = -halfSize; dx <= halfSize; dx++) {
            for (let dz = -halfSize; dz <= halfSize; dz++) {
                if (layer.removeCorners && Math.abs(dx) === halfSize && Math.abs(dz) === halfSize) continue;
                addBlock(x + dx, startLeavesY + layer.yOffset, z + dz, 'leaves');
            }
        }
    });
}

const player = {
    x: 0,
    y: 2,
    z: 5,
    pitch: 0,
    yaw: 0,
    velocityY: 0,
    height: 2.5,
    width: 0.1,
    isCrouching: false,
};
const moveSpeed = 0.1;
const sprintSpeed = 0.2; // Sprintgeschwindigkeit
const crouchHeight = 1.25; // Hockhöhe
const jumpSpeed = 0.2;
const gravity = -0.02;
let canJump = true;
const keys = {};

document.addEventListener('keydown', (event) => { keys[event.key] = true; });
document.addEventListener('keyup', (event) => { keys[event.key] = false; });

function checkCollisions(x, y, z) {
    const playerBox = new THREE.Box3(
        new THREE.Vector3(x - player.width, y, z - player.width),
        new THREE.Vector3(x + player.width, y + player.height, z + player.width)
    );

    for (const block of blocks) {
        const box = new THREE.Box3().setFromObject(block);
        if (box.intersectsBox(playerBox)) {
            return box;
        }
    }
    return null;
}

function updatePlayer() {
    let dx = 0, dz = 0;
    const currentMoveSpeed = keys['Shift'] ? sprintSpeed : moveSpeed;

    if (keys['w']) {
        dx -= currentMoveSpeed * Math.sin(player.yaw);
        dz -= currentMoveSpeed * Math.cos(player.yaw);
    }
    if (keys['s']) {
        dx += currentMoveSpeed * Math.sin(player.yaw);
        dz += currentMoveSpeed * Math.cos(player.yaw);
    }
    if (keys['a']) {
        dx -= currentMoveSpeed * Math.cos(player.yaw);
        dz += currentMoveSpeed * Math.sin(player.yaw);
    }
    if (keys['d']) {
        dx += currentMoveSpeed * Math.cos(player.yaw);
        dz -= currentMoveSpeed * Math.sin(player.yaw);
    }

    const newX = player.x + dx;
    const newZ = player.z + dz;

    const collisionBox = checkCollisions(newX, player.y, newZ);
    if (!collisionBox) {
        player.x = newX;
        player.z = newZ;
    }

    player.y += player.velocityY;
    player.velocityY += gravity;

    const groundCollision = checkCollisions(player.x, player.y, player.z);
    if (groundCollision) {
        player.velocityY = 0;
        canJump = true;
        const groundY = groundCollision.max.y;
        if (player.y < groundY + 0.1) {
            player.y = groundY + 0.0000001;
        }
    } else {
        canJump = false;
    }

    if (keys[' '] && canJump) {
        player.velocityY = jumpSpeed;
        canJump = false;
    }

    // Hocken
    if (keys['Control']) {
        player.height = crouchHeight;
        player.isCrouching = true;
    } else {
        player.height = 2.5;
        player.isCrouching = false;
    }

    camera.position.set(player.x, player.y + player.height / 2, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
}

const lookSpeed = 0.002;
function onMouseMove(event) {
    player.yaw -= event.movementX * lookSpeed;
    player.pitch -= event.movementY * lookSpeed;
    player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.pitch));
}
document.addEventListener('mousemove', onMouseMove);

const placementRange = 5;
function onMouseClick(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(blocks);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const position = intersect.point.clone().add(intersect.face.normal);

        const distance = position.distanceTo(new THREE.Vector3(player.x, player.y, player.z));
        if (distance <= placementRange) {
            if (event.button === 0) {
                const blockToRemove = intersects[0].object;
                scene.remove(blockToRemove);
                blocks.splice(blocks.indexOf(blockToRemove), 1);
            } else if (event.button === 2) {
                const blockPosition = position.clone().floor();

                const existingBlock = blocks.find(block => {
                    const blockPos = block.position;
                    return blockPos.x === blockPosition.x && blockPos.y === blockPosition.y && blockPos.z === blockPosition.z;
                });

                if (!existingBlock) {
                    addBlock(blockPosition.x, blockPosition.y, blockPosition.z, inventorySlots[selectedSlot]);
                }
            }
        }
    }
}
document.addEventListener('mousedown', onMouseClick);

function updateHUD() {
    updateInventoryUI();
}

function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    updateHUD();
    renderer.render(scene, camera);
}

generateWorld();
animate();
