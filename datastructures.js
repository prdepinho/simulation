
// TWO WAYS LINKED LIST
// Overwrite List.equal function to compare elements in the list.
// Use List.iterate to iterate the list and execute callback(value) for each element.

function LElm(value){
	this.prev;
	this.next;
	this.value = value;
}

function List(){
	this.front;
	this.back;
	this.length = 0;
	
	this.equal = function(elmA, elmB){
		return elmA === elmB;
	}

	this.copy = function(){
		var cp = new List();
		this.iterate(callback = function(elm){
			cp.push(elm);
		});
		return cp;
	}
	
	this.push = function(value){
		var elm = new LElm(value);
		if (this.back != undefined){
			this.back.next = elm;
			elm.prev = this.back;
		}else{
			this.front = elm;
		}
		this.back = elm;
		this.length++;
	}
	
	this.pop = function(){
		var elm = this.back;
		if (elm != undefined){
			if (elm.prev != undefined){
				elm.prev.next = undefined;
				this.back = elm.prev;
			}else{
				this.front = undefined;
			}
			this.length--;
		}
		return elm;
	}
	
	this.iterate = function(callback, stopCondition){
		var it = this.front;
		if (stopCondition === undefined){
			while(it != undefined){
				callback(it.value);
				it = it.next;
			}
		}else{
			while(it != undefined){
				callback(it.value);
				if (stopCondition(it.value)){
					return;
				}
				it = it.next;
			}
		}
	}
	
	this.removeFromBack = function(value){
		var it = this.back;
		while(it != undefined){
			if(this.equal(value, it.value)){
				if(it.prev != undefined){
					it.prev.next = it.next;
				}else{
					this.front = it.next;
				}
				if(it.next != undefined){
					it.next.prev = it.prev;
				}else{
					this.back = it.prev;
				}
				this.length--;
				return;
			}else{
				it = it.prev;
			}
		}
	}
	
}
