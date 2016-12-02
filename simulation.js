
// GLOBAL VARS
var FRAME_RATE = 60; // frames per sec
var FRAME = 0;

var SPEED_MULT = 0.5;
         
function setSpeedMult(){
	SPEED_MULT = document.getElementById("speedSlider").value / 100;
	log("Speed Multiplier: " + SPEED_MULT);
}

var STARTED = false;

var CANVAS = document.getElementById("myCanvas");
var CONTEXT = CANVAS.getContext("2d");

var INTERVAL_ID;

var ELEMENTS = new List();

function addElement(elm){
	ELEMENTS.push(elm);
}
function removeElement(elm){
	ELEMENTS.removeFromBack(elm);
	
}

// START UP
document.getElementById("speedSlider").value = SPEED_MULT * 100;



// BUTTONS LISTENER
function onStartButtonClick(){
	if (STARTED) {
		endSimulation();
	}else{
		startSimulation();
	}
	log("Started: " + STARTED);
}

// KEYBOARD LISTENER
window.addEventListener("keyup", function(e){
	if (document.getElementById("stateText") === document.activeElement){
		return;
	}
	var keycode = e.which;
	switch (keycode){
		//case 46:
			//log("Delete");
			//break;
		case 32:
			//log("Space");
			onStartButtonClick();
			break
		case 13:
			//log("Enter");
			//onStartButtonClick();
			break;
		default:
			//log("Keycode: " + keycode);
			onKeyUp(keycode);
	}
})

//MOUSE LISTENER
CANVAS.addEventListener("mouseup", function(e){
	var rect = CANVAS.getBoundingClientRect();
	var x = e.clientX - rect.left; 
	var y = e.clientY - rect.top;
	//log("Mouse Click: ("+x+", "+y+")");
	onMouseClick(x, y);
})

// STATE TEXT CONTROL

function onStateTextChange(){
	log("onStateTextChange");
	var text = document.getElementById("stateText").value;
	stateTextChanged(text);
}

function setStateText(text){
	document.getElementById("stateText").value = text;
}

// SIMULATION CONTROL

function startSimulation(){
	STARTED = true;
	INTERVAL_ID = setInterval(loopFunction, Math.round(1000 / FRAME_RATE));	
}

function endSimulation(){
	STARTED = false;
	FRAME = 0;
	clearInterval(INTERVAL_ID);
}

// MAIN LOOP
function loopFunction(){
	//var msPerOccurrence = 200;
	//var framesPerOccurrence = msPerOccurrence * FRAME_RATE / 1000;
	//if (FRAME % Math.round(framesPerOccurrence / SPEED_MULT) === 0) {
	//	log("Frame: " + FRAME + ". Update each " + Math.round(framesPerOccurrence / SPEED_MULT)+ " frames");
	//}
	// update simulation state
	ELEMENTS.iterate( function(elm){
		if (FRAME % Math.round(elm.framesPerUpdate / SPEED_MULT) === 0) {
			elm.update();
		}
	} );
	// draw canvas
	updateCanvas();
	FRAME++;
}


function updateCanvas(){
	CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
	drawCanvas(CONTEXT);
}

// FUNCTIONS CALLED BY THE CLIENT PROGRAM

function setDefaultElementsPosition(processes, clients, links){
	var height = CANVAS.height;
	var width = CANVAS.width;
	var total = processes.length;
	var angleApart = 2 * Math.PI / total;
	var cx = (clients != undefined) ? (width / 2 + width / 10) : (width / 2);
	var cy = height  / 2;
	var cr = (width < height) ? (width / 2 - width / 6) : (height / 2 - height / 6);

	// Sets processes in a beautiful circle
	for (i = 0; i < total; i++){
		var ang = angleApart * i;
		var x = cx;
		var y = cy;
		if (ang >= 0 && ang < Math.PI / 2){
			x += Math.cos(ang) * cr;
			y -= Math.sin(ang) * cr;
		}else if (ang >= Math.PI / 2 && ang < Math.PI){
			x -= Math.cos(Math.PI - ang) * cr;
			y -= Math.sin(Math.PI - ang) * cr;
		}else if (ang >= Math.PI && ang < Math.PI * 3/2){
			x -= Math.cos(ang - Math.PI) * cr;
			y += Math.sin(ang - Math.PI) * cr;
		}else if (ang >= Math.PI * 3/2 && ang < Math.PI * 2){
			x += Math.cos(Math.PI * 2 - ang) * cr;
			y += Math.sin(Math.PI * 2 - ang) * cr;
		}
		processes[i].x = Math.round(x);
		processes[i].y = Math.round(y);
	}		
	
	if (clients != undefined){
		total = clients.length;
		var pxApart = height / total;
		var pxX = width / 10;
		// Sets clients in straight line at the left of the canvas
		for (i = 0; i < total; i++){
			clients[i].x = Math.round(pxX);
			clients[i].y = Math.round(i * pxApart + pxApart / 2);
		}		
	}
	
	if (links != undefined){
		// Sets links connecting its ends
		total = links.length;
		for (i = 0; i < total; i++){
			var link = links[i];
			link.x1 = link.p1.x;
			link.y1 = link.p1.y;
			link.x2 = link.p2.x;
			link.y2 = link.p2.y;
		}
	}
	
}


function setDefaultElementsPositionL(processes, clients){
	var height = CANVAS.height;
	var width = CANVAS.width;
	var total = processes.length;
	var angleApart = 2 * Math.PI / total;
	var cx = (clients != undefined) ? (width / 2 + width / 10) : (width / 2);
	var cy = height  / 2;
	var cr = (width < height) ? (width / 2 - width / 6) : (height / 2 - height / 6);

	// Sets processes in a beautiful circle
	//for (i = 0; i < total; i++){
	var i = 0;
	processes.iterate(
		callback = function(proc){
			var ang = angleApart * i;
			var x = cx;
			var y = cy;
			if (ang >= 0 && ang < Math.PI / 2){
				x += Math.cos(ang) * cr;
				y -= Math.sin(ang) * cr;
			}else if (ang >= Math.PI / 2 && ang < Math.PI){
				x -= Math.cos(Math.PI - ang) * cr;
				y -= Math.sin(Math.PI - ang) * cr;
			}else if (ang >= Math.PI && ang < Math.PI * 3/2){
				x -= Math.cos(ang - Math.PI) * cr;
				y += Math.sin(ang - Math.PI) * cr;
			}else if (ang >= Math.PI * 3/2 && ang < Math.PI * 2){
				x += Math.cos(Math.PI * 2 - ang) * cr;
				y += Math.sin(Math.PI * 2 - ang) * cr;
			}
			proc.x = Math.round(x);
			proc.y = Math.round(y);
			i++;
		}
	);
	
	if (clients != undefined){
		total = clients.length;
		var pxApart = height / total;
		var pxX = width / 10;
		i = 0;
		// Sets clients in straight line at the left of the canvas
		clients.iterate(
			callback = function(cli){
				cli.x = Math.round(pxX);
				cli.y = Math.round(i * pxApart + pxApart / 2);
				i++;
			}		
		);
	}	
}

// Determines if (x, y) is in a circle of center (cx, cy) and radius cradius. 
// Used to know when you click on a process, client or message.
function isInCircle(x, y, cx, cy, cradius){
	var h = Math.abs(cy - y);
	var w = Math.abs(cx - x);
	var dist = Math.round( Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2)) );
	if (dist <= cradius) {
		return true;
	}
	return false;
}

// Exponential distribution.
function expDist(lambda){
	// return Math.log(1 - Math.random()) / (-lambda);
	return lambda;
}


// DEBUGGING LOG 
// On a new line
function log(msg){
	var text = document.getElementById("logText");
	text.value = text.value + "\n" + msg;
	text.scrollTop = text.scrollHeight;
}

// On previous line
function logAppend(msg){
	var text = document.getElementById("logText");
	text.value = text.value + msg;
	text.scrollTop = text.scrollHeight;
}
