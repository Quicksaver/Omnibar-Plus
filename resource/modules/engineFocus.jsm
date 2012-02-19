var engineName = document.getElementById('omnibar-defaultEngineName');
setWatchers(engineName);

var toggleEngineFocus = function() {
	if(prefAid.engineFocus) {
		engineName.addPropertyWatcher('value', openLocation);
	} else {
		engineName.removePropertyWatcher('value', openLocation);
	}
};

prefAid.init('engineFocus');
prefAid.listen('engineFocus', function() { toggleEngineFocus(); });

toggleEngineFocus();
