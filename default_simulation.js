
function Process(id){
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.radius = 30;
	this.framesPerUpdate = 100;
	this.responseCount = 0;
	this.update = function(){
	}
	this.recv = function(payload, src){
		//log("p" + this.id + " from " + src.id + " Recv: " + payload);
		if (src instanceof Client){
			com.send("Hello responded", this, src);
			com.bcast("Forward", this, processes);
		}else{
			this.responseCount++;
			if (this.responseCount === 5){
				com.bcast("Forward", this, processes);
				this.responseCount = 0;
			}
			updateStateText();
		}
	}
}

log("Default Simulation");
log("Beginning");

var com = new Communication();

var selectedElement;
var selectedType; //1: process, 2: client, 3: message

var processes = [];
var clients = [];
var links = [];
var messages = new List();

for (i = 0; i < 5; i++){
	var proc = new Process(i);
	processes.push(proc);
	addElement(proc);
}
for (i = 0; i < 3; i++){
	var cli = new Client(i);
	clients.push(cli);
	addElement(cli);
}
for (i = 0; i < 5; i++){
	for (j = 0; j < 5; j++){
		if (i != j){
			var link = new Link(processes[i], processes[j]);
			links.push(link);
			addElement(link);
		}
	}
}

log("Added process");

setDefaultElementsPosition(processes, clients, links);
log("Set default position for each element");

updateCanvas();
log("Ready");


// STATE TEXT 

function updateStateText(){
	var text = '[\n';
	var len = processes.length;
	for (i = 0; i < len; i++){
		var proc = processes[i];
		text += '    {"process":' + proc.id + ',\n';
		text += '        "responseCount":' + proc.responseCount + '}';
		if (i < len -1){
			text += ",\n";
		}
	}
	text += '\n]';
	//var text = JSON.stringify(processes);
	setStateText(text);
}

function stateTextChanged(text){
	var objs = JSON.parse(text);
	var len = processes.length;
	for (i = 0; i < len; i++){
		var proc = processes[i];
		var obj = objs[i];
		proc.responseCount = obj.responseCount;
	}
	log("Update successful");
}

// IMPLEMENTED INPUT FUNCTIONS CALLED AT THE SIMULATION

function drawCanvas(ctx){
	drawLinks(ctx, links);
	drawMessages(ctx, messages);
	drawProcesses(ctx, processes);
	drawClients(ctx, clients);
	
}

function onKeyUp(keycode){
	switch(keycode){
		case 46:
			log("Delete");
			if (selectedElement != undefined){
				switch(selectedType){
					case 3:
						messages.removeFromBack(selectedElement);
						removeElement(selectedElement);
						break;
				}				
				selectedElement = undefined;
				selectedType = undefined;
				updateCanvas();
			}
			break;
	}
}

function onMouseClick(x, y){
	var len = processes.length;
	for (i = 0; i < len; i++){
		var proc = processes[i];
		if(isInCircle(x, y, proc.x, proc.y, proc.radius))	{
			log("Process: " + proc.id);
			return;
		}
	}
	len = clients.length;
	for (i = 0; i < len; i++){
		var cli = clients[i];
		if(isInCircle(x, y, cli.x, cli.y, cli.radius))	{
			log("Client: " + cli.id);
			log("Created message to p0");
			com.send("Hello world", cli, processes[0]);
			return;
		}
	}
	
	var hit = false;
	messages.iterate(callback = function(msg){
		if(isInCircle(x, y, msg.x, msg.y, msg.radius))	{
			log("Message: " + msg.id);
			hit = true;
			selectedElement = msg;
			selectedType = 3;
		}
	}, stopCondition = function(value){return hit;});
}
