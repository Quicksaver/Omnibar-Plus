moduleAid.VERSION = '1.0.0';
moduleAid.VARSLIST = ['panel', 'autoSelect'];

this.panel = document.getElementById('PopupAutoCompleteRichResult');

this.autoSelect = function() {
	panel.richlistbox.selectedIndex = 0;
	panel.richlistbox.currentIndex = 0;
};

moduleAid.LOADMODULE = function() {
	listenerAid.add(window.gURLBar, 'input', autoSelect, false);
	listenerAid.add(panel, 'popupshown', autoSelect, false);
};

moduleAid.UNLOADMODULE = function() {
	listenerAid.remove(window.gURLBar, 'input', autoSelect, false);
	listenerAid.remove(panel, 'popupshown', autoSelect, false);
};
