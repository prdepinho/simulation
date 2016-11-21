
// BASIC GEOMETRIC FUNCTIONS

function drawNode(ctx, x, y, letter, label, radius, nodeColor, letterColor, labelColor){
	if (letter === undefined){
		letter = "";
	}
	if (label === undefined){
		label = "";
	}
	if (nodeColor === undefined){
		nodeColor = "blue";
	}
	if (letterColor === undefined){
		letterColor = "white";
	}
	if (labelColor === undefined){
		labelColor = "black";
	}
	if (radius === undefined){
		radius = 16;
	}
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, 2*Math.PI);
	ctx.fillStyle = nodeColor;
	ctx.fill();
	ctx.strokeStyle = "black";
	ctx.stroke();
	
	ctx.textAlign = "center";
	ctx.fillStyle = letterColor;
	ctx.font = radius + "px arial";
	ctx.fillText(letter, x, y + radius /3);
	ctx.fillStyle = labelColor;
	ctx.font = "12px Arial";
	ctx.fillText(label, x, y + radius + 13);
}


function drawNodeProgressBar(ctx, nodeX, nodeY, radius, progress, color){
	if (color === undefined){
		color === "blue";
	}
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.fillRect(nodeX - radius, nodeY + radius * 3 * 3/4, radius * 2 * progress, radius / 2);
	ctx.rect(nodeX - radius, nodeY + radius * 3 * 3/4, radius * 2, radius / 2);
	ctx.strokeStyle = "black";
	ctx.stroke();	
	
}

function drawLine(ctx, x1, y1, x2, y2, color){
	if (color === undefined){
		color === "grey";
	}
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = color;
	ctx.stroke();
}
