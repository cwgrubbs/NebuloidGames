window.addEventListener("load", function() {
    startGame();
}, false);

startGame = function(){
    var canvas, context;

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    var animate = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) { window.setTimeout(callback, 1000/60) };

    //"enums"
    var GameStates = Object.freeze({STATE_STARTUP: 0, STATE_RUN: 1, STATE_LOST: 2});
    var RunnerStates = Object.freeze({STATE_RUNNING: 0, STATE_SLIDING: 1, STATE_JUMPING: 2});

    //game state
    var gameState = GameStates.STATE_STARTUP;
    var score = 0;
    var highScore = 0;
    var onMobile = false;

    //audio
    var jumpSound = new Audio('/resources/default/1_0_0/audio/jump.wav');
    var hurtSound = new Audio('/resources/default/1_0_0/audio/hurt.wav');
    var slideSound = new Audio('/resources/default/1_0_0/audio/slide.wav');
    var startSound = new Audio('/resources/default/1_0_0/audio/start.wav');
    var dsSound = new Audio('/resources/default/1_0_0/audio/powerup.wav');

    //game objects
    var splash = new SplashScreen("Field Runner", 400, 240);
    var floor = new Floor("green");
    var background = new Background("#33CCFF");
    var player = new Player();
    var obstacleFactory = new ObstacleFactory();
    var groundObstacle = obstacleFactory.createObstacle({
        obstacleType: "ground",
        x: canvas.width - 2.5,
        y: canvas.height - 40,
        x_speed: -17,
        width: 60,
        height: 20,
        color: "#0000F0"
    });
    var floatingObstacle = obstacleFactory.createObstacle({
        obstacleType: "floating",
        x: canvas.width + canvas.width / 2,
        y: canvas.height - 60,
        x_speed: -10,
        width: 60,
        height: 20,
        color: "#F00000"
    });
    var coinImg = new Image();
    coinImg.src = "/resources/default/1_0_0/img/games/fr/coin.png";
    var bronzeMedal = new Medal(canvas.width - 40, 10, new Sprite({
        context: canvas.getContext("2d"),
        width: 256,
        height: 32,
        image: coinImg,
        numberOfFrames: 8,
        ticksPerFrame: 5
    }));

    window.addEventListener("keydown", function(event) {
        if(gameState === GameStates.STATE_RUN){
            switch(event.keyCode){
                case 32:
                    player.input["SPACE_PRESSED"] = true;
                    event.preventDefault();
                    break;
                case 70:
                    player.input["CTRL_PRESSED"] = true;
                    event.preventDefault();
                    break;
            }
        } else if(gameState === GameStates.STATE_STARTUP){
            reset();
            gameState = GameStates.STATE_RUN;
            event.preventDefault();
        } else if(gameState === GameStates.STATE_LOST && (event.keyCode == 13 || event.keyCode == 32)){
            reset();
            gameState = GameStates.STATE_RUN;
            event.preventDefault();
        }

    });

    window.addEventListener("keyup", function(event) {
        if(event.keyCode == 70){
            player.input["CTRL_RELEASED"] = true;
        }
    });

    window.addEventListener('click', function(event) {
        var mouseX, mouseY;

        if(event.offsetX) {
            mouseX = event.offsetX;
            mouseY = event.offsetY;
        }
        else if(event.layerX) {
            mouseX = event.layerX;
            mouseY = event.layerY;
        }
        if(gameState === GameStates.STATE_STARTUP || gameState === GameStates.STATE_LOST){
            splash.clicked(mouseX, mouseY);
        }
    });

    window.addEventListener('mousedown', function(event) {
        var mouseX, mouseY;

        if(event.offsetX) {
            mouseX = event.offsetX;
            mouseY = event.offsetY;
        }
        else if(event.layerX) {
            mouseX = event.layerX;
            mouseY = event.layerY;
        }
        if(gameState === GameStates.STATE_STARTUP || gameState === GameStates.STATE_LOST){
            splash.mouseDown(mouseX, mouseY);
        }
    });

    window.addEventListener("touchstart", tap);

    function tap (e) {
        if(onMobile) {
            var tapX = e.targetTouches ? e.targetTouches[0].pageX : e.pageX,
                tapY = e.targetTouches ? e.targetTouches[0].pageY : e.pageY;
            if (gameState === GameStates.STATE_STARTUP || gameState === GameStates.STATE_LOST) {
                splash.clicked(tapX, tapY);
            } else if (gameState === GameStates.STATE_RUN) {
                player.input["SPACE_PRESSED"] = true;
            }
        }
    }

    function Sprite(options) {

        this.frameIndex = 0;
        this.tickCount = 0;
        this.ticksPerFrame = options.ticksPerFrame || 0;
        this.numberOfFrames = options.numberOfFrames || 1;
        this.context = options.context;
        this.width = options.width;
        this.height = options.height;
        this.x = 0;
        this.y = 0;
        this.image = options.image;
        this.scaleRatio = 1;

        this.update = function () {

            this.tickCount += 1;

            if (this.tickCount > this.ticksPerFrame) {

                this.tickCount = 0;

                // If the current frame index is in range
                if (this.frameIndex < this.numberOfFrames - 1) {
                    // Go to the next frame
                    this.frameIndex += 1;
                } else {
                    this.frameIndex = 0;
                }
            }
        };

        this.render = function () {

            // Draw the animation
            this.context.drawImage(
                this.image,
                this.frameIndex * this.width / this.numberOfFrames,
                0,
                this.width / this.numberOfFrames,
                this.height,
                this.x,
                this.y,
                this.width / this.numberOfFrames * this.scaleRatio,
                this.height * this.scaleRatio);
        };

        this.getFrameWidth = function () {
            return this.width / this.numberOfFrames;
        };
    }

    function Floor(color){
        this.color = color;
        this.y = canvas.height - 20;
    }

    Floor.prototype.render = function(){
        context.fillStyle = this.color;
        context.fillRect(2, canvas.height - 20, canvas.width - 3, 17.5);
        context.beginPath();
        context.lineWidth=1;
        context.strokeStyle="#000000";
        context.moveTo(2.5, canvas.height - 20);
        context.lineTo(canvas.width - 2, canvas.height-20);
        context.stroke();
        context.fillStyle = this.color;
    }

    function Background(color){
        this.color = color;
    }

    Background.prototype.render = function(){
        context.beginPath();
        context.lineWidth="5";
        context.strokeStyle="red";
        context.rect(0, 0, canvas.width, canvas.height);
        context.stroke();
        context.fillStyle = this.color;
        context.fillRect(2.5, 2.5, canvas.width - 5, canvas.height - 5);
    }

    function Player(){
        this.input = {}; //input actions
        this.runner = new Runner(60, canvas.height - 80, 20, 60, "#000000");
    }

    Player.prototype.render = function(){
        this.runner.render();
    }

    Player.prototype.update = function(){
        this.runner.handleInput(this.input);
        this.runner.update();
    }

    function Medal(x, y, sprite){
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.sprite.x = x;
        this.sprite.y = y;
    }

    Medal.prototype.render = function(){
        this.sprite.render();
    }

    Medal.prototype.update = function(){
        this.sprite.update();
    }

    function Runner(x, y, width, height, color){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.x_speed = 0;
        this.y_speed = 0;
        this.y_acc = 1.0;
        this.img = new Image();
        this.img.src = "/resources/default/1_0_0/img/games/fr/running.png";
        this.sprite = new Sprite({
            context: canvas.getContext("2d"),
            width: 370,
            height: 60,
            image: this.img,
            numberOfFrames: 8,
            ticksPerFrame: 5
        });
        this.sprite.x = x - 15;
        this.sprite.y = y + 10;
        this.hasDoubleJump = true;
        this.current_state = RunnerStates.STATE_RUNNING;
    }

    Runner.prototype.render = function(){
        //uncomment to show bounding box
        //context.fillStyle = this.color;
        //context.fillRect(this.x, this.y, this.width, this.height);
        this.sprite.render();
    }

    Runner.prototype.jump = function(){
        this.y_speed = -10;
        if(jumpSound.currentTime > 0){
         jumpSound.currentTime = 0;
         jumpSound.play();
         } else{
         jumpSound.play();
         }
        this.current_state = RunnerStates.STATE_JUMPING;
    }

    Runner.prototype.startSlide = function(){
        var temp = this.width;
        this.width = this.height;
        this.height = temp;
        this.y = floor.y - this.height;
        this.x = 5;
        this.img.src = "/resources/default/1_0_0/img/games/fr/sliding.png";
        this.sprite.ticksPerFrame = 1;
        this.sprite.numberOfFrames = 1;
        this.sprite.width = 60;
        this.sprite.height = 46;
        if(slideSound.currentTime > 0){
         slideSound.currentTime = 0;
         slideSound.play();
         } else{
         slideSound.play();
         }
        this.current_state = RunnerStates.STATE_SLIDING;
    }

    Runner.prototype.endSlide = function(){
        var temp = this.width;
        this.width = this.height;
        this.height = temp;
        this.y = floor.y - this.height;
        this.x = 60;
        this.img.src = "/resources/default/1_0_0/img/games/fr/running.png";
        this.sprite.ticksPerFrame = 5;
        this.sprite.numberOfFrames = 8;
        this.sprite.width = 370;
        this.sprite.height = 60;
        this.current_state = RunnerStates.STATE_RUNNING;
    }

    Runner.prototype.update = function(){
        this.y += this.y_speed;
        this.y_speed += this.y_acc;
        if(this.y + this.height > canvas.height - 20){ //runner has collided with ground
            this.y_speed = 0;
            this.y = floor.y - this.height;
            if(this.current_state === RunnerStates.STATE_JUMPING){
                this.hasDoubleJump = true;
                this.current_state = RunnerStates.STATE_RUNNING;
            }
        }
        if(this.y <= 2.5){ //runner has collided with ceiling
            this.y = 2.5;
        }

        //update runner sprite
        if(this.current_state === RunnerStates.STATE_SLIDING){
            this.sprite.x = this.x;
            this.sprite.y = this.y - 7;
        } else{
            this.sprite.x = this.x - 15;
            this.sprite.y = this.y + 10;
        }
        this.sprite.update();
    }

    Runner.prototype.handleInput = function(input){
        for(var key in input){
            switch(this.current_state){
                case RunnerStates.STATE_RUNNING:
                    if(key == "SPACE_PRESSED"){
                        this.jump();
                        this.current_state = RunnerStates.STATE_JUMPING;
                        delete input[key];
                    } else if(key == "CTRL_PRESSED") {
                        this.startSlide();
                        this.current_state = RunnerStates.STATE_SLIDING;
                        delete input[key];
                    }
                    delete input[key];
                    break;
                case RunnerStates.STATE_JUMPING:
                    if(key == "SPACE_PRESSED" && this.hasDoubleJump){
                        this.jump();
                        this.current_state = RunnerStates.STATE_JUMPING;
                        delete input[key];
                        this.hasDoubleJump = false;
                    }
                    break;
                case RunnerStates.STATE_SLIDING:
                    if(key == "CTRL_RELEASED"){
                        this.endSlide();
                        this.current_state = RunnerStates.STATE_RUNNING;
                        this.hasDoubleJump = true;
                        delete input[key];
                    } else if(key == "CTRL_PRESSED") {
                        delete input[key];
                    } else if(key == "SPACE_PRESSED"){
                        this.endSlide();
                        this.jump();
                        this.current_state = RunnerStates.STATE_JUMPING;
                        delete input[key];
                    }
                    delete input[key];
                    break;
            }
            break;
        }
        input = {};
    }

    function Obstacle(settings){
        this.x = settings.x;
        this.y = settings.y;
        this.width = settings.width;
        this.height = settings.height;
        this.color = settings.color;
        this.x_speed = settings.x_speed;
        this.y_speed = 0;

        this.update = function(runner){
            this.x += this.x_speed;
            this.y += this.y_speed;

            //obstacle bounds
            var obstacle_center_x = this.x + this.width/2;
            var obstacle_center_y = this.y + this.height/2;
            var obstacle_left_x = this.x;
            var obstacle_right_x = this.x + this.width;
            var obstacle_top_y = this.y;
            var obstacle_bottom_y = this.y + this.height;

            //runner bounds
            var runner_center_x = runner.x + runner.width/2;
            var runner_center_y = runner.y + runner.height/2;
            var runner_left_x = runner.x;
            var runner_right_x = runner.x + runner.width;
            var runner_top_y = runner.y;
            var runner_bottom_y = runner.y + runner.height;

            //bounding box collision between runner and obstacle
            if((Math.abs(runner_center_x - obstacle_center_x) * 2 < (this.width + runner.width)) &&
                (Math.abs(runner_center_y - obstacle_center_y) * 2 < (this.height + runner.height))
            ){
                hurtSound.play();
                if(onMobile){
                    splash.message = "YOU LOST! Final Score: " + score;
                    splash.message2 = "";
                } else {
                    splash.message = "YOU LOST! Hit 'ENTER' to restart."
                    splash.message2 = "Final Score: " + score;
                }
                gameState = GameStates.STATE_LOST;
            }

            //obstacle has moved off the left side of the screen
            if(obstacle_right_x <= 2.5){
                this.x = canvas.width - 2.5;
                score++;
                if(score > highScore){
                    highScore = score;
                }
                if(score == 100){
                    dsSound.play();
                }
            }
        }

        this.render = function(){
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
            context.beginPath();
            context.lineWidth=1;
            context.strokeStyle="#000000";
            context.rect(this.x+1, this.y, this.width-1, this.height);
            context.stroke();
        }
    }


    function GroundObstacle(settings){
        Obstacle.call(this, settings);

        //additional unique implementation
    }

    function FloatingObstacle(settings){
        Obstacle.call(this, settings);

        //additional unique implementation
    }

    function ObstacleFactory(){
        this.obstacleClass = GroundObstacle; //default

        this.createObstacle = function(settings){
            switch(settings.obstacleType){
                case "ground":
                    this.obstacleClass = GroundObstacle;
                    break;
                case "floating":
                    this.obstacleClass = FloatingObstacle;
                    break;
            }
            return new this.obstacleClass(settings);
        }
    }

    function SplashScreen(title, width, height){
        this.title = title;
        this.message = "";
        this.message2 = "";
        this.width = width;
        this.height = height;
        this.buttonColor = "#FAAAAA";
    }

    SplashScreen.prototype.render = function(){
        //border
        context.beginPath();
        context.lineWidth="5";
        context.strokeStyle="#0F0F0F";
        context.rect(canvas.width/2 - this.width/2, canvas.height/2 - this.height/2,
            this.width, this.height);
        context.stroke();
        //fill
        context.fillStyle = "#FFFFAA";
        context.fillRect(canvas.width/2 - this.width/2 + 2.5, canvas.height/2 - this.height/2 + 2.5,
            this.width - 5, this.height - 5);
        //splash text
        context.fillStyle = "#000000";
        context.font="40px Georgia";
        context.textAlign = "center";
        context.fillText(this.title,canvas.width/2,canvas.height/2 - 60);
        context.font="20px Georgia";
        context.fillText(this.message,canvas.width/2,canvas.height/2 - 20);
        context.fillText(this.message2,canvas.width/2,canvas.height/2 + 12.5);
        //start button + text
        context.beginPath();
        context.lineWidth="5";
        context.strokeStyle="#0F0F0F";
        context.rect(canvas.width/2 - 60, canvas.height/2 + 35,
            120, 60);
        context.stroke();
        context.fillStyle = this.buttonColor;
        context.fillRect(canvas.width/2 - 60 + 2.5, canvas.height/2 + 37.5,
            115, 55);
        context.fillStyle = "#000000";
        context.font="20px Georgia";
        context.fillText("START", canvas.width/2, (canvas.height/2) + 72);
    }

    SplashScreen.prototype.clicked = function(x,y){
        if(x >= (canvas.width/2 - 60) && x <= (canvas.width/2 + 60) &&
            y >= (canvas.height/2 + 35) && y <= (canvas.height/2 + 95)){
            reset();
            gameState = GameStates.STATE_RUN;
        }
        this.buttonColor = "#FAAAAA";
    }

    SplashScreen.prototype.mouseDown = function(x,y){
        if(x >= (canvas.width/2 - 60) && x <= (canvas.width/2 + 60) &&
            y >= (canvas.height/2 + 35) && y <= (canvas.height/2 + 95)){
            this.buttonColor = "#FAFAFA";
        } else{
            this.buttonColor = "#FAAAAA";
        }
    }

    var renderEnvironment = function(){
        background.render();
        floor.render();
    }

    var renderScore = function(){
        context.fillStyle = "#000000";
        context.font="20px Georgia";
        context.textAlign = "left";
        context.fillText("Score: " + score, 10, 25);
        context.fillText("Highest: " + highScore, 8, 45);
    }

    window.mobilecheck = function() {
        var check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    }

    var renderMobileButtons = function(){

    }

    var init = function() {
        onMobile = window.mobilecheck();
        if(onMobile){
            splash.message = "TAP anywhere once to JUMP";
            splash.message2 = "TAP anywhere twice to DOUBLE JUMP";
        } else {
            splash.message = "Hit 'SPACE' to JUMP, 'F' to SLIDE";
            splash.message2 = "Hit 'SPACE' twice to DOUBLE JUMP";
        }
        animate(step);
    };

    var reset = function(){
        score = 0;
        groundObstacle.x = canvas.width - 2.5 + 500;
        floatingObstacle.x = (canvas.width + canvas.width / 2) + 430;
        startSound.play();
    };

    var step = function() {
        update();
        render();
        animate(step);
    };

    var update = function() {
        bronzeMedal.update();
        if(gameState === GameStates.STATE_RUN){
            player.update();
            groundObstacle.update(player.runner);
            floatingObstacle.update(player.runner);
        }
    };

    var render = function() {
        renderEnvironment();
        renderScore();
        if(highScore >= 100) {
            bronzeMedal.render();
        }
        //if(onMobile){
        //    renderMobileButtons();
        //}
        if(gameState === GameStates.STATE_STARTUP){
            splash.render();
        } else if(gameState === GameStates.STATE_RUN){
            groundObstacle.render();
            floatingObstacle.render();
            player.render();
        } else if(gameState === GameStates.STATE_LOST){
            groundObstacle.render();
            floatingObstacle.render();
            player.render();
            splash.render();
        }
    }

    init();
}