moduleAid.VERSION = '1.0.0';
moduleAid.VARSLIST = [];

// dependsOn - object that adds a dependson attribute functionality to xul preference elements.
// Just add the attribute to the desired xul element and let the script do its thing. dependson accepts comma-separated strings in the following format:
//	[!]element[:value] where:
//		element - id of an element associated with a preference or the id of the preference element
//		(optional) ! - before element, checks for the opposite condition
//		(optional) :value - value is some specific value that element must have in order for the condition to return true
//	examples:
//		element1 - checks if element1 is true
//		element2:someValue - checks if element2 has value of 'someValue'
//		element3:5 - checks if element3 has value 5
//		!element4 - checks if element4 is false
//		!element5:someOtherValue - checks if element5 has any value other than 'someOtherValue'
this.dependsOn = {
	getAll: function() {
		return document.getElementsByAttribute('dependson', '*');
	},
	
	changed: function(e) {
		if(e.target.localName != 'preference' || !e.target.id) { return; }
		
		var fields = document.getElementsByAttribute('preference', e.target.id);
		var elements = dependsOn.getAll();
		var alreadyChanged = [];
		
		for(var f = 0; f < fields.length; f++) {
			if(!fields[f].id) { continue; }
			
			elementsInnerChangedLoop:
			for(var i = 0; i < elements.length; i++) {
				for(var a = 0; a < alreadyChanged.length; a++) {
					if(alreadyChanged[a] == i) {
						continue elementsInnerChangedLoop;
					}
				}
				
				if(elements[i].getAttribute('dependson').indexOf(fields[f].id) > -1) {
					dependsOn.updateElement(elements[i]);
					alreadyChanged.push(i);
				}
			}
		}
		
		elementsOuterChangedLoop:
		for(var i = 0; i < elements.length; i++) {
			for(var a = 0; a < alreadyChanged.length; a++) {
				if(alreadyChanged[a] == i) {
					continue elementsOuterChangedLoop;
				}
			}
			
			if(elements[i].getAttribute('dependson').indexOf(e.target.id) > -1) {
				dependsOn.updateElement(elements[i]);
				alreadyChanged.push(i);
			}
		}
	},
	
	updateAll: function() {
		var elements = this.getAll();
		for(var i = 0; i < elements.length; i++) {
			this.updateElement(elements[i]);
		}
	},
	
	updateElement: function(el) {
		var attr = el.getAttribute('dependson');
		if(!attr) { return; }
		
		var dependencies = attr.split(',');
		for(var i = 0; i < dependencies.length; i++) {
			var inverse = false;
			var dependency = dependencies[i].split(':');
			if(dependency[0].indexOf('!') > -1) {
				inverse = true;
				dependency[0] = dependency[0].replace('!', '');
			}
			
			dependency[0] = trim(dependency[0]);
			if(dependency[0] == '') { continue; }
			
			if(dependency.length == 2) {
				dependency[1] = trim(dependency[1]);
			}
			
			if(document.getElementById(dependency[0]).localName == 'preference') {
				var pref = document.getElementById(dependency[0]);
			} else {
				var pref = document.getElementById(document.getElementById(dependency[0]).getAttribute('preference'));
			}
			switch(pref.type) {
				case 'int':
					var value = (dependency.length == 2) ? parseInt(dependency[1]) : 0;
					break;
				case 'bool':
					var value = (dependency.length == 1) ? true : (dependency[1] == 'true') ? true : false;
					break;
				case 'string':
				default:
					var value = (dependency.length == 2) ? dependency[1] : '';
					break;
			}
			
			if( (!inverse && pref.value !== value) || (inverse && pref.value === value) ) {
				el.setAttribute('disabled', 'true');
				return;
			}
		}
		el.removeAttribute('disabled');
	}
};

moduleAid.LOADMODULE = function() {
	dependsOn.updateAll();
	listenerAid.add(window, "change", dependsOn.changed, false);
};

moduleAid.UNLOADMODULE = function() {
	listenerAid.remove(window, "change", dependsOn.changed, false);
}
