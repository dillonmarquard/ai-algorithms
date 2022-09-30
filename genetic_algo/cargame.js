
function setup(){
	frameRate(1000)
	createCanvas(1400,800);
	cars = [];
	track = [];
	timer1 = millis();
	minscore = -5000;
	popmax = 150;
	gentime = 1800; // frame number 60/s 
	gennum = 0; // generational counter
	maxscore = 0; // generational score max counter for training
	acceleration = 7;
	for(var i = 0; i < popmax; i++){
		new car(random()*.05, random()*.05, random()*.05, track)
	}
	// car1 = new car(-.0084,-.0009,-.0018);
	// console.log(cars)
}

function draw(){
	// if(keyIsDown(LEFT_ARROW)){
		// car.angle = (car.angle - PI/100)%(2*PI)
	// }
	// if(keyIsDown(UP_ARROW)){
		// if(car.acc < 3){
			// car.acc++;
		// }
	// }
	// if(keyIsDown(RIGHT_ARROW)){
		// car.angle = (car.angle + PI/100)%(2*PI)
	// }
	// if(keyIsDown(DOWN_ARROW)){
		// if(car.acc > 0){
			// car.acc--;
		// }
	// }
	background(255);
	
	timer2 = millis();
	// find max score and increase the minscore required
	
	maxscore = 0;
	for(var i = 0; i < cars.length; i++){
		if(cars[i].score > maxscore){
			maxscore = cars[i].score;
		}
	}
	stroke(0);
	fill(0)
	strokeWeight(1);
	textSize(22)
	fill(0,0,255)
	text("generation: " + gennum, 20, 30)
	text("maxscore: " + round(maxscore), 20, 60)
	if(frameCount%gentime === 0){
		console.log(cars)
		console.log("generation " + gennum)
		gennum++;
		
		// console.log("max score " + maxscore)
		minscore = maxscore;
		// cull
		for(var i = 0; i < cars.length; i++){
			if(cars[i].score < minscore - 2){
				cars.splice(i,1);
				// console.log("cull car")
			}
		}
		// reset minscore so that it updates each iteration
		minscore = -5000;
		timer1 = millis();
		// reset cars to starting pos and vel and dir and score
		for(var i = 0; i < cars.length; i++){
			cars[i].timestart = (millis()/1000);
			cars[i].pos = createVector(canvas.width/2,canvas.height/2+250);
			cars[i].vel = createVector(0,0);
			cars[i].acc = acceleration;
			cars[i].size = 15;
			cars[i].angle = PI;
			cars[i].lasttriggered = 0;
			cars[i].changeangle = 0;
			cars[i].score = 0;
			cars[i].state = 0;
		}
		// cross over for offspring
		for(var i = 0; i < (cars.length - ((cars.length - 1) % 2)) - 2; i += 2){
			crossOver(cars[i],cars[i+1]);
			// console.log("cross over")
		}
		// cull if too many offspring
		if(cars.length > popmax){
			cars.splice(popmax,cars.length - popmax)
		}
		// repopulate if too few offspring
		if(cars.length < popmax){
			for(var i = 0; i < popmax - cars.length; i++){
				// console.log("new car")
				new car(random()*.01, random()*.01, random()*.01, track)
			}
		}
	}
	// cars update and show
	if(cars.length > 0){
		for(var i = 0; i < cars.length; i++){
			cars[i].show();
			cars[i].update();
			cars[i].die(i);
		}
	}
}

function car(kp,ki,kd,track){
	cars.push(this);
	// score
	this.score = 0;
	this.state = 0;
	// 
	this.track = track;
	this.timestart = (millis()/1000);
	this.pos = createVector(canvas.width/2,canvas.height/2+250);
	this.vel = createVector(0,0);
	this.acc = acceleration;
	this.size = 15;
	this.angle = PI;
	this.lasttriggered = 0;
	// PID Weights
	this.kp = kp;
	this.ki = ki;
	this.kd = kd;
	this.changeangle = 0;
	
	// create sensors
	this.s1 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle))*50,this.pos.y - (sin(PI/2) * sin(this.angle+PI/2))*50);
	this.s2 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle))*25,this.pos.y - (sin(PI/2) * sin(this.angle+PI/2))*25);
	this.s3 = this.pos;
	this.s4 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle-PI))*25,this.pos.y - (sin(PI/2) * sin(this.angle-PI/2))*25)
	this.s5 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle-PI))*50,this.pos.y - (sin(PI/2) * sin(this.angle-PI/2))*50)
	
	this.update = function(){
		
		this.vel.x = 1 / sin(PI/2) * sin(PI/2 - this.angle)
		this.vel.y = 1 / sin(PI/2) * sin(this.angle)
		// this.vel.x = mouseX - this.pos.x;
		// this.vel.y = mouseY - this.pos.y;
		// angle = atan(this.vel.y/this.vel.x)
		this.pos.x = this.pos.x + this.vel.x * this.acc;
		this.pos.y = this.pos.y + this.vel.y * this.acc;
		// update sensor locations
		this.s1 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle))*50,this.pos.y - (sin(PI/2) * sin(this.angle+PI/2))*50);
		this.s2 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle))*25,this.pos.y - (sin(PI/2) * sin(this.angle+PI/2))*25);
		this.s3 = this.pos;
		this.s4 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle-PI))*25,this.pos.y - (sin(PI/2) * sin(this.angle-PI/2))*25)
		this.s5 = createVector(this.pos.x+(sin(PI/2) * sin(this.angle-PI))*50,this.pos.y - (sin(PI/2) * sin(this.angle-PI/2))*50)
		this.checkSensors();
		this.checkScore();
		// PID controller
		this.trigger = this.triggered()
		if(this.lasttriggered != this.trigger){
			
			this.changedist = this.trigger - this.lasttriggered;
			this.changetime = (millis()/1000) - this.timestart;
			this.timestart = (millis()/1000);
			this.lasttriggered = this.trigger;
			this.carvel = this.changedist/this.changetime;
			this.carabs = this.changedist*this.changetime;
			this.changeangle = this.changedist*this.kp + this.carvel*this.kd + this.carabs*this.ki;
			
		}
		this.angle += map(this.changeangle, -PI/20, PI/20, -.2225,.2225 )
		// this.angle += this.changeangle
		// console.log(this.s1state[0],this.s2state[0],this.s3state[0],this.s4state[0],this.s5state[0])
	};

	this.die = function(i){
		if(this.s1state[0] === 0 && this.s1state[1] === 0 && this.s1state[2] === 255){
			cars.splice(i, 1);
		}
		if(this.s2state[0] === 0 && this.s2state[1] === 0 && this.s2state[2] === 255){
			cars.splice(i, 1);
		}
		if(this.s3state[0] === 0 && this.s3state[1] === 0 && this.s3state[2] === 255){
			cars.splice(i, 1);
		}
		if(this.s4state[0] === 0 && this.s4state[1] === 0 && this.s4state[2] === 255){
			cars.splice(i, 1);
		}
		if(this.s5state[0] === 0 && this.s5state[1] === 0 && this.s5state[2] === 255){
			cars.splice(i, 1);
		}
	}
	
	this.checkSensors = function(){
		this.s1state = get(this.s1.x,this.s1.y);
		this.s2state = get(this.s2.x,this.s2.y);
		this.s3state = get(this.s3.x,this.s3.y);
		this.s4state = get(this.s4.x,this.s4.y);
		this.s5state = get(this.s5.x,this.s5.y);
	};
	
	this.show = function(){
		// draw sensors
		if(this.score >= maxscore){
			stroke(0,0,0)
		}else{
			stroke(255,0,0)
		}
		strokeWeight(1)
		noFill();
		ellipse(this.s1.x,this.s1.y,this.size);
		ellipse(this.s2.x,this.s2.y,this.size);
		ellipse(this.s3.x,this.s3.y,this.size);
		ellipse(this.s4.x,this.s4.y,this.size);
		ellipse(this.s5.x,this.s5.y,this.size);
		this.drawTrack();
	};
	
	this.checkScore = function(){
		// this.track;
		if(this.state === 0){
			if(this.s1state[0] === 0 && this.s1state[1] === 255 && this.s1state[2] === 0){
				this.state = 1;
				return;
			}
			if(this.s2state[0] === 0 && this.s2state[1] === 255 && this.s2state[2] === 0){
				this.state = 1;
				return;
			}
			if(this.s3state[0] === 0 && this.s3state[1] === 255 && this.s3state[2] === 0){
				this.score+=15
				this.state = 1;
				return;
			}
			if(this.s4state[0] === 0 && this.s4state[1] === 255 && this.s4state[2] === 0){
				this.state = 1;
				return;
			}
			if(this.s5state[0] === 0 && this.s5state[1] === 255 && this.s5state[2] === 0){
				this.state = 1;
				return;
			}
		}
		if(this.state === 1){
			if(this.s1state[0] === 0 && this.s1state[1] === 200 && this.s1state[2] === 0){
				this.state = 0;
				return;
			}
			if(this.s2state[0] === 0 && this.s2state[1] === 200 && this.s2state[2] === 0){
				this.state = 0;
				return;
			}
			if(this.s3state[0] === 0 && this.s3state[1] === 200 && this.s3state[2] === 0){
				this.score+=15;
				this.state = 0;
				return;
			}
			if(this.s4state[0] === 0 && this.s4state[1] === 200 && this.s4state[2] === 0){
				this.state = 0;
				return;
			}
			if(this.s5state[0] === 0 && this.s5state[1] === 200 && this.s5state[2] === 0){
				this.state = 0;
				return;
			}
		}
	}
	
	this.drawTrack = function(){
		fill(0,0,255)
		stroke(0,0,255)
		strokeWeight(10)
		ellipse(canvas.width/2,canvas.height/2,500,250)
		// border
		line(0,0,0,canvas.height);
		line(0,0,canvas.width,0)
		line(canvas.width-1,0,canvas.width-1,canvas.height-1)
		line(0,canvas.height-1,canvas.width-1,canvas.height-1)
		// goal
		stroke(0,255,0)
		strokeWeight(10)
		line(canvas.width/2 - 425, canvas.height/2,canvas.width/2 - 400, canvas.height/2)
		stroke(0,200,0)
		line(canvas.width/2 + 425, canvas.height/2,canvas.width/2 + 400, canvas.height/2)
		// track
		stroke(0)
		strokeWeight(10)
		noFill()
		ellipse(canvas.width/2, canvas.height/2,800,500)
	};
	
	this.triggered = function(){
		if(this.s1state[0] === 0 && this.s1state[1] === 0 && this.s1state[2] === 0){
			this.score-=.5;
			return -2;
		}
		if(this.s2state[0] === 0 && this.s2state[1] === 0 && this.s2state[2] === 0){
			return -1;
		}
		if(this.s3state[0] === 0 && this.s3state[1] === 0 && this.s3state[2] === 0){
			return 0;
		}
		if(this.s4state[0] === 0 && this.s4state[1] === 0 && this.s4state[2] === 0){
			return 1;
		}
		if(this.s5state[0] === 0 && this.s5state[1] === 0 && this.s5state[2] === 0){
			this.score-=.5;
			return 2;
		}
		else{
			return this.lasttriggered;
		}
	};
	
};

function crossOver(car1, car2){
	// either 1 or 0
	choosep = floor(random(2));
	choosei = floor(random(2));
	choosed = floor(random(2));

	if(choosep === 1){
		newkp = car1.kp
	}else{
		newkp = car2.kp
	}
	if(choosei === 1){
		newki = car1.ki
	}else{
		newki = car2.ki
	}
	if(choosed === 1){
		newkd = car1.kd
	}else{
		newkd = car2.kd
	}
	if(random() > .90){
		if(random() > .5){
			newkp += random()*.00001
		}else{
			newkp -= random()*.00001
		}
		if(random() > .5){
			newki += random()*.00001
		}else{
			newki -= random()*.00001
		}
		if(random() > .5){
			newkd += random()*.00001
		}else{
			newkd -= random()*.00001
		}
	}
	new car(newkp,newki,newkd,track)
};

