// An F6 functionality was added in the latest Nightly versions, somehow my own function won't work if I just disable that default one
this.defaultF6key = document.getElementById('xxx_key33_Browser:FocusNextFrame');
this.keyset = document.getElementById('key_'+objPathString+'_f6');

// function to use for our F6 command
this.focusBar = function() {
	if(!gURLBar.focused) { openLocation(); } 
	else { gBrowser.mCurrentBrowser.focus(); }
};

this.VARSLIST = ['defaultF6key', 'keyset', 'focusBar'];

this.LOADMODULE = function() {
	if(defaultF6key) {
		defaultF6key.setAttribute('defaultCommand', defaultF6key.getAttribute('command'));
		defaultF6key.setAttribute('command', 'command_'+objPathString+'_f6');
	} else {
		keyset.removeAttribute('disabled');
	}
};

this.UNLOADMODULE = function() {
	if(defaultF6key) {
		defaultF6key.setAttribute('command', defaultF6key.getAttribute('defaultCommand'));
		defaultF6key.removeAttribute('defaultCommand');
	} else {
		keyset.setAttribute('disabled', 'true');
	}
};
