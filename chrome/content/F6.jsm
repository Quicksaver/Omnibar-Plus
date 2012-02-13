// An F6 functionality was added in the latest Nightly versions, somehow my own function won't work if I just disable that default one
var defaultF6key = document.getElementById('xxx_key33_Browser:FocusNextFrame');
var keyset = document.getElementById('key_'+objPathString+'_f6');

// function to use for our F6 command
var focusBar = function() {
	if(!gURLBar.focused) { openLocation(); } 
	else { gBrowser.mCurrentBrowser.focus(); }
};

var toggleF6 = function() {
	if(defaultF6key) {
		if(prefAid.f6) {
			if(!defaultF6key.getAttribute('defaultCommand')) {
				defaultF6key.setAttribute('defaultCommand', defaultF6key.getAttribute('command'));
			}
			defaultF6key.setAttribute('command', 'command_'+objPathString+'_f6');
		}
		else if(defaultF6key.getAttribute('defaultCommand')) {
			defaultF6key.setAttribute('command', defaultF6key.getAttribute('defaultCommand'));
		}
	}
	else {
		if(prefAid.f6) {
			keyset.removeAttribute('disabled');
		} else {
			keyset.setAttribute('disabled', 'true');
		}
	}
};

toggleF6();
