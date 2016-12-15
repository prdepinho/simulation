
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

	this.peekFront = function(){
		return this.front.value;
	}

	this.peekBack = function(){
		return this.back.value;
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

	this.iterateFromBack = function(callback, stopCondition){
		var it = this.back;
		if (stopCondition === undefined){
			while(it != undefined){
				callback(it.value);
				it = it.prev;
			}
		}else{
			while(it != undefined){
				callback(it.value);
				if (stopCondition(it.value)){
					return;
				}
				it = it.prev;
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

// ARRAY DICTIONARY
// A dictionary of arrays. It uses List as its data structure because
// it works better than a tree with monotonically increasing keys.
// It automatically sets an array when appending a value with a new key.
// Overwrite ArrayDictionary.keyEqual(keyA, keyB) to compare object keys.
function ArrayDictionary(){

	this.list = new List(); // of tuple {key,array}

	this.keyEqual = function(keyA, keyB){
		return keyA === keyB;
	}

	this.append = function(key, value){
		var self = this;
		var found = false;
		this.list.iterateFromBack(
			callback = function(val){
				if (self.keyEqual(val.key, key)){
					val.array.push(value);
					found = true;
				}
		}, 
			stopcondition = function(val){
				return found;
		});
		if (!found){
			this.list.push({key:key, array:[value]});
		}
	}

	this.length = function(key){
		var len = 0;
		var self = this;
		var found = false;
		this.list.iterateFromBack(
			callback = function(val){
				if (self.keyEqual(val.key, key)){
					len = val.array.length;
					found = true;
				}
		}, 
			stopcondition = function(val){
				return found;
		});
		return len;
	}

	this.getArray = function(key){
		var array = null;
		var self = this;
		var found = false;
		this.list.iterateFromBack(
			callback = function(val){
				if (self.keyEqual(val.key, key)){
					array = val.array;
					found = true;
				}
		}, 
			stopcondition = function(val){
				return found;
		});
		return array;
	}

	this.deleteArray = function(key){
		var self = this;
		this.list.equal = function(a,b){
			return self.keyEqual(a.key, b.key);
		}
		this.list.removeFromBack({key:key, array:[]});
	}
}
