// This requires the utils module
moduleAid.load("chrome://"+objPathString+"/content/utils.jsm");

// There's a weird bug where the scheme will not be changed on the first change for some reason, so this prevents it
var schemeListener = function() {
	toggleAnimated(); 
	toggleAnimated();
	schemeListener = function() {
		toggleAnimated();
	};
};
prefAid.listen('animatedScheme', function() { schemeListener(); });

var usingRichlist = (gURLBar.popup == document.getElementById('PopupAutoComplete')) ? false : true;

var toggleAnimated = function() {
	styleAid.unload('animatedScheme');
	
	if(prefAid.animated) {
		gURLBar.popup.setAttribute('animatedPopup', prefAid.animatedScheme);
		styleAid.load('animatedPopup', 'chrome://'+objPathString+'/skin/autocompletepopup.css');
		styleAid.load('animatedScheme', 'chrome://'+objPathString+'/skin/'+prefAid.animatedScheme+'.css');
		
		if(!usingRichlist) {
			if(!gURLBar.popup._adjustHeight) {
				gURLBar.popup._adjustHeight = gURLBar.popup.adjustHeight;
			}
			gURLBar.popup.adjustHeight = modifyFunction(gURLBar.popup._adjustHeight, [
				['var rows = this.maxRows;',
				<![CDATA[
				var rows = Math.round(this.maxRows * 2.5);
				]]>
				]
			]);
		}
	} else {
		gURLBar.popup.removeAttribute('animatedPopup');
		styleAid.unload('animatedPopup');
		
		if(!usingRichlist) {
			if(gURLBar.popup._adjustHeight) {
				gURLBar.popup.adjustHeight = gURLBar.popup._adjustHeight;
			}
		}
	}
};

toggleAnimated();