
log("The E-Paxos Simulation");
log("Controls: click to select, Delete to kill a message or a process, type 'r' to issue read from a client, type 'p' to issue propose from a client, type 'Esc' to cancel such client request.");
log("To edit the state of the simulation, change any variable in the text area and deselect it by pressing TAB or clicking outside.");

// PROCESS
function Process(id){
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.radius = 30;
	
	this.available = true;
	this.epoch = 0;
	this.cmds = []; // matrix of objects {instance, ballot}
	this.i = -1; // instance number

	this.responses = {}; // dictionary where key is [L,i] and value is a list of messages}
	this.equalResponses = {}; 

	this.addCmd = function(L, i, inst, ballot){
		this.cmds[L][i] = {instance:inst, ballot:ballot};
	}

	this.recv = function(msg, src){
		if (! this.available){
			return;
		}
		switch(msg.type){
			case MSG_REQUEST:
				this.phase1(msg.cmd, src, msg.objId);
				break;
			case MSG_READ:
				break;
			case MSG_PRE_ACCEPT:
				var instance = msg.instance.copy();
				var ballot = msg.ballot.copy();
				instance.deps = this.updateDependencies(instance.cmd, instance.deps);
				instance.seq = this.getSequenceNumber(instance.deps);
				this.addCmd(src.id, msg.i, instance, ballot);
				com.send(new EPaxosMessage(MSG_PRE_ACCEPT_OK, instance.copy(), msg.i, ballot), this, src);
				break;
			case MSG_PRE_ACCEPT_OK:
				var inst = this.cmds[this.id][msg.i];
				if (msg.ballot.isEqual(inst.ballot)){
					if(inst.instance.isEqual(msg.instance)){
						this.equalResponses[[this.id, msg.i]] = msg;
						if (this.equalResponses[this.id, msg.i])
					}
				}
				break;
			case MSG_ACCEPT:
				break;
			case MSG_ACCEPT_OK:
				break;
		}
		updateStateText();
	}
	
	// PHASES
	this.phase1 = function(cmd, client, objId){
		this.i++;
		var deps = this.getDependencies(cmd);
		var seq = this.getSequenceNumber(deps);
		var ballot = new Ballot(this.epoch, 0, this.id);
		var instance = new Instance(cmd, seq, deps, CMD_PRE_ACCEPTED, client, objId);
		this.addCmd(this.id, this.i, instance, ballot);
		this.sendToFastQuorum(new EPaxosMessage(MSG_PRE_ACCEPT, instance, this.i, ballot));
	}

	this.phase2 = function(){
	}

	this.commit = function(){
	}

	this.explicitPrepare = function(){
	}

	this.reconfigureReplicaSet = function(){
	}

	//ancillary functions
	this.getDependencies = function(cmd){
		var deps = [];
		for (i = 0; i < this.cmds.length; i++){
			for (j = 0; j < this.cmds[i].length; j++){
				deps.push(new Dep(i,j));
			}
		}
		return deps;
	}

	this.updateDependencies = function(cmd, deps){
		var newDeps = [];
		var isIn = false;
		for (i = 0; i < this.cmds.length; i++){
			for (j = 0; j < this.cmds[i].length; j++){
				for (k = 0; k < deps.length; k++){
					isIn  = isIn || deps[k].isEqualCoords(i,j);
				}
				if (!isIn){
					newDeps.push(new Dep(i,j));
				}else{
					isIn = false;
				}
			}
		}
		for (i = 0; i < deps.length; i++){
			newDeps.push(deps[i]);
		}
		return newDeps;
	}

	this.getSequenceNumber = function(deps){
		var seq = 0;
		for (i = 0; i < this.cmds.length; i++){
			for (j = 0; j < this.cmds[i].length; j++){
				var inst = this.cmds[i][j];
				if (seq < inst.seq){
					seq = inst.seq;
				}
			}
		}
		return seq + 1;

	}

	// communication functions
	this.sendToFastQuorum = function(msg){
		var self = this;
		var fastQuorum = numberOfProcesses -1; // 2F
		processes.iterate(callback = function(proc){
			if (self === proc){
				return
			}
			com.send(msg, self, proc);
			fastQuorum--;
		}, stopCondition = function(proc){
			return fastQuorum === 0;
		});
		log("elms: "+ELEMENTS.length);
	}

	this.sendToSlowQuorum = function(msg){
		var self = this;
		var slowQuorum = Math.floor((numberOfProcesses - 1) / 2); // F
		processes.iterate(callback = function(proc){
			com.send(msg, self, proc);
			slowQuorum--;
		}, stopCondition = function(proc){
			return slowQuorum === 0;
		});
	}

	this.sendToAllReplicas = function(msg){
		var self = this;
		processes.iterate(callback = function(proc){
			com.send(msg, self, proc);
		});
	}
}

// CLIENT
function Client(id){
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.radius = 16;

	this.nextObjId = 0;
	this.latestObjId = -1;

	this.recv = function(msg, src){
		switch(msg.type){
			case MSG_REQUEST_REPLY:
				this.nextObjId++;
				log("Client "+ this.id +": Request replied: "+ msg.objId);
				break;
			case MSG_READ_REPLY:
				log("Client "+ this.id +": Read replied: "+ msg.objId +", "+ msg.returnValue);
				break;
		}
	}

	this.sendRequest = function(cmd, proc){
		if (this.nextObjId > this.latestObjId){
			var request = new EPaxosClientMessage(MSG_REQUEST, cmd, this, this.nextObjId);
			this.latestObjId = this.nextObjId;
			com.send(request, this, proc);
		}else{
			log("Client "+ this.id +": Waiting for response to ObjId: "+ this.latestObjId +".");
		}
	}

	this.sendRead = function(objId, proc){
		if (this.latestObjId >= objId){
			var read = new EPaxosClientMessage(MSG_READ, null, this, objId);
			com.send(read, this, proc);
		}else{
			log("Client "+ this.id +": ObjId "+ objId +" had not been issued.");
		}
	}
}


// BALLOT
function Ballot(epoch, b, pid){
	this.epoch = epoch;
	this.b = b;
	this.pid = pid;

	this.toString = function(){
		return "("+ this.epoch +"."+ this.b +"."+ this.pid +")";
	}

	this.copy = function(){
		return new Ballot(this.epoch, this.b, this.pid);
	}
	this.isEqual = function(bal){
		return this.epoch === bal.epoch && this.b === bal.b && this.pid === bal.pid;
	}
	this.compare = function(bal){
		var dif = this.epoch - bal.epoch;
		if (dif === 0){
			dif = this.b - bal.b;
			if (dif === 0){
				dif = this.pid - bal.pid;
			}
		}
		return dif;
	}
}

// DEPENDENCY are coordenates to an instance in cmds.
function Dep(L, i){
	this.L = L;
	this.i = i;

	this.isEqual = function(dep){
		return this.L === dep.L && this.i === dep.i;
	}
	this.isEqualCoords = function(L,i){
		return this.L === L && this.i === i;
	}
}

// INSTANCE
function Instance(cmd, seq, deps, state, ballot, client, objId){
	this.cmd = cmd;
	this.seq = seq;
	this.deps = deps; // an array of Dep objects that are the coordenates for instance in cmds[dep.L][dep.i]
	this.state = state;
	this.client = client;
	this.objId = objId;

	this.copy = function(){
		return new Instance(this.cmd, this.seq, this.deps.slice(), this.state, this.client, this.objId);
	}

	this.isEqual = function(inst){
		var ret = this.cmd === inst.cmd 
			&& this.seq === inst.seq
			&& this.state === inst.state
			&& this.client === inst.client
			&& this.objId === inst.objId;
		if (this.deps.length === inst.deps.length){
			for (i = 0; i < this.deps.length; i++){
				ret = ret && this.deps[i].isEqual(inst.deps[i]);
			}
		}else{
			return false;
		}
		return ret;
	}
}

CMD_PRE_ACCEPTED = 0;
CMD_ACCEPTED = 1;
CMD_COMMITTED = 2;
function cmdStateToString(state){
	switch(state){
		case CMD_PRE_ACCEPTED:
			return "PreA";
		case CMD_ACCEPTED:
			return "Acpt";
		case CMD_COMMITTED:
			return "Cmmt";
	}
}

// MESSAGES
function EPaxosMessage(type, instance, i, ballot){
	this.type = type;
	this.instance = instance;
	this.i = i;
	this.ballot = ballot;
}

function EPaxosClientMessage(type, cmd, client, objId){
	this.type = type;
	this.cmd = cmd;
	this.client = client;
	this.objId = objId;
}

MSG_READ = 0;
MSG_READ_REPLY = 3;
MSG_REQUEST = 1;
MSG_REQUEST_AND_READ = 2;
MSG_REQUEST_REPLY = 4;
MSG_PRE_ACCEPT = 5;
MSG_PRE_ACCEPT_OK = 6;
MSG_ACCEPT = 7;
MSG_ACCEPT_OK = 8;
MSG_COMMIT = 9;
MSG_PREPARE = 10;
MSG_JOIN = 11;


// MAIN CODE

var com = new Communication();
com.deliveryTime = 1500;

var numberOfProcesses = 5;
var processes = new List();
for (i = 0; i < numberOfProcesses; i++){
	var proc = new Process(i);
	for (j = 0; j < numberOfProcesses; j++){
		proc.cmds[j] = []; // array of Instances
	}
	processes.push(proc);
}

var numberOfClients = 5;
var clients = new List();
for (i = 0; i < numberOfClients; i++){
	var cli = new Client(i);
	clients.push(cli);
}

var messages = new List();

// user element selection
var selectedProcess = processes.peekFront();
var selectedClient = clients.peekFront();
var selectedElement; // last selected element
var selectedType; 
var TYPE_PROCESS = 1;
var TYPE_MESSAGE = 2;
var TYPE_CLIENT = 3;

// user action states
var ACT_NULL = 0;
var ACT_READ = 1;
var ACT_PROPOSE = 2;
var prepareAction = ACT_NULL;

setDefaultElementsPositionL(processes, clients);
updateCanvas();
updateStateText();

// STATE TEXT 

function updateStateText(){
	var text = '{\n';
	text += '    "numberOfProcesses":	' + numberOfProcesses + ',\n';
	text += '    "numberOfClients":		' + numberOfClients + ',\n';
	text += '    "deliveryTime":		' + com.deliveryTime + ',\n';
	text += '    "processes":[\n';
	processes.iterate(
		callback = function(proc){
			text += '    {';
			text += '    "id": ' + proc.id + ',\n';
			text += '	 "cmds":[\n'; 
			for (i = 0; i < proc.cmds.length; i++){
				text += '	  ['
				for (j = 0; j < proc.cmds[i].length; j++){
					var inst = proc.cmds[i][j].instance;
					text += '[';
					text += '"' + inst.cmd + '",';
					text += '' + inst.seq + ",";
					text += '[';
					for (k = 0; k < inst.deps.length; k++){
						text += '(' + inst.deps[k].L + ',' + inst.deps[k].i+ '),';
					}
					if (k > 0){
						text = text.slice(0, -1);
					}
					text += '],';
					text += '"' + cmdStateToString(inst.state) + '"';
					text += '], ';
				}
				if (j > 0){
					text = text.slice(0, -2);
				}
				text += '],\n';
			}
			text = text.slice(0,-2);
			text += '\n	 ]\n';
			text += '    },\n';
		}
	);
	text = text.slice(0,-2);
	text += '],\n';
	text += '    "clients":[\n';
	clients.iterate(
		callback = function(cli){
			text += '    {';
			text += '   "id": ' + cli.id + ',\n';
			text += '	"latestObjId":		' + cli.latestObjId + ',\n';
			text += '	"nextObjId":		' + cli.nextObjId + '\n';
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
	var dif = objs.numberOfProcesses - numberOfProcesses;
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
		setDefaultElementsPositionL(processes, clients);
	}
	
	// update number of clients
	dif = objs.numberOfClients - numberOfClients;
	if (dif != 0){
		while (dif < 0){
			clients.pop();
			numberOfClients--;
			dif++;
		}
		while (dif > 0){
			clients.push(new Client(numberOfClients++));
			dif--;
		}
		setDefaultElementsPositionL(processes, clients);
	}
	/*
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
	*/
	// update clients
	var clis = objs.clients;
	clients.iterate(callback = function(cli){
		var obj = objs.clients[cli.id];
		if (obj != undefined){
			cli.latestObjId = obj.latestObjId;
			cli.nextObjId = obj.nextObjId;
		}
	});

	updateCanvas();
	updateStateText();
	
	log("State update successfully");
}

// KEYBOARD INPUT

function onKeyUp(keycode){
	switch(keycode){
		case 27: // Esc
			if (prepareAction != ACT_NULL){
				prepareAction = ACT_NULL;
				log("Canceled.");
			}
			break;
		case 46: // Delete
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
			}
			break;
	}
	switch(prepareAction){
		case ACT_NULL:
			switch(keycode){
				case 80: // p
					prepareAction = ACT_PROPOSE;
					log("Preparing propose(command...[type a command letter]...");
					break;
				case 82: // r
					prepareAction = ACT_READ;
					log("Preparing read(objId...[type a number]...");
					break;
			}
			break;
	
		case ACT_PROPOSE:
			// for letter keys:
			if (65 <= keycode && keycode <= 90 
					&& selectedClient != undefined && selectedProcess != undefined){
				var c = String.fromCharCode(keycode);
				prepareAction = ACT_NULL;
				logAppend("" + c + ")");
				selectedClient.sendRequest(c, selectedProcess);
			}
			break;
		case ACT_READ:
			// for numerals
			if (48 <= keycode && keycode <= 57
					&& selectedClient != undefined && selectedProcess != undefined){
				var n = keycode - 48;
				prepareAction = ACT_NULL;
				logAppend("" + n + ")");
				selectedClient.sendRead(n, selectedProcess);
			}
			break;
	}
	updateCanvas();
	updateStateText();
}

// MOUSE INPUT

function onMouseClick(x, y){
	var stop = false;
	processes.iterateFromBack(
		callback = function(proc){
			if (isInCircle(x, y, proc.x, proc.y, proc.radius)){
				log("Selected process: " + proc.id);
				selectedElement = proc;
				selectedProcess = proc;
				selectedType = TYPE_PROCESS;
				stop = true;
			}
		},
		stopCondition = function(proc){
			return stop;
		}
	);
	
	stop = false;
	messages.iterateFromBack(
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

	stop = false;
	clients.iterateFromBack(
		callback = function(cli){
			if (isInCircle(x, y, cli.x, cli.y, cli.radius)){
				log("Selected client: " + cli.id);
				selectedClient = cli;
				selectedType = TYPE_CLIENT;
				stop = true;
			}
		},
		stopCondition = function(msg){
			return stop;
		}
	);
	updateCanvas();
}

// DRAWING

function drawCanvas(ctx){
	drawProcessesL(ctx, processes);
	drawClientsL(ctx, clients);
	drawMessages(ctx, messages);
}

function drawProcessesL(ctx, processes){
	processes.iterate(
		callback = function(proc){
			var color      = proc.available ? "lightblue" : "grey";
			var label = "" //+ proc.n + ": (" + proc.value + ", " + proc.lastAcceptedN + ")";
			drawNode(ctx, proc.x, proc.y, "p" + proc.id, label, proc.radius, color, "black", "black");
		}
	);
	if (selectedProcess != undefined){
		drawSelectionSquare(ctx, selectedProcess.x, selectedProcess.y, selectedProcess.radius, "black");
	}
}

function drawClientsL(ctx, clients){
	clients.iterate(
		callback = function(cli){
			var label = "" + cli.latestObjId;
			drawNode(ctx, cli.x, cli.y, "c" + cli.id, label, cli.radius, "lightgrey", "black", "black");
		}
	);
	if (selectedClient != undefined){
		drawSelectionSquare(ctx, selectedClient.x, selectedClient.y, selectedClient.radius, "black");
	}
}

function drawMessages(ctx, messages){
	messages.iterate(function(msg){
		var label = '';
		p = msg.payload;
		switch(p.type){
			case MSG_READ:
				label = "Read("+ p.objId +")";
				break;
			case MSG_READ_REPLY:
				label = "ReadReply("+ p.objId +", "+ p.returnValue +")";
				break;
			case MSG_REQUEST:
				label = "Request("+ p.cmd +", "+ p.objId +")";
				break;
			case MSG_REQUEST_AND_READ:
				break;
			case MSG_REQUEST_REPLY:
				label = "RequestReply("+ p.objId +")";
				break;
			case MSG_PRE_ACCEPT:
				label = "PreAccept";
				break;
			case MSG_PRE_ACCEPT_OK:
				label = "PreAcceptOk";
				break;
			case MSG_ACCEPT:
				label = "Accept";
				break;
			case MSG_ACCEPT_OK:
				label = "AcceptOk";
				break;
			case MSG_COMMIT:
				label = "Commit";
				break;
			case MSG_PREPARE:
				label = "Prepare("+ p.ballot.toString() +", "+ p.i +")";
				break; 
			case MSG_JOIN:
				label = "Join()";
				break;
		}	
		if (MSG_PRE_ACCEPT <= p.type && p.type <= MSG_COMMIT){
			var inst = p.instance;
			label += "("+ inst.cmd +", "+ inst.seq +", [";
			for (i = 0; i < inst.deps.length; i++){
				label += "(" + inst.deps[i].L + "," + inst.deps[i].i + "),";
			}
			if (i > 0){
				label = label.slice(0, -1);
			}
			label += "], "+ p.i +", "+ p.ballot.toString() +")";
		}
		drawNode(ctx, msg.x, msg.y, "m", label, msg.radius, "lightgreen", "black", "black"); 
	});
}
