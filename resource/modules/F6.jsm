this.VERSION = '1.0.1';
this.VARSLIST = ['defaultF6key', 'keyset', 'commandSet', 'focusBar'];

// An F6 functionality was added in the latest Nightly versions, somehow my own function won't work if I just disable that default one
this.defaultF6key = document.getElementById('xxx_key33_Browser:FocusNextFrame');
this.keyset = null;
this.commandSet = null;

// function to use for our F6 command
this.focusBar = function() {
	if(!gURLBar.focused) { openLocation(); } 
	else { gBrowser.mCurrentBrowser.focus(); }
};

this.LOADMODULE = function() {
	commandSet = document.createElement('command');
	commandSet.id = 'command_'+objPathString+'_f6';
	commandSet.setAttribute('label', 'Focus Awesomebar');
	commandSet.setAttribute('oncommand', objName+'.focusBar();');
	
	commandSet = document.getElementById('mainCommandSet').appendChild(commandSet);
	
	if(defaultF6key) {
		defaultF6key.setAttribute('defaultCommand', defaultF6key.getAttribute('command'));
		defaultF6key.setAttribute('command', 'command_'+objPathString+'_f6');
	} else {
		keyset = document.createElement('keyset');
		keyset.id = 'keyset_'+objPathString;
		
		var key = document.createElement('key');
		key.id = 'key_'+objPathString+'_f6';
		key.setAttribute('label', 'Focus Awesomebar');
		key.setAttribute('command', 'command_'+objPathString+'_f6');
		key.setAttribute('keycode', 'VK_F6');
		
		keyset.appendChild(key);
		keyset = window.appendChild(keyset);
	}
};

this.UNLOADMODULE = function() {
	document.getElementById('mainCommandSet').removeChild(commandSet);
	
	if(defaultF6key) {
		defaultF6key.setAttribute('command', defaultF6key.getAttribute('defaultCommand'));
		defaultF6key.removeAttribute('defaultCommand');
	} else {
		window.removeChild(keyset);
	}
};
