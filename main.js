import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let container, clock;
let camera, scene, renderer;
let model, mixer, animations, runAction;
let ground, grid;
let gravity, jumpSpeed;
let enemies = [];
let enemy;
let posList, index, pos, heightList, heightIndex, height, distanceList, disIndex, distance;    
let enemySpeed;
let playing;
let blocker, instructions, scoreText;
let score;

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    gravity = 0.1;
    jumpSpeed = 0;
    enemySpeed = 0.1;
    score = 0;
    playing = false;

    blocker = document.getElementById( 'blocker' );
    instructions = document.getElementById( 'instructions' );
    scoreText = document.getElementById('score');

    initializeThreeJs();

    userInput();

    lighting();
    drawGround();
    loadModel();
    setEnemies();

    window.addEventListener( 'resize', onWindowResize );
}

function initializeThreeJs(){
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set(-15, 7, 0);
    camera.lookAt( 0, 2, 0 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xe0e0e0 );

    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );
}

function userInput(){
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft') {
            movePlayer(-1);
        } else if (event.key === 'ArrowRight') {
            movePlayer(1);    
        } 

        if (event.key === "Space"){
            setJump();
        }
    });


    instructions.addEventListener('click', function() {
        if (!playing) {
            playing = true;
            score = 0;
            blocker.style.display = 'none';
            instructions.style.display = 'none';
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function lighting(){
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 0, 20, 10 );
    scene.add( dirLight );
}

function drawGround(){
    ground = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 15 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    ground.rotation.x = - Math.PI / 2;
    ground.position.x = 450;
    scene.add(ground);

    //grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
    grid = new THREE.GridHelper( 200, 40);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );
}

function loadModel(){
    const loader = new GLTFLoader();
    loader.load( 'assets/models/RobotExpressive.glb', function ( gltf ) {
        model = gltf.scene;

        model.scale.set(0.5, 0.5, 0.5);
        model.position.y = 0.1;
        model.rotation.y = Math.PI/2;

        scene.add( model );

        animations = gltf.animations;
        mixer = new THREE.AnimationMixer( model );
        runAction = mixer.clipAction(animations[6]);

        runAction.play();
    })
}

function setEnemies(){
    for (let i=0; i<9; i++){
        enemy = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 1), new THREE.MeshBasicMaterial({color:0x00ff00}))
        
        distanceList = [50, 40, 30];
        disIndex = Math.floor(Math.random() * distanceList.length);
        distance = distanceList[disIndex];

        posList = [-3, 0, 3];
        index = Math.floor(Math.random() * posList.length);
        pos = posList[index];

        heightList = [3, 0];
        heightIndex = Math.floor(Math.random() * heightList.length);
        height = heightList[heightIndex];
    
        enemy.position.x = distance;
        enemy.position.z = pos;
        enemy.position.y = height;
        
        enemies.push(enemy);

        scene.add(enemy);
    }
}

function setJump(){
    if (jumpSpeed === 0){
        jumpSpeed = 1.3;
    }
}

function applyGravity(){
    jumpSpeed -= gravity;
    model.position.y += jumpSpeed;
}



function updateEnemies(){
    enemies.forEach(enemy => {
        enemy.position.x -= enemySpeed;
        
        if (enemy.position.x <= model.position.x - 10){
            distanceList = [50, 40, 30];
            disIndex = Math.floor(Math.random() * distanceList.length);
            distance = distanceList[disIndex];
    
            posList = [-3, 0, 3];
            index = Math.floor(Math.random() * posList.length);
            pos = posList[index];
    
            heightList = [3, 0];
            heightIndex = Math.floor(Math.random() * heightList.length);
            height = heightList[heightIndex];
        
            enemy.position.x = distance;
            enemy.position.z = pos;
            enemy.position.y = height;
        }  
    });
    grid.position.x -= 0.05;
    if (enemy.position.x <= model.position.x + 10  && enemy.position.x >= model.position.x + 8){
        grid.position.x = 100;
    }    
}

function movePlayer(direction){
    model.position.z += direction * 3;

    if (model.position.z >= 3){
        model.position.z = 3;
        camera.position.z = 3;
    }

    if (model.position.z <= -3){
        model.position.z = -3;
        camera.position.z = -3;
    }
    
    if (model.position.z < 3 && model.position.z > -3){
        camera.position.z = 0;
    }

}

function changeSpeed(){
    enemySpeed += 0.0001;
}

function enemyCollision() {
    const playerBox = new THREE.Box3().setFromObject(model);

    enemies.forEach((enemy) => {
        let enemyBox = new THREE.Box3().setFromObject(enemy);
    
        if (playerBox.intersectsBox(enemyBox)) {
            enemy.position.x = 100; // reset enemy position
            enemySpeed = 0.1;
            playing = false;
            blocker.style.display = 'block';
            instructions.style.display = 'flex';
        }
    });
}

function groundCollision(){
    if (model.position.y <= 0){
        jumpSpeed = 0;
        model.position.y = 0.1;
    }
}


function animate() {
    if (playing){
        const dt = clock.getDelta();
        if ( mixer ) mixer.update( dt );
        
        requestAnimationFrame(animate);

        score += enemySpeed;

        updateEnemies();
        changeSpeed();
        enemyCollision();
        applyGravity();
        groundCollision();

    }

    else {
        requestAnimationFrame( animate);
    }

    scoreText.innerHTML = Math.floor(score);
    
    renderer.render( scene, camera );
}


init();
animate();
