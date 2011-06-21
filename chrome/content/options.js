var OmnibarPlusOptions = {
	init: function() {
		// Move omnibar's preferences elements into their tabs
		OmnibarPlusOptions.pane = document.getElementById('mainPane');
		OmnibarPlusOptions.omnibartab = document.getElementById('tabPanels').firstChild;
		
		var j = 0;
		var h = OmnibarPlusOptions.pane.childNodes.length;
		for(var i=0; i<h; i++) {
			if(OmnibarPlusOptions.pane.childNodes[j].nodeName == 'preferences' || OmnibarPlusOptions.pane.childNodes[j].nodeName  == 'tabbox') {
				j++;
			} else {
				OmnibarPlusOptions.omnibartab.appendChild(OmnibarPlusOptions.pane.childNodes[j]);
			}
		}
		
		// The textboxes lose their values for some reason so we need to repopulate them, they stay attached to their preference however
		OmnibarPlusOptions.textboxes = document.getElementsByTagName('textbox');
		for(var i=0; i<OmnibarPlusOptions.textboxes.length; i++) {
			OmnibarPlusOptions.textboxes[i].value = document.getElementById(OmnibarPlusOptions.textboxes[i].getAttribute('preference')).value;
		}
	}
}

window.addEventListener("load", OmnibarPlusOptions.init, false);