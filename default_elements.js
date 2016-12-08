// Each element in emulation must have an update function and an update rate. These
// are called in the emulation main loop to update the state of the elements.
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
		}
	}
}

function Client(id){
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.radius = 16;
	this.framesPerUpdate = 100;
	this.requestCount = 0;
	this.update = function(){
	}
	this.recv = function(payload, src){
	}
}

function Link(p1, p2){
	this.p1 = p1;
	this.p2 = p2;
	this.x1;
	this.y1;
	this.x2;
	this.y2;
	this.framesPerUpdate = 100;
	this.update = function(){
	}
}

function Message(){
	this.x;
	this.y;
	this.radius = 5;
	this.dstX;
	this.dstY;
	this.dst;
	this.src;
	this.payload;
	this.framesPerUpdate = 1;
	this.com;
	this.speedX; // pixels per frame in x
	this.speedY; // pixels per frame in y
	this.updatesToArrive; // remaining frame until arrive to dst
	
	this.update = function(){
		if (! this.delivered){
			if (this.updatesToArrive <= 0){
				this.com.deliver(this);
			}else{
				this.x += this.speedX;
				this.y += this.speedY;
				this.updatesToArrive--;
			}			
		}
	}
}

function Communication(){
	this.deliveryTime = 500; //milliseconds
	this.send = function(payload, src, dst){
		var msg = new Message();
		msg.src = src;
		msg.x = src.x;
		msg.y = src.y;
		msg.dst = dst;
		msg.dstX = dst.x;
		msg.dstY = dst.y;
		msg.payload = payload;
		
		var time = this.deliveryTime;
		if(RANDOM_SPEED){
			time += this.deliveryTime * expDist(LAMBDA);
		}
		msg.updatesToArrive = Math.round(FRAME_RATE * time / 1000);
		msg.speedX = (msg.dstX - msg.x) / msg.updatesToArrive; // pixels per frame
		msg.speedY = (msg.dstY - msg.y) / msg.updatesToArrive; // pixels per frame
		
		msg.com = this;
		messages.push(msg);
		addElement(msg);
	}
	this.bcast = function(payload, src, dsts){
		var len = dsts.length;
		for (i = 0; i < len; i++){
			if (dsts[i] != src){
				this.send(payload, src, dsts[i]);
			}
		}
	}
	this.bcastL = function(payload, src, dsts){
		var self = this;
		dsts.iterate(callback = function(elm){
			if(elm != src){
				self.send(payload, src, elm);
			}
		});
	}
	this.deliver = function(msg){
		removeElement(msg);
		messages.removeFromBack(msg);
		msg.dst.recv(msg.payload, msg.src);		
	}
}



function drawLinks(ctx, links){	
	var len = links.length;
	for (i = 0; i < len; i++){
		var link = links[i];
		drawLine(ctx, link.x1, link.y1, link.x2, link.y2, "lightgrey");
	}
}

function drawMessages(ctx, messages){
	messages.iterate(function(msg){
		drawNode(ctx, msg.x, msg.y, "m", msg.src.id + "->" + msg.dst.id, msg.radius, "lightgreen", "black", "black"); 
	});
}

function drawProcesses(ctx, processes){
	var len = processes.length;
	for (i = 0; i < len; i++){
		var proc = processes[i];
		drawNode(ctx, proc.x, proc.y, "p" + proc.id, "", proc.radius, "lightblue", "black", "black");
	  //drawNode(ctx, x,      y,      letter,        label,radius,nodeColor,letterColor,labelColor)
	}
}
function drawProcessesL(ctx, processes){
	processes.iterate(
		callback = function(proc){
			drawNode(ctx, proc.x, proc.y, "p" + proc.id, "", proc.radius, "lightblue", "black", "black");
		}
	);
}

function drawClients(ctx, clients){
	var len = clients.length;
	for (i = 0; i < len; i++){
		var cli = clients[i];
		drawNode(ctx, cli.x, cli.y, "c" + cli.id, "", cli.radius, "lightgrey", "black", "black");
	}
}
