
log("The Paxos Simulation");
log("Controls: click to select, Delete to kill a message or a process, press any letter to have the selected process send a Request.");
log("To edit the state of the simulation, change any variable in the text area and deselect it by pressing TAB or clicking outside.");

function Process(id){
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.radius = 30;
	
	this.promises = new List(); // {value, n}
	this.learnCount = 0;
	
	this.available = true;
	this.n = 0; //propose number
	this.value = "null";
	this.lastAcceptedN = 0;
	this.committed = false;
	
	this.recv = function(msg, src){
		if (! this.available){
			return;
		}
		switch(msg.type){
			case MSG_PREPARE:
				if (msg.n > this.n){
					this.n = msg.n;
					this.sendPromise(src);
				}
				break;
			case MSG_PROMISE:
				if (msg.n === this.n){
					this.promises.push({value:msg.value, n:msg.lastAcceptedN});
					if (this.promises.length === Math.floor(numberOfProcesses / 2)){
						var choise = {value:this.value, n:-1};
						this.promises.iterate(function(elm){
							if (elm.value != "null" && elm.n > choise.n){
								choise = elm;
							}
						});
						this.value = choise.value;
						this.lastAcceptedN = this.n;
						this.sendAccept();
					}
				}
				break;
			case MSG_ACCEPT:
				if (msg.n === this.n){
					this.value = msg.value;
					this.lastAcceptedN = this.n;
					this.sendLearn(src);
				}
				break;
			case MSG_LEARN:
				if (msg.n === this.n && msg.value === this.value){
					this.learnCount++;
					if (this.learnCount === Math.floor(numberOfProcesses / 2)){
						this.committed = true;
						this.sendCommit();
					}
				}
				break;
			case MSG_COMMIT:
				if (msg.n === this.n && msg.value === this.value){
					this.committed = true;
				}
				break;
			
		}
		updateStateText();
	}
	
	this.sendPrepare = function(value){
		this.value = value;
		this.n++;
		this.promises = new List();
		this.learnCount = 0;
		var msg = new PaxosMessage(MSG_PREPARE, this.n, this.value);
		com.bcastL(msg, this, processes);
	}
	
	this.sendPromise = function(dst){
		var msg = new PaxosMessage(MSG_PROMISE, this.n, this.value, this.lastAcceptedN);
		com.send(msg, this, dst);
	}
	
	this.sendAccept = function(){
		var msg = new PaxosMessage(MSG_ACCEPT, this.n, this.value);
		com.bcastL(msg, this, processes);
	}
	
	this.sendLearn = function(dst){
		var msg = new PaxosMessage(MSG_LEARN, this.n, this.value);
		com.send(msg, this, dst);
	}
	
	this.sendCommit = function(){
		var msg = new PaxosMessage(MSG_COMMIT, this.n, this.value);
		com.bcastL(msg, this, processes);
	}
}

function PaxosMessage(type, n, value, lastAcceptedN){
	this.type = type;
	this.n = n;
	this.value = value;
	this.lastAcceptedN = lastAcceptedN;
}

MSG_PREPARE = 1;
MSG_PROMISE = 2;
MSG_ACCEPT = 3;
MSG_LEARN = 4;
MSG_COMMIT = 5;

// MAIN CODE

var com = new Communication();
com.deliveryTime = 1500;

var selectedElement;
var selectedType; 
var TYPE_PROCESS = 1;
var TYPE_MESSAGE = 2;

var numberOfProcesses = 5;
var processes = new List();
for (i = 0; i < numberOfProcesses; i++){
	var proc = new Process(i);
	processes.push(proc);
}

var messages = new List();

setDefaultElementsPositionL(processes);
updateCanvas();
updateStateText();

// STATE TEXT 

function updateStateText(){
	var text = '{\n';
	text += '    "number_of_processes":	' + numberOfProcesses + ',\n';
	text += '    "deliveryTime":		' + com.deliveryTime + ',\n';
	text += '    "processes":[\n'
	processes.iterate(
		callback = function(proc){
			text += '    {';
			text += '   "id": ' + proc.id + ',\n';
			text += '        "n":			' + proc.n + ',\n';
			text += '        "value":		"' + proc.value + '",\n';
			text += '        "lastAcceptedN":	' + proc.lastAcceptedN + ',\n';
			text += '        "committed":		"' + proc.committed + '"\n';
			text += '    },\n';
		}
	);
	text = text.slice(0,-2);
	text += ']\n';
	text += '}';
	setStateText(text);
}

function stateTextChanged(text){
	var objs = JSON.parse(text);
	
	//update delivery time
	com.deliveryTime = objs.deliveryTime;
	
	// update number of processes
	var dif = objs.number_of_processes - numberOfProcesses;
	if (dif != 0){
		while (dif < 0){
			processes.pop();
			numberOfProcesses--;
			dif++;
		}
		while (dif > 0){
			processes.push(new Process(numberOfProcesses++));
			dif--;
		}
		setDefaultElementsPositionL(processes);
	}
	
	// update processes
	var procs = objs.processes;
	processes.iterate(callback = function(proc){
		var obj = objs.processes[proc.id];
		if (obj != undefined){
			proc.value = obj.value;
			proc.n = obj.n;
			proc.lastAcceptedN = obj.lastAcceptedN;
			proc.committed = obj.committed == "true" ? true : false;
		}
	});
	
	updateCanvas();
	updateStateText();
	
	log("State update successfully");
}

// KEYBOARD INPUT

function onKeyUp(keycode){
	switch(keycode){
		case 46:
			log("Delete");
			if (selectedElement != undefined){
				switch(selectedType){
					case TYPE_PROCESS:
						selectedElement.available = ! selectedElement.available;
						break;
					case TYPE_MESSAGE:
						messages.removeFromBack(selectedElement);
						removeElement(selectedElement);
						break;
				}				
				updateCanvas();
				updateStateText();
			}
			break;
	}
	if (65 <= keycode && keycode <= 90){
		if (selectedElement != undefined && selectedType === TYPE_PROCESS && selectedElement.available){
			var c = String.fromCharCode(keycode);
			selectedElement.sendPrepare(c);
			log("Propose value " + c);
		}
	}
}

// MOUSE INPUT

function onMouseClick(x, y){
	var stop = false;
	processes.iterate(
		callback = function(proc){
			if (isInCircle(x, y, proc.x, proc.y, proc.radius)){
				log("Selected process: " + proc.id);
				selectedElement = proc;
				selectedType = TYPE_PROCESS;
				stop = true;
			}
		},
		stopCondition = function(proc){
			return stop;
		}
	);
	
	stop = false;
	messages.iterate(
		callback = function(msg){
			if (isInCircle(x, y, msg.x, msg.y, msg.radius)){
				log("Selected message: " + msg.id);
				selectedElement = msg;
				selectedType = TYPE_MESSAGE;
				stop = true;
			}
		},
		stopCondition = function(msg){
			return stop;
		}
	);
}

// DRAWING

function drawCanvas(ctx){
	drawMessages(ctx, messages);
	drawProcessesL(ctx, processes);
}

function drawProcessesL(ctx, processes){
	processes.iterate(
		callback = function(proc){
			var color      = proc.available ? "lightblue" : "grey";
			var labelColor = proc.committed ? "red"       : "black";
			var label = "" + proc.n + ": (" + proc.value + ", " + proc.lastAcceptedN + ")";
			drawNode(ctx, proc.x, proc.y, "p" + proc.id, label, proc.radius, color, "black", labelColor);
		}
	);
}


function drawMessages(ctx, messages){
	messages.iterate(function(msg){
		var label = '';
		p = msg.payload;
		switch(p.type){
			case MSG_PREPARE: 
				label = 'Prepare('+p.n+')';
				break;
			case MSG_PROMISE:
				label = 'Promise('+p.n+', '+p.value+', '+p.lastAcceptedN+')';
				break;
			case MSG_ACCEPT:
				label = 'Accept('+p.n+', '+p.value+')';
				break;
			case MSG_LEARN:
				label = 'Learn('+p.n+', '+p.value+')';
				break;
			case MSG_COMMIT:
				label = 'Commit('+p.n+', '+p.value+')';
				break;
		}	
		drawNode(ctx, msg.x, msg.y, "m", label, msg.radius, "lightgreen", "black", "black"); 
	});
}
