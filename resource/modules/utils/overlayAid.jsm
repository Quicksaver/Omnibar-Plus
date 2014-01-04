moduleAid.VERSION = '2.4.5';
moduleAid.LAZY = true;

// overlayAid - to use overlays in my bootstraped add-ons. The behavior is as similar to what is described in https://developer.mozilla.org/en/XUL_Tutorial/Overlays as I could manage.
// When a window with an overlay is opened, the elements in both the window and the overlay with the same ids are combined together.
// The children of matching elements are added to the end of the set of children in the window's element.
// Attributes that are present on the overlay's elements will be applied to the window's elements.
// Overlays can also have their own:
//	stylesheets by placing at the top of the overlay: <?xml-stylesheet href="chrome://addon/skin/sheet.css" type="text/css"?>
//	DTD's by the usual method: <!DOCTYPE window [ <!ENTITY % nameDTD SYSTEM "chrome://addon/locale/file.dtd"> %nameDTD; ]>
//	scripts using the script tag when as a direct child of the overlay element (effects of these won't be undone when unloading the overlay, I have to 
//		undo it in the onunload function passed to overlayURI() ). Any script that changes the DOM structure might produce unpredictable results!
//		To avoid using eval unnecessarily, only scripts with src will be imported for now.
// The overlay element surrounds the overlay content. It uses the same namespace as XUL window files. The id of these items should exist in the window's content.
// Its content will be added to the window where a similar element exists with the same id value. If such an element does not exist, that part of the overlay is ignored.
// If there is content inside both the XUL window and in the overlay, the window's content will be used as is and the overlay's content will be appended to the end.
// The children of the overlay's element are inserted as children of the base window's element.
//	If the overlay's element contains an insertafter attribute, the element is added just after the element in the base window with the id that matches the value of this attribute.
//	If the overlay's element contains an insertbefore attribute, the element is added just before the element in the base window with the id that matches the value of this attribute.
//	If the overlay's element contains an position attribute, the element is added at the one-based index specified in this attribute.
//	Otherwise, the element is added as the last child.
// If you would like to remove an element that is already in the XUL file, create elements with removeelement attribute.
// To move an already existant node to another place, add a newparent attribute with the id of the new parent element. If it exists, it will be moved there. This can be used
//	together with insertafter, insertbefore and position attributes, which will be relative to the new parent and consequently new siblings.
// For overlaying preferences dialogs, you can add new preferences in an unnamed <preferences> element. They will be added to an already existing <preferences> element if present,
// or the whole element will be overlayed if not.
// Elements with a getchildrenof attribute will inherit all the children from the elements specified by the comma-separated list of element ids.
// Every occurence of (string) objName and (string) objPathString in every attribute in the overlay will be properly replaced with this object's objName and objPathString.
// I can also overlay other overlays provided they are loaded through the overlayAid object (either from this add-on or another implementing it).
// Attention: avoid using "removeelement" in toolbars and widgets; this probably won't play well with Australis as I haven't tested a lot here.
// 
// overlayURI(aURI, aWith, beforeload, onload, onunload) - overlays aWith in all windows with aURI
//	aURI - (string) uri to be overlayed
//	aWith - (string) uri to overlay aURI, can be fileName found as chrome://objPathString/content/fileName.xul or already the full uri path
//	(optional) beforeload ( function(window) ) is called before the window is overlayed, expects a (object) window argument
//	(optional) onload - ( function(window) ) to be called when aURI is overlayed with aWith, expects a (object) window argument
//	(optional) onunload - ( function(window) ) to be called when aWith is unloaded from aURI, expects a (object) window argument
// removeOverlayURI(aURI, aWith) - removes aWith overlay from all windows with aURI
//	see overlayURI()
// overlayWindow(aWindow, aWith, beforeload, onload, onunload) - overlays aWindow with aWith
//	aWindow - (object) window object to be overlayed
//	see overlayURI()
// removeOverlayWindow(aWindow, aWith) - removes aWith overlay from aWindow
//	see overlayWindow()
// loadedURI(aURI, aWith) - returns (int) with corresponding overlay index in overlays[] if overlay aWith has been loaded for aURI, returns (bool) false otherwise 
//	see overlayURI()
// loadedWindow(aWindow, aWith, loaded) -	returns (int) with corresponding overlay index in aWindow['_OVERLAYS_'+objName][] if overlay aWith has been loaded for aWindow,
//						returns (bool) false otherwise 
//	(optional) loaded - if true it will only return true if the overlay has been actually loaded into the window, rather than just added to the array. Defaults to false.
//	see overlayWindow()
this.overlayAid = {
	overlays: [],
	
	overlayURI: function(aURI, aWith, beforeload, onload, onunload) {
		var path = this.getPath(aWith);
		if(!path || this.loadedURI(aURI, path) !== false) { return; }
		
		var newOverlay = {
			uri: aURI,
			overlay: path,
			beforeload: beforeload || null,
			onload: onload || null,
			onunload: onunload || null,
			document: null,
			ready: false,
			persist: {}
			
		};
		this.overlays.push(newOverlay);
		
		xmlHttpRequest(path, function(xmlhttp) {
			if(xmlhttp.readyState === 4) {
				// We can't get i from the push before because we can be adding and removing overlays at the same time,
				// which since this is mostly an asynchronous process, would screw up the counter.
				for(var i=0; i<overlayAid.overlays.length; i++) {
					if(overlayAid.overlays[i].uri == aURI && overlayAid.overlays[i].overlay == path) { break; }
				}
				if(!overlayAid.overlays[i]) { return; } // this can happen if switch on and off an overlay too quickly I guess..
				
				overlayAid.overlays[i].document = xmlhttp.responseXML;
				
				if(overlayAid.overlays[i].document.querySelector('parsererror')) {
					Cu.reportError(overlayAid.overlays[i].document.querySelector('parsererror').textContent);
					return;
				}
				
				replaceObjStrings(overlayAid.overlays[i].document);
				overlayAid.cleanXUL(overlayAid.overlays[i].document, overlayAid.overlays[i]);
				overlayAid.overlays[i].ready = true;
				windowMediator.callOnAll(overlayAid.scheduleAll);
				browserMediator.callOnAll(overlayAid.scheduleBrowser);
			}
		});
	},
	
	removeOverlayURI: function(aURI, aWith) {
		var path = this.getPath(aWith);
		if(!path) { return; }
		
		var i = this.loadedURI(aURI, path);
		if(i === false) { return; }
		
		// I sometimes call removeOverlayURI() when unloading modules, but these functions are also called when shutting down the add-on, preventing me from unloading the overlays.
		// This makes it so it keeps the reference to the overlay when shutting down so it's properly removed in unloadAll() if it hasn't been done so already.
		if(!UNLOADED) {
			this.overlays.splice(i, 1);
		}
		
		windowMediator.callOnAll(function(aWindow) {
			overlayAid.scheduleUnOverlay(aWindow, path);
		});
		browserMediator.callOnAll(function(aWindow) {
			overlayAid.unscheduleBrowser(aWindow, path);
		});
	},
	
	overlayWindow: function(aWindow, aWith, beforeload, onload, onunload) {
		var path = this.getPath(aWith);
		if(!path || this.loadedWindow(aWindow, path) !== false) { return; }
		
		var newOverlay = {
			uri: path,
			traceBack: [],
			removeMe: function() { overlayAid.removeOverlay(aWindow, this); },
			time: 0,
			beforeload: beforeload || null,
			onload: onload || null,
			onunload: onunload || null,
			document: null,
			ready: false,
			loaded: false,
			remove: false,
			persist: {}
		};
		
		if(typeof(aWindow['_OVERLAYS_'+objName]) == 'undefined') {
			aWindow['_OVERLAYS_'+objName] = [];
			this.addToAttr(aWindow);
		}
		aWindow['_OVERLAYS_'+objName].push(newOverlay);
		
		xmlHttpRequest(path, function(xmlhttp) {
			if(xmlhttp.readyState === 4) {
				// We can't get i from the push before because we can be adding and removing overlays at the same time,
				// which since this is mostly an asynchronous process, would screw up the counter.
				if(!aWindow['_OVERLAYS_'+objName]) { return; } // just a failsafe, this shouldn't happen if everything is properly built
				for(var i=0; i<aWindow['_OVERLAYS_'+objName].length; i++) {
					if(aWindow['_OVERLAYS_'+objName][i].uri == path) { break; }
				}
				if(!aWindow['_OVERLAYS_'+objName][i]) { return; } // this can happen if switch on and off an overlay too quickly I guess..
				
				aWindow['_OVERLAYS_'+objName][i].document = xmlhttp.responseXML;
				
				if(aWindow['_OVERLAYS_'+objName][i].document.querySelector('parsererror')) {
					Cu.reportError(aWindow['_OVERLAYS_'+objName][i].document.querySelector('parsererror').textContent);
					return;
				}
				
				replaceObjStrings(aWindow['_OVERLAYS_'+objName][i].document);
				overlayAid.cleanXUL(aWindow['_OVERLAYS_'+objName][i].document, aWindow['_OVERLAYS_'+objName][i]);
				aWindow['_OVERLAYS_'+objName][i].ready = true;
				overlayAid.scheduleAll(aWindow);
			}
		});
	},
	
	removeOverlayWindow: function(aWindow, aWith) {
		var path = this.getPath(aWith);
		if(!path) { return; }
		
		var i = this.loadedWindow(aWindow, path);
		if(i === false) { return; }
		
		aWindow['_OVERLAYS_'+objName][i].remove = true;
		
		overlayAid.scheduleUnOverlay(aWindow, path);
	},
	
	loadedURI: function(aURI, aWith) {
		var path = this.getPath(aWith);
		for(var i = 0; i < this.overlays.length; i++) {
			if(this.overlays[i].uri == aURI && this.overlays[i].overlay == path) {
				return i;
			}
		}
		return false;
	},
	
	loadedWindow: function(aWindow, aWith, loaded) {
		// We have to look not only for this object's array but also for other possible ones from other add-ons
		var allAttr = this.getAllInAttr(aWindow);
		for(var y=0; y<allAttr.length; y++) {
			var x = '_OVERLAYS_'+allAttr[y];
			if(!aWindow[x]) { continue; }
			
			for(var i = 0; i < aWindow[x].length; i++) {
				if(aWindow[x][i].uri == aWith) {
					return (!loaded || aWindow[x][i].loaded) ? i : false;
				}
			}
		}
		return false;
	},
	
	getPath: function(aPath) {
		// Only load overlays that belong to this add-on
		if(aPath.indexOf("chrome://") === 0 && aPath.indexOf("chrome://"+objPathString+"/") !== 0) { return null; }
		
		return (aPath.indexOf("chrome://") === 0) ? aPath : "chrome://"+objPathString+"/content/"+aPath+".xul";
	},
	
	cleanXUL: function(node, overlay) {
		if(node.attributes && node.getAttribute('persist') && node.id) {
			var persists = node.getAttribute('persist').split(' ');
			overlay.persist[node.id] = {};
			for(var p=0; p<persists.length; p++) {
				overlay.persist[node.id][persists[p]] = true;
			}
		}
		
		if(!Australis) {
			if(node.nodeName == 'toolbar' && node.id) {
				if(!overlay.persist[node.id]) {
					overlay.persist[node.id] = {};
				}
				overlay.persist[node.id]['currentset'] = true;
			}
			
			if(node.parentNode && node.parentNode.nodeName == 'toolbarpalette') {
				if(!overlay.persist[node.id]) {
					overlay.persist[node.id] = {};
				}
				overlay.persist[node.id]['insertInToolbar'] = true;
				overlay.persist[node.id]['_toolbarSet'] = true;
			}
		}
		
		if(node.nodeName == 'xml-stylesheet') {
			replaceObjStrings(node, 'textContent');
		}
		
		var curChild = node.firstChild;
		while(curChild) {
			if((curChild.nodeName == '#text' && !curChild.id && trim(curChild.nodeValue) === '') // remove useless #text elements
			|| (curChild.nodeName == 'script' && node.nodeName != 'overlay') // remove script tags that won't be inserted into the overlayed document
			) {
				var nextChild = curChild.nextSibling;
				node.removeChild(curChild);
				curChild = nextChild;
				continue;
			}
			
			this.cleanXUL(curChild, overlay);
			curChild = curChild.nextSibling;
		}
	},
	
	isPersist: function(overlay, id, attr) {
		if(!id && !attr) {
			for(var x in overlay.persist) {
				return true;
			}
			return true;
		}
		
		if(overlay.persist[id]) {
			if(attr && !overlay.persist[id][attr]) {
				return false;
			}
			return true;
		}
		return false;
	},
	
	persistOverlay: function(aWindow, overlay) {
		if(!this.isPersist(overlay)) {
			return;
		}
		
		var allRes = {};
		function showArcs(res, arcs) {
			while(arcs.hasMoreElements()) {
				var curArc = arcs.getNext().QueryInterface(Ci.nsIRDFResource);
				var arcTargets = PlacesUIUtils.localStore.GetTargets(res, curArc, true);
				while(arcTargets.hasMoreElements()) {
					var curTarget = arcTargets.getNext();
					try {
						curTarget.QueryInterface(Ci.nsIRDFLiteral);
						
						var sources = res.Value.split('#');
						if(!allRes[sources[0]]) { allRes[sources[0]] = {}; }
						if(sources[1]) {
							if(!allRes[sources[0]][sources[1]]) { allRes[sources[0]][sources[1]] = {}; }
							allRes[sources[0]][sources[1]][curArc.Value] = curTarget.Value;
						} else {
							allRes[sources[0]][curArc.Value] = curTarget.Value;
						}
					}
					catch(e) {
						if(curTarget.Value) {
							showArcs(curTarget, PlacesUIUtils.localStore.ArcLabelsOut(curTarget));
						}
					}
				}
			}
		}
		
		var allResources = PlacesUIUtils.localStore.GetAllResources();
		while(allResources.hasMoreElements()) {
			var curResource = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
			showArcs(curResource, PlacesUIUtils.localStore.ArcLabelsOut(curResource));
		}
		
		var uri = aWindow.document.baseURI;
		if(!allRes[uri]) { return; }
		var toolboxes = aWindow.document.querySelectorAll('toolbox');
		
		if(!Australis) {
			for(var id in overlay.persist) {
				if(overlay.persist[id]['insertInToolbar'] && (!allRes[uri][id] || !allRes[uri][id]['insertInToolbar'])) {
					var node = aWindow.document.getElementById(id);
					if(!node) {
						toolboxes_loop: for(var t=0; t<toolboxes.length; t++) {
							if(!toolboxes[t].palette) { continue; }
							
							for(var c=0; c<toolboxes[t].palette.childNodes.length; c++) {
								if(toolboxes[t].palette.childNodes[c].id == id) {
									node = toolboxes[t].palette.childNodes[c];
									break toolboxes_loop;
								}
							}
						}
					}
					
					if(!allRes[uri][id]) {
						allRes[uri][id] = {};
					}
					allRes[uri][id]['insertInToolbar'] = (node && node.getAttribute('insertInToolbar')) ? node.getAttribute('insertInToolbar') : '__empty';
					allRes[uri][id]['_toolbarSet'] = (node && node.getAttribute('_toolbarSet')) ? node.getAttribute('_toolbarSet') : '__empty';
				}
			}
		}
		
		for(var id in allRes[uri]) {
			var node = aWindow.document.getElementById(id);
			
			if(this.isPersist(overlay, id)) {
				if(!node) {
					if(!Australis && !this.isPersist(overlay, id, 'insertInToolbar')) { continue; }
					toolboxes_loop: for(var t=0; t<toolboxes.length; t++) {
						if(!toolboxes[t].palette) { continue; }
						
						for(var c=0; c<toolboxes[t].palette.childNodes.length; c++) {
							if(toolboxes[t].palette.childNodes[c].id == id) {
								node = toolboxes[t].palette.childNodes[c];
								break toolboxes_loop;
							}
						}
					}
				}
				
				if(!node) { continue; }
				
				for(var attr in allRes[uri][id]) {
					if(this.isPersist(overlay, id, attr)) {
						if(allRes[uri][id][attr] == '__empty') {
							setAttribute(node, attr, '');
						} else {
							toggleAttribute(node, attr, allRes[uri][id][attr], allRes[uri][id][attr]);
						}
						
						if(Australis) { continue; }
						
						if(attr == 'currentset'
						&& allRes[uri][id][attr]
						&& allRes[uri][id][attr] != '__empty'
						&& node.nodeName == 'toolbar'
						&& trueAttribute(node, 'customizable')
						&& node.getAttribute('toolboxid')
						&& aWindow.document.getElementById(node.getAttribute('toolboxid'))
						&& (this.tracedAction(aWindow, 'appendChild', node) || this.tracedAction(aWindow, 'insertBefore', node))) {
							aWindow.document.persist(id, 'currentset');
							
							var palette = aWindow.document.getElementById(node.getAttribute('toolboxid')).palette;
							if(!palette) { continue; }
							closeCustomize();
							
							var currentset = node.getAttribute('currentset').split(',');
							currentset_loop: for(var c=0; c<currentset.length; c++) {
								if(currentset[c] == 'separator' || currentset[c] == 'spring' || currentset[c] == 'spacer') {
									var newNode = aWindow.document.createElement('toolbar'+currentset[c]);
									var newNodeID = new Date().getTime();
									while(aWindow.document.getElementById(currentset[c]+newNodeID)) {
										newNodeID++;
									}
									newNode.id = currentset[c]+newNodeID;
									newNode.setAttribute('removable', 'true');
									if(currentset[c] == 'spring') {
										newNode.setAttribute('flex', '1');
									}
									node.appendChild(newNode);
									continue;
								}
								
								var button = palette.firstChild;
								while(button) {
									if(button.id == currentset[c]) {
										var addButton = button;
										var updateListButton = this.updateOverlayedNodes(aWindow, addButton);
										button = button.nextSibling;
										// insertItem doesn't seem to be defined until the toolbar becomes visible
										if(node.insertItem) { node.insertItem(addButton.id); }
										else { addButton = node.appendChild(addButton); }
										this.updateOverlayedNodes(aWindow, addButton, updateListButton);
										continue currentset_loop;
									}
									button = button.nextSibling;
								}
								
								// Fix for TotalToolbar creating a browser palette node as a child of the navigator-toolbox element.
								button = aWindow.document.getElementById(currentset[c]);
								if(button && button.parentNode.id == palette.id) {
									var addButton = button;
									var updateListButton = this.updateOverlayedNodes(aWindow, addButton);
									addButton = palette.appendChild(addButton);
									// insertItem doesn't seem to be defined until the toolbar becomes visible
									if(node.insertItem) { node.insertItem(addButton.id); }
									else { addButton = node.appendChild(addButton); }
									this.updateOverlayedNodes(aWindow, addButton, updateListButton);
									continue currentset_loop;
								}
								
								// Bugfix: some buttons, like LastPass toolbar button, force themselves into the default toolbar on startup.
								if(button) {
									this.moveAround(aWindow, button, null, node);
								}
							}
						}
						
						else if(attr == 'insertInToolbar') {
							if(node.parentNode.nodeName == 'toolbarpalette' && node.getAttribute(attr)) {
								var toolbar = aWindow.document.getElementById(node.getAttribute(attr));
								if(toolbar) {
									var b4 = null;
									var shift = -1;
									var toolbarSet = allRes[uri][id]['_toolbarSet'] || node.getAttribute('_toolbarSet');
									if(toolbarSet) {
										toolbarSet = toolbarSet.split(',');
										for(var s=0; s<toolbarSet.length; s++) {
											if(shift == -1) {
												if(toolbarSet[s] == id) { shift = 0; }
												continue;
											}
											
											if(toolbarSet[s] == 'separator' || toolbarSet[s] == 'spring' || toolbarSet[s] == 'spacer') {
												shift++;
												continue;
											}
											
											b4 = aWindow.document.getElementById(toolbarSet[s]);
											if(b4 && b4.parentNode != toolbar) { b4 = null; }
											
											if(b4) { break; }
										}
									}
									
									while(shift > 0) {
										if(!b4) {
											b4 = toolbar.lastChild;
											if(!b4) { break; }
											shift--;
											continue;
										}
										
										if(!b4.previousSibling) {
											shift = 0;
											break;
										}
										
										if(b4.previousSibling.nodeName == 'toolbarseparator'
										|| b4.previousSibling.nodeName == 'toolbarspring'
										|| b4.previousSibling.nodeName == 'toolbarspacer') {
											b4 = b4.previousSibling;
											shift--;
										}
									}
									
									var updateListButton = this.updateOverlayedNodes(aWindow, node);
									// insertItem doesn't seem to be defined until the toolbar becomes visible
									if(b4) {
										if(toolbar.insertItem) { toolbar.insertItem(node.id, b4); }
										else { node = toolbar.insertBefore(node, b4); }
									} else {
										if(toolbar.insertItem) { toolbar.insertItem(node.id); }
										else { node = toolbar.appendChild(node); }
									}
									this.updateOverlayedNodes(aWindow, node, updateListButton);
									
									setAttribute(toolbar, 'currentset', toolbar.currentSet);
									aWindow.document.persist(toolbar.id, 'currentset');
								}
							}
							
							this.persistToolbarButton(aWindow, node);
						}
					}
				}
			}
		}
	},
	
	persistToolbarButton: function(aWindow, aNode) {
		var aNodeID = aNode.id;
		
		var persistListener = function() {
			var node = aWindow.document.getElementById(aNodeID);
			var testNode = node;
			if(!node) {
				var toolboxes = aWindow.document.querySelectorAll('toolbox');
				toolboxes_loop: for(var t=0; t<toolboxes.length; t++) {
					if(!toolboxes[t].palette) { continue; }
					
					for(var c=0; c<toolboxes[t].palette.childNodes.length; c++) {
						if(toolboxes[t].palette.childNodes[c].id == aNodeID) {
							node = toolboxes[t].palette.childNodes[c];
							break toolboxes_loop;
						}
					}
				}
			}
			if(!node) { return; } // Fail-safe
			
			if(node.parentNode.nodeName == 'toolbarpalette') {
				setAttribute(node, 'insertInToolbar', '');
				setAttribute(node, '_toolbarSet', '');
			} else {
				setAttribute(node, 'insertInToolbar', node.parentNode.id);
				setAttribute(node, '_toolbarSet', node.parentNode.getAttribute('currentset'));
			}
			
			if(!testNode) {
				var tempNode = aWindow.document.createElement('toolbarbutton'); // most common will be toolbarbutton, even though element type doesn't really matter here
				tempNode.id = aNodeID;
				tempNode.hidden = true;
				tempNode = aWindow.document.documentElement.appendChild(tempNode);
			}
			
			aWindow.document.persist(aNodeID, 'insertInToolbar');
			aWindow.document.persist(aNodeID, '_toolbarSet');
			
			if(!testNode) {
				tempNode.parentNode.removeChild(tempNode);
			}
		};
		
		aNode._removePersistListener = function() {
			aWindow.removeEventListener('aftercustomization', persistListener);
		};
		
		aWindow.addEventListener('aftercustomization', persistListener);
		persistListener();
		
		this.traceBack(aWindow, {
			action: 'persistToolbarButton',
			node: aNode
		});
	},
	
	observingSchedules: function(aSubject, aTopic) {
		if(UNLOADED) { return; }
		
		overlayAid.scheduleAll(aSubject);
	},
	
	scheduleAll: function(aWindow) {
		// On shutdown, this could cause errors since we do aSync's here and it wouldn't find the object after it's been removed.
		if(UNLOADED) { return; }
		
		if(aWindow.document.readyState != 'complete') {
			callOnLoad(aWindow, overlayAid.scheduleAll);
			return;
		}
		
		aSync(function() {
			// This still happens sometimes I have no idea why
			if(typeof(overlayAid) == 'undefined') { return; }
			overlayAid.overlayAll(aWindow);
		});
	},
	
	scheduleUnOverlay: function(aWindow, aWith) {
		// On shutdown, this could cause errors since we do aSync's here and it wouldn't find the object after it's been removed.
		if(UNLOADED) {
			this.unloadSome(aWindow, aWith);
			return;
		}
		
		if(!aWindow._UNLOAD_OVERLAYS) {
			aWindow._UNLOAD_OVERLAYS = [];
		}
		aWindow._UNLOAD_OVERLAYS.push(aWith);
		
		this.overlayAll(aWindow);
	},
	
	scheduleBrowser: function(aWindow) {
		if(!(aWindow.document instanceof aWindow.XULDocument)) { return; } // at least for now I'm only overlaying xul documents
		overlayAid.scheduleAll(aWindow);
	},
	
	unscheduleBrowser: function(aWindow, aWith) {
		if(!(aWindow.document instanceof aWindow.XULDocument)) { return; } // at least for now I'm only overlaying xul documents
		overlayAid.scheduleUnOverlay(aWindow, aWith);
	},
	
	unloadSome: function(aWindow, aWith) {
		var i = this.loadedWindow(aWindow, aWith);
		if(i !== false) {
			this.removeInOrder(aWindow, aWindow['_OVERLAYS_'+objName][i].time);
			if(!aWindow.closed && !aWindow.willClose) {
				aWindow._RESCHEDULE_OVERLAY = true;
			}
		}
	},
		
	unloadAll: function(aWindow) {
		if(typeof(aWindow['_OVERLAYS_'+objName]) != 'undefined') {
			if(aWindow['_OVERLAYS_'+objName].length > 0) {
				// only need to check for the first entry from this array, all subsequent will be unloaded before this one and reloaded afterwards if needed
				overlayAid.removeInOrder(aWindow, aWindow['_OVERLAYS_'+objName][0].time);
			}
					
			delete aWindow['_OVERLAYS_'+objName];
			delete aWindow._BEING_OVERLAYED;
			overlayAid.removeFromAttr(aWindow);
			aWindow._RESCHEDULE_OVERLAY = true;
		}
		
		if(aWindow._RESCHEDULE_OVERLAY && !aWindow.closed && !aWindow.willClose) {
			delete aWindow._RESCHEDULE_OVERLAY;
			observerAid.notify('window-overlayed', aWindow);
		}
	},
	
	unloadBrowser: function(aWindow) {
		if(!(aWindow.document instanceof aWindow.XULDocument)) { return; } // at least for now I'm only overlaying xul documents
		overlayAid.unloadAll(aWindow);
	},
	
	closedBrowser: function(aWindow) {
		if(!(aWindow.document instanceof aWindow.XULDocument)) { return; } // at least for now I'm only overlaying xul documents
		aWindow.willClose = true;
		overlayAid.unloadAll(aWindow);
	},
	
	traceBack: function(aWindow, traceback, unshift) {
		if(traceback.node) { traceback.nodeID = traceback.node.id; }
		if(traceback.originalParent) { traceback.originalParentID = traceback.originalParent.id; }
		if(traceback.palette) { traceback.paletteID = traceback.palette.id; }
		
		if(!unshift) {
			aWindow['_OVERLAYS_'+objName][aWindow._BEING_OVERLAYED].traceBack.push(traceback);
		} else {
			aWindow['_OVERLAYS_'+objName][aWindow._BEING_OVERLAYED].traceBack.unshift(traceback);
		}
	},
	
	tracedAction: function(aWindow, action, node) {
		var i = aWindow._BEING_OVERLAYED;
		
		for(var j = aWindow['_OVERLAYS_'+objName][i].traceBack.length -1; j >= 0; j--) {
			if(aWindow['_OVERLAYS_'+objName][i].traceBack[j].action == action) {
				var compareNode = aWindow['_OVERLAYS_'+objName][i].traceBack[j].node || aWindow.document.getElementById(aWindow['_OVERLAYS_'+objName][i].traceBack[j].nodeID);
				if(isAncestor(node, compareNode)) {
					return true;
				}
			}
		}
		return false;
	},
	
	updateOverlayedNodes: function(aWindow, node, nodeList) {
		if(nodeList != undefined) {
			for(var k = 0; k < nodeList.length; k++) {
				aWindow[nodeList[k].x][nodeList[k].i].traceBack[nodeList[k].j][nodeList[k].nodeField] = node;
			}
			return true;
		}
		
		nodeList = [];
		var allAttr = this.getAllInAttr(aWindow);
		for(var y=0; y<allAttr.length; y++) {
			var x = '_OVERLAYS_'+allAttr[y];
			if(!aWindow[x]) { continue; }
			
			for(var i = 0; i < aWindow[x].length; i++) {
				for(var j = 0; j < aWindow[x][i].traceBack.length; j++) {
					if(aWindow[x][i].traceBack[j].node && aWindow[x][i].traceBack[j].node == node) {
						nodeList.push({ x: x, i: i, j: j, nodeField: 'node' });
					}
					else if(aWindow[x][i].traceBack[j].originalParent && aWindow[x][i].traceBack[j].originalParent == node) {
						nodeList.push({ x: x, i: i, j: j, nodeField: 'originalParent' });
					}
				}
			}
		}
		return nodeList;
	},
	
	getNewOrder: function(aWindow) {
		var time = new Date().getTime();
		var allAttr = this.getAllInAttr(aWindow);
		for(var y=0; y<allAttr.length; y++) {
			var x = '_OVERLAYS_'+allAttr[y];
			if(!aWindow[x]) { continue; }
			
			for(var i=0; i<aWindow[x].length; i++) {
				if(aWindow[x][i].time > time) {
					time = aWindow[x][i].time +1;
				}
			}
		}
		return time;
	},
	
	removeInOrder: function(aWindow, first) {
		if(first === 0) { return; } // already unloaded
		
		// I need to check, in the off-chance another add-on started overlaying at roughly the same time, setting this var first
		if(typeof(aWindow._BEING_OVERLAYED) == 'undefined') {
			aWindow._BEING_OVERLAYED = 'removing_'+objName;
		}
		
		var overlayList = [];
		var allAttr = this.getAllInAttr(aWindow);
		for(var y=0; y<allAttr.length; y++) {
			var x = '_OVERLAYS_'+allAttr[y];
			if(!aWindow[x]) { continue; }
			
			for(var i=0; i<aWindow[x].length; i++) {
				if(aWindow[x][i].time >= first) {
					overlayList.push({ x: x, i: i, time: aWindow[x][i].time });
				}
			}
		}
		overlayList.sort(function(a,b) { return b.time-a.time; });
		
		for(var u=0; u<overlayList.length; u++) {
			aWindow[overlayList[u].x][overlayList[u].i].removeMe();
		}
		
		// I need to check, in the off-chance another add-on started overlaying at roughly the same time, setting this var first
		if(aWindow._BEING_OVERLAYED && aWindow._BEING_OVERLAYED == 'removing_'+objName) {
			delete aWindow._BEING_OVERLAYED;
		}
	},
	
	removeOverlay: function(aWindow, overlay) {
		var allAttr = this.getAllInAttr(aWindow);
		loop_lookForArray: for(var y=0; y<allAttr.length; y++) {
			var x = '_OVERLAYS_'+allAttr[y];
			if(!aWindow[x]) { continue; }
			
			for(var i=0; i<aWindow[x].length; i++) {
				if(aWindow[x][i] == overlay) {
					break loop_lookForArray;
				}
			}
		}
		if(typeof(aWindow[x][i]) == 'undefined') { return; } // failsafe, shouldn't be triggered
		
		if(aWindow[x][i].loaded && aWindow[x][i].onunload) {
			try { aWindow[x][i].onunload(aWindow); }
			catch(ex) { Cu.reportError(ex); }
		}
		
		// If the window has been closed, there's no point in regressing all of the DOM changes, only the actual unload scripts may be necessary
		if(aWindow.closed || aWindow.willClose) {
			if(!aWindow[x][i].document || aWindow[x][i].remove) {
				aWindow[x].splice(i, 1);
			} else {
				aWindow[x][i].loaded = false;
				aWindow[x][i].traceBack = [];
				aWindow[x][i].time = 0;
			}
			return;
		}
		
		var toolboxes = aWindow.document.querySelectorAll('toolbox');
		
		for(var j = aWindow[x][i].traceBack.length -1; j >= 0; j--) {
			var action = aWindow[x][i].traceBack[j];
			if(action.nodeID) { action.node = action.node || aWindow.document.getElementById(action.nodeID); }
			if(action.originalParentID) { action.originalParent = action.originalParent || aWindow.document.getElementById(action.originalParentID); }
			if(action.paletteID && !action.palette) {
				var toolbox = aWindow.document.querySelectorAll('toolbox');
				for(var a=0; a<toolbox.length; a++) {
					if(toolbox[a].palette && toolbox[a].palette.id == action.paletteID) {
						action.palette = toolbox[a].palette;
						
						if(!action.node && action.nodeID) {
							for(var c=0; c<action.palette.childNodes.length; c++) {
								if(action.palette.childNodes[c].id == action.nodeID) {
									action.node = action.palette.childNodes[c];
									break;
								}
							}
						}
						
						break;
					}
				}
			}
			
			if(action.node) {
				var updateList = this.updateOverlayedNodes(aWindow, action.node);
			}
			
			try {
				switch(action.action) {
					case 'appendChild':
						if(action.node) {
							if(action.originalParent) {
								if(action.originalParent.firstChild.nodeName == 'preferences') {
									var sibling = action.originalParent.firstChild.nextSibling;
								} else {
									var sibling = action.originalParent.firstChild;
								}
								action.node = action.originalParent.insertBefore(action.node, sibling);
								
								if(!Australis) {
									if(action.originalParent.nodeName == 'toolbar') {
										setAttribute(action.originalParent, 'currentset', action.originalParent.currentSet);
										aWindow.document.persist(action.originalParent.id, 'currentset');
									}
								}
							}
							else if(action.node.parentNode) {
								action.node = action.node.parentNode.removeChild(action.node);
							}
						}
						break;
						
					case 'insertBefore':
						if(action.node && action.originalParent) {
							if(action.node.parentNode == action.originalParent) {
								for(var o=0; o<action.originalParent.childNodes.length; o++) {
									if(action.originalParent.childNodes[o] == action.node) {
										if(o < action.originalPos) {
											action.originalPos++;
										}
										break;
									}
								}
							}
							if(action.originalPos < action.node.parentNode.childNodes.length) {
								action.node = action.originalParent.insertBefore(action.node, action.originalParent.childNodes[action.originalPos]);
							} else {
								action.node = action.originalParent.appendChild(action.node);
							}
							
							if(!Australis) {
								if(action.originalParent.nodeName == 'toolbar') {
									setAttribute(action.originalParent, 'currentset', action.originalParent.currentSet);
									aWindow.document.persist(action.originalParent.id, 'currentset');
								}
							}
						}
						break;
					
					case 'removeChild':
						if(action.node && action.originalParent) {
							if(Australis) {
								this.registerAreas(aWindow, node);
							}
							
							if(action.originalPos < action.originalParent.childNodes.length) {
								action.node = action.originalParent.insertBefore(action.node, action.originalParent.childNodes[action.originalPos]);
							} else {
								action.node = action.originalParent.appendChild(action.node);
							}
						}
						break;
					
					case 'modifyAttribute':
						setAttribute(action.node, action.name, action.value);
						break;
					
					case 'addAttribute':
						removeAttribute(action.node, action.name);
						break;
					
					case 'appendXMLSS':
						if(action.node && action.node.parentNode) {
							action.node = action.node.parentNode.removeChild(action.node);
						}
						break;
					
					case 'addPreferencesElement':
						if(action.prefs) {
							action.prefs.parentNode.removeChild(action.prefs);
						}
						break;
					
					case 'addPreference':
						if(action.pref) {
							// There's an error logged when removing prefs, saying this failed, probably because after performing the removeChild,
							// the pref.preferences property becomes null.
							// I can't get rid of the log message but at least this way nothing should be affected by it failing
							action.pref.preferences.rootBranchInternal.removeObserver(action.pref.name, action.pref.preferences);
							action.pref.parentNode.removeChild(action.pref);
						}
						break;
					
					case 'sizeToContent':
						aWindow.sizeToContent();
						break;
					
					case 'appendButton':
						closeCustomize();
						
						if(action.node) {
							if(!Australis || (action.node.parentNode && action.node.parentNode.nodeName == 'toolbarpalette')) {
								action.node = action.node.parentNode.removeChild(action.node);
							}
							
							if(Australis) {
								aWindow.CustomizableUI.destroyWidget(action.node.id);
								break;
							}
						}
						break;
					
					case 'removeButton':
						closeCustomize();
						
						if(action.node && action.palette) {
							action.node = action.palette.appendChild(action.node);
							
							if(Australis) {
								if(!aWindow.CustomizableUI.getWidget(action.node.id)) {
									aWindow.CustomizableUI.createWidget(this.getWidgetData(aWindow, action.node, action.palette));
								} else {
									aWindow.CustomizableUI.ensureWidgetPlacedInWindow(action.node.id, aWindow);
								}
								break;
							}
							
							var toolbars = aWindow.document.querySelectorAll("toolbar");
							toolbar_loop: for(var a=0; a<toolbars.length; a++) {
								var currentset = toolbars[a].getAttribute('currentset').split(",");
								if(currentset.indexOf(action.node.id) > -1) {
									for(var e=0; e<currentset.length; e++) {
										if(currentset[e] == action.node.id) {
											for(var l=e+1; l<currentset.length; l++) {
												var beforeEl = aWindow.document.getElementById(currentset[l]);
												if(beforeEl) {
													// insertItem doesn't seem to be defined until the toolbar becomes visible
													if(toolbars[a].insertItem) { toolbars[a].insertItem(action.node.id, beforeEl); }
													else { action.node = toolbars[a].insertBefore(action.node, beforeEl); }
													break toolbar_loop;
												}
											}
											// insertItem doesn't seem to be defined until the toolbar becomes visible
											if(toolbars[a].insertItem) { toolbars[a].insertItem(action.node.id, null, null, false); }
											else { action.node = toolbars[a].appendChild(action.node); }
											break toolbar_loop;
										}
									}
								}
							}
						}
						break;
					
					case 'addToolbar':
						closeCustomize();
						
						if(action.node) {
							if(action.toolboxid) {
								var toolbox = aWindow.document.getElementById(action.toolboxid);
								if(toolbox) {
									for(var et=0; et<toolbox.externalToolbars.length; et++) {
										if(toolbox.externalToolbars[et] == action.node) {
											toolbox.externalToolbars.splice(et, 1);
											break;
										}
									}
								}
							}
							
							if(Australis) {
								// see note in runRegisterToolbar()
								if(!action.node._init) {
									this.tempAppendToolbar(aWindow, action.node);
								}
								
								aWindow.CustomizableUI.unregisterArea(action.node.id);
								
								if(this.tempAppend) {
									this.tempRestoreToolbar();
								}
								break;
							}
						
							// Move the buttons to the palette first, so they can still be accessed afterwards
							if(action.palette) {
								var button = action.node.firstChild;
								while(button) {
									if(button.nodeName == 'toolbarbutton') {
										var addedButton = button;
										button = button.nextSibling;
										var updateListButton = this.updateOverlayedNodes(aWindow, addedButton);
										addedButton = action.palette.appendChild(addedButton);
										this.updateOverlayedNodes(aWindow, addedButton, updateListButton);
										continue;
									}
									button = button.nextSibling;
								}
							}
						}
						break;
					
					case 'removeToolbar':
						if(action.node) {
							if(action.toolboxid) {
								var toolbox = aWindow.document.getElementById(action.toolboxid);
								if(toolbox) {
									toggleAttribute(action.node, 'mode', toolbox.getAttribute('mode'), toolbox.getAttribute('mode'));
									
									if(toolbox != action.node.parentNode) {
										var addExternal = true;
										for(var t=0; t<toolbox.externalToolbars.length; t++) {
											if(toolbox.externalToolbars[t] == action.node) {
												addExternal = false;
												break;
											}
										}
										if(addExternal) {
											toolbox.externalToolbars.push(action.node);
										}
									}
								}
							}
							
							if(Australis) {
								this.runRegisterToolbar(aWindow, node);
							}
						}
						break;
					
					/* Not used in Australis */
					case 'persistToolbarButton':
						if(!action.node) {
							toolboxes_loop: for(var t=0; t<toolboxes.length; t++) {
								if(!toolboxes[t].palette) { continue; }
								
								for(var c=0; c<toolboxes[t].palette.childNodes.length; c++) {
									if(toolboxes[t].palette.childNodes[c].id == action.nodeID) {
										action.node = toolboxes[t].palette.childNodes[c];
										var updateList = this.updateOverlayedNodes(aWindow, action.node);
										break toolboxes_loop;
									}
								}
							}
						}
						
						if(action.node && action.node._removePersistListener) {
							action.node._removePersistListener();
						}
						break;
								
					default: break;
				}
			} catch(ex) {
				Cu.reportError(ex);
			}
			
			if(action.node) {
				this.updateOverlayedNodes(aWindow, action.node, updateList);
			}
		}
		
		this.startPreferences(aWindow);
		
		if(!aWindow[x][i].document || aWindow[x][i].remove) {
			aWindow[x].splice(i, 1);
		} else {
			aWindow[x][i].loaded = false;
			aWindow[x][i].traceBack = [];
			aWindow[x][i].time = 0;
		}
	},
	
	getWidgetData: function(aWindow, node, palette) {
		var data = {
			removable: true // let's default this one
		};
		
		if(node.attributes) {
			for(var a=0; a<node.attributes.length; a++) {
				if(node.attributes[a].value == 'true') {
					data[node.attributes[a].name] = true;
				} else if(node.attributes[a].value == 'false') {
					data[node.attributes[a].name] = false;
				} else {
					data[node.attributes[a].name] = node.attributes[a].value;
				}
			}
		}
		
		// createWidget() defaults the removable state to true as of bug 947987
		if(!data.removable && !data.defaultArea) {
			data.defaultArea = (node.parentNode) ? node.parentNode.id : palette.id;
		}		
		
		if(data.type == 'custom') {
			data.self = data;
			data.palette = palette;
			
			data.onBuild = function(aDocument) {
				// Find the node in the DOM tree
				var node = aDocument.getElementById(this.id);
				
				// If it doesn't exist, find it in a palette.
				// We make sure the button is in either place at all times.
				if(!node) {
					var toolbox = aDocument.querySelectorAll('toolbox');
					toolbox_loop: for(var a=0; a<toolbox.length; a++) {
						for(var b=0; b<toolbox[a].palette.childNodes.length; b++) {
							if(toolbox[a].palette.childNodes[b].id == this.id) {
								node = toolbox[a].palette.childNodes[b];
								break toolbox_loop;
							}
						}
					}
				}
				
				// If it doesn't exist there either, CustomizableUI is using the widget information before it has been overlayed (i.e. opening a new window).
				// We get a placeholder for it, then we'll replace it later when the window overlays.
				if(!node) {
					var node = aDocument.importNode(Globals.widgets[this.id], true);
					setAttribute(node, 'CUI_placeholder', 'true');
					hideIt(node);
				}
				
				return node;
			};
			
			// unregisterArea()'ing the toolbar can nuke the nodes, we need to make sure ours are moved to the palette
			data.onWidgetAfterDOMChange = function(aNode) {
				if(aNode.id == this.id
				&& !aNode.parentNode
				&& !trueAttribute(aNode.ownerDocument.documentElement, 'customizing') // here's to hoping we never unregister a toolbar while in customziation mode
				&& this.palette) {
					this.palette.appendChild(aNode);
				}
			};
			
			data.onWidgetDestroyed = function(aId) {
				if(aId == this.id) {
					aWindow.CustomizableUI.removeListener(this);
				}
			};
			
			aWindow.CustomizableUI.addListener(data);
		}
		
		return data;
	},
	
	overlayAll: function(aWindow) {
		if(aWindow._BEING_OVERLAYED != undefined) {
			for(var i=0; i<this.overlays.length; i++) {
				if(this.overlays[i].ready
				&& this.loadedWindow(aWindow, this.overlays[i].overlay) === false
				&& (aWindow.document.baseURI.indexOf(this.overlays[i].uri) == 0 || this.loadedWindow(aWindow, this.overlays[i].uri, true) !== false)) {
					// Ensure the window is rescheduled if needed
					if(aWindow._BEING_OVERLAYED == undefined) {
						observerAid.notify('window-overlayed', aWindow);
					} else {
						aWindow._RESCHEDULE_OVERLAY = true;
					}
					break;
				}
			}
			return;
		}
		aWindow._BEING_OVERLAYED = true;
		var rescheduleOverlay = false;
		
		if(typeof(aWindow['_OVERLAYS_'+objName]) == 'undefined') {
			aWindow['_OVERLAYS_'+objName] = [];
			this.addToAttr(aWindow);
		}
		
		if(aWindow._UNLOAD_OVERLAYS) {
			while(aWindow._UNLOAD_OVERLAYS.length > 0) {
				var i = this.loadedWindow(aWindow, aWindow._UNLOAD_OVERLAYS[0]);
				if(i !== false) {
					var allAttr = this.getAllInAttr(aWindow);
					// the i returned can refer to an array of another add-on, we need to make sure we get the right one
					for(var y=0; y<allAttr.length; y++) {
						var x = '_OVERLAYS_'+allAttr[y];
						if(!aWindow[x]) { continue; }
						if(i < aWindow[x].length && aWindow[x][i].uri == aWindow._UNLOAD_OVERLAYS[0]) { break; }
					}
					this.removeInOrder(aWindow, aWindow[x][i].time);
					rescheduleOverlay = true;
				}
				aWindow._UNLOAD_OVERLAYS.shift();
			}
			delete aWindow._UNLOAD_OVERLAYS;
		}
		
		if(aWindow.closed || aWindow.willClose) {
			if(aWindow['_OVERLAYS_'+objName].length == 0) {
				delete aWindow['_OVERLAYS_'+objName];
				this.removeFromAttr(aWindow);
			}
			delete aWindow._BEING_OVERLAYED;
			return;
		}
		
		for(var i=0; i<aWindow['_OVERLAYS_'+objName].length; i++) {
			if(aWindow['_OVERLAYS_'+objName][i].ready && !aWindow['_OVERLAYS_'+objName][i].loaded) {
				aWindow._BEING_OVERLAYED = i;
				this.overlayDocument(aWindow, aWindow['_OVERLAYS_'+objName][i]);
				aWindow['_OVERLAYS_'+objName][i].loaded = true;
				aWindow['_OVERLAYS_'+objName][i].time = this.getNewOrder(aWindow);
				rescheduleOverlay = true;
			}
		}
		
		for(var i=0; i<this.overlays.length; i++) {
			if(this.overlays[i].ready
			&& this.loadedWindow(aWindow, this.overlays[i].overlay) === false
			&& (aWindow.document.baseURI.indexOf(this.overlays[i].uri) == 0 || this.loadedWindow(aWindow, this.overlays[i].uri, true) !== false)) {
				aWindow._BEING_OVERLAYED = aWindow['_OVERLAYS_'+objName].push({
					uri: this.overlays[i].overlay,
					traceBack: [],
					removeMe: function() { overlayAid.removeOverlay(aWindow, this); },
					time: 0,
					loaded: false,
					onunload: this.overlays[i].onunload
				}) -1;
				
				this.overlayDocument(aWindow, this.overlays[i]);
				aWindow['_OVERLAYS_'+objName][aWindow._BEING_OVERLAYED].loaded = true;
				aWindow['_OVERLAYS_'+objName][aWindow._BEING_OVERLAYED].time = this.getNewOrder(aWindow);
				rescheduleOverlay = true;
			}
		}
		
		if(aWindow['_OVERLAYS_'+objName].length == 0) {
			delete aWindow['_OVERLAYS_'+objName];
			this.removeFromAttr(aWindow);
		}
		delete aWindow._BEING_OVERLAYED;
		
		// Re-schedule overlaying the window to load overlays over newly loaded overlays if necessary
		if(rescheduleOverlay || aWindow._UNLOAD_OVERLAYS || aWindow._RESCHEDULE_OVERLAY) {
			delete aWindow._RESCHEDULE_OVERLAY;
			observerAid.notify('window-overlayed', aWindow);
		}
		return;
	},
	
	overlayDocument: function(aWindow, overlay) {
		if(overlay.beforeload) {
			try { overlay.beforeload(aWindow); }
			catch(ex) { Cu.reportError(ex); }
		}
		
		for(var o = 0; o < overlay.document.childNodes.length; o++) {
			if(overlay.document.childNodes[o].nodeName == 'window') {
				continue;
			}
			
			if(overlay.document.childNodes[o].nodeName == 'overlay') {
				this.loadInto(aWindow, overlay.document.childNodes[o]);
			}
			
			else if(overlay.document.childNodes[o].nodeName == 'xml-stylesheet') {
				this.appendXMLSS(aWindow, overlay.document.childNodes[o]);
			}
		}
		
		// Have to set the correct values into modified preferences
		this.startPreferences(aWindow);
		
		// Resize the preferences dialogs to fit the content
		this.sizeToContent(aWindow);
		
		this.persistOverlay(aWindow, overlay);
		
		if(overlay.onload) {
			try { overlay.onload(aWindow); }
			catch(ex) { Cu.reportError(ex); }
		}
	},
	
	loadInto: function(aWindow, overlay) {
		for(var i = 0; i < overlay.childNodes.length; i++) {
			var overlayNode = overlay.childNodes[i];
			
			// Special case for overlaying preferences to options dialogs
			if(overlayNode.nodeName == 'preferences') {
				this.addPreferences(aWindow, overlay.childNodes[i]);
				continue;
			}
			
			// Overlaying script elements when direct children of the overlay element
			// With src attribute we import it as a subscript of aWindow, otherwise we eval the inline content of the script tag
			// (to avoid using eval unnecessarily, only scripts with src will be imported for now)
			if(overlayNode.nodeName == 'script' && overlay.nodeName == 'overlay') {
				if(overlayNode.hasAttribute('src')) {
					Services.scriptloader.loadSubScript(overlayNode.getAttribute('src'), aWindow);
				}/* else {
					aWindow.eval(overlayNode.textContent);
				}*/
				continue;
			}
			
			// No id means the node won't be processed
			if(!overlayNode.id) { continue; }
			
			// Correctly add or remove toolbar buttons to the toolbox palette
			if(overlayNode.nodeName == 'toolbarpalette') {
				var toolbox = aWindow.document.querySelectorAll('toolbox');
				for(var a=0; a<toolbox.length; a++) {
					if(toolbox[a].palette && toolbox[a].palette.id == overlayNode.id) {
						buttons_loop: for(var e=0; e<overlayNode.childNodes.length; e++) {
							var button = overlayNode.childNodes[e];
							if(button.id) {
								var existButton = aWindow.document.getElementById(button.id);
								
								// If it's a placeholder created by us to deal with CustomizableUI, just use it.
								if(existButton && trueAttribute(existButton, 'CUI_placeholder')) {
									this.reAppendPlaceholder(aWindow, existButton, toolbox[a].palette);
									continue buttons_loop;
								}
								
								// change or remove the button on the toolbar if it is found in the document
								if(existButton) {
									if(trueAttribute(button, 'removeelement')) {
										this.removeButton(aWindow, toolbox[a].palette, existButton);
										continue buttons_loop;
									}
									
									for(var c=0; c<button.attributes.length; c++) {
										// Why bother, id is the same already
										if(button.attributes[c].name == 'id') { continue; }
										
										this.setAttribute(aWindow, existButton, button.attributes[c]);
									}
									continue buttons_loop;
								}
								
								// change or remove in the palette if it exists there
								for(var b=0; b<toolbox[a].palette.childNodes.length; b++) {
									if(toolbox[a].palette.childNodes[b].id == button.id) {
										if(trueAttribute(button, 'removeelement')) {
											this.removeButton(aWindow, toolbox[a].palette, toolbox[a].palette.childNodes[b]);
											continue buttons_loop;
										}
										
										for(var c=0; c<button.attributes.length; c++) {
											// Why bother, id is the same already
											if(button.attributes[c].name == 'id') { continue; }
											
											this.setAttribute(aWindow, toolbox[a].palette.childNodes[b], button.attributes[c]);
										}
										continue buttons_loop;
									}
								}
								
								// Save a copy of the widget node in the sandbox,
								// so CUI can use it when opening a new window without having to wait for the overlay.
								if(!Globals.widgets[button.id]) {
									Globals.widgets[button.id] = button;
								}
								
								// add the button if not found either in a toolbar or the palette
								button = aWindow.document.importNode(button, true); // Firefox 9- deep argument is mandatory
								this.appendButton(aWindow, toolbox[a].palette, button);
							}
						}
						break;
					}
				}
				continue;
			}
			
			var node = aWindow.document.getElementById(overlayNode.id);
			
			// Handle if node with same id was found
			if(node) {
				// We could have found a placeholder from CUI's handling. We need to ensure the process continues as normal (append the button) in that case
				if(trueAttribute(node, 'CUI_placeholder') && node.collapsed) {
					this.reAppendPlaceholder(aWindow, node, node.parentNode);
					continue;
				}
				
				// Don't process if id mismatches nodename or if parents mismatch; I should just make sure this doesn't happen in my overlays
				if(node.nodeName != overlayNode.nodeName) { continue; }
				if(overlayNode.parentNode.nodeName != 'overlay' && node.parentNode.id != overlayNode.parentNode.id) { continue; }
				
				// If removeelement attribute is true, remove the element and do nothing else
				if(trueAttribute(overlayNode, 'removeelement')) {
					// Check if we are removing any toolbars so we also remove it from the toolbox
					this.removeToolbars(aWindow, node);
					
					node = this.removeChild(aWindow, node);
					
					continue;
				}
				
				// Copy attributes to node
				for(var a = 0; a < overlayNode.attributes.length; a++) {
					// Why bother, id is the same already
					if(overlayNode.attributes[a].name == 'id') { continue; }
					
					this.setAttribute(aWindow, node, overlayNode.attributes[a]);
				}
				
				// Move the node around if necessary
				node = this.moveAround(aWindow, node, overlayNode, node.parentNode);
				
				// Get Children of an Element's ID into this node
				this.getChildrenOf(aWindow, node);
				
				// Load children of the overlayed node
				this.loadInto(aWindow, overlay.childNodes[i]);
			}
			else if(overlayNode.parentNode.nodeName != 'overlay') {
				var node = aWindow.document.importNode(overlayNode, true); // Firefox 9- deep argument is mandatory
				
				// We need to register the customization area before we append the node
				if(Australis) {
					this.registerAreas(aWindow, node);
				}
				
				// Add the node to the correct place
				node = this.moveAround(aWindow, node, overlayNode, aWindow.document.getElementById(overlayNode.parentNode.id));
				
				// Check if we are adding any toolbars so we remove it later from the toolbox
				this.addToolbars(aWindow, node);
				
				// Get Children of an Element's ID into this node
				this.getChildrenOf(aWindow, node);
				
				// Surf through all the children of node for the getchildrenof attribute
				var allGetChildrenOf = node.getElementsByAttribute('getchildrenof', '*');
				for(var gco = 0; gco < allGetChildrenOf.length; gco++) {
					this.getChildrenOf(aWindow, allGetChildrenOf[gco]);
				}
			}
		}
	},
	
	registerAreas: function(aWindow, node) {
		if(node.nodeName == 'toolbar' && node.id) {
			aWindow.CustomizableUI.registerArea(node.id, {
				type: CustomizableUI.TYPE_TOOLBAR,
				legacy: true
			});
		}
		
		for(var nc=0; nc<node.childNodes.length; nc++) {
			this.registerAreas(aWindow, node.childNodes[nc]);
		}
	},
	
	// The binding containing the _init() method doesn't hold until the toolbar is visible either, apparently...
	// This tricks it into applying the binding, by temporarily moving the toolbar to a "visible" node in the document
	runRegisterToolbar: function(aWindow, node) {
		if(!node._init) {
			this.tempAppendToolbar(aWindow, node);
			this.tempRestoreToolbar();
		}
	},
	
	tempAppend: null,
	tempAppendToolbar: function(aWindow, node) {
		if(this.tempAppend) {
			Cu.reportError('tempAppend already exists!');
			return;
		}
		
		this.tempAppend = {
			parent: node.parentNode,
			sibling: node.nextSibling,
			container: aWindow.document.createElement('box')
		};
		
		setAttribute(this.tempAppend.container, 'style', 'position: fixed; top: 4000px; left: 4000px; opacity: 0.001;');
		this.tempAppend.container = aWindow.document.documentElement.appendChild(this.tempAppend.container);
		
		node = this.tempAppend.container.appendChild(node);
	},
	tempRestoreToolbar: function() {
		this.tempAppend.parent.insertBefore(this.tempAppend.container.firstChild, this.tempAppend.sibling);
		this.tempAppend.container.parentNode.removeChild(this.tempAppend.container);
		this.tempAppend = null;
	},
	
	addToolbars: function(aWindow, node) {
		if(node.nodeName == 'toolbar' && node.id) {
			var toolbox = null;
			if(node.getAttribute('toolboxid')) {
				toolbox = aWindow.document.getElementById(node.getAttribute('toolboxid'));
			} else if(node.parentNode && node.parentNode.nodeName == 'toolbox') {
				toolbox = node.parentNode;
			}
			
			if(toolbox) {
				toggleAttribute(node, 'mode', toolbox.getAttribute('mode'), toolbox.getAttribute('mode'));
				
				if(toolbox != node.parentNode) {
					var addExternal = true;
					for(var t=0; t<toolbox.externalToolbars.length; t++) {
						if(toolbox.externalToolbars[t] == node) {
							addExternal = false;
							break;
						}
					}
					if(addExternal) {
						toolbox.externalToolbars.push(node);
					}
				}
			}
			
			// The toolbar doesn't run the constructor until it is visible. And we want it to run regardless if it is visible or not.
			// This will just do nothing if it has been run already.
			if(Australis) {
				this.runRegisterToolbar(aWindow, node);
			}
			
			var palette = toolbox.palette;
			this.traceBack(aWindow, {
				action: 'addToolbar',
				node: node,
				toolboxid: node.getAttribute('toolboxid'),
				palette: palette
			});
		}
		
		for(var nc=0; nc<node.childNodes.length; nc++) {
			this.addToolbars(aWindow, node.childNodes[nc]);
		}
	},
	
	removeToolbars: function(aWindow, node) {
		if(node.nodeName == 'toolbar' && node.id) {
			if(Australis) {
				aWindow.CustomizableUI.unregisterArea(node.id);
			}
			
			if(node.getAttribute('toolboxid') || node.parentNode.nodeName == 'toolbox') {
				var toolbox = node.getAttribute('toolboxid') ? aWindow.document.getElementById(node.getAttribute('toolboxid')) : node.parentNode;
				if(toolbox) {
					for(var et=0; et<toolbox.externalToolbars.length; et++) {
						if(toolbox.externalToolbars[et] == node) {
							toolbox.externalToolbars.splice(et, 1);
							break;
						}
					}
					
					this.traceBack(aWindow, {
						action: 'removeToolbar',
						node: node,
						toolboxid: toolbox.id
					});
				}
			}
		}
		
		for(var nc=0; nc<node.childNodes.length; nc++) {
			this.removeToolbars(aWindow, node.childNodes[nc]);
		}
	},
	
	moveAround: function(aWindow, node, overlayNode, parent) {
		if(!Australis && parent.nodeName == 'toolbar' && parent.getAttribute('currentset')) {
			var ret = null;
			var originalParent = node.parentNode;
			var currentset = parent.getAttribute('currentset').split(',');
			for(var c = 0; c < currentset.length; c++) {
				if(currentset[c] == node.id) {
					var shift = 0;
					var beforeEl = null;
					for(var s = c+1; s < currentset.length; s++) {
						if(currentset[s] == 'separator' || currentset[s] == 'spring' || currentset[s] == 'spacer') {
							shift++;
							continue;
						}
						
						beforeEl = aWindow.document.getElementById(currentset[s]);
						if(beforeEl) {
							if(beforeEl.parentNode != parent) {
								beforeEl = null;
								continue;
							}
							
							while(shift > 0 && beforeEl.previousSibling) {
								if(beforeEl.previousSibling.nodeName != 'toolbarseparator'
								&& beforeEl.previousSibling.nodeName != 'toolbarspring'
								&& beforeEl.previousSibling.nodeName != 'toolbarspacer') {
									break;
								}
								beforeEl = beforeEl.previousSibling;
								shift--;
							}
							break;
						}
					}
					
					ret = this.insertBefore(aWindow, node, parent, beforeEl);
					if(ret && originalParent && originalParent.id && originalParent.nodeName == 'toolbar') {
						setAttribute(originalParent, 'currentset', originalParent.currentSet);
						aWindow.document.persist(originalParent.id, 'currentset');
					}
					return ret;
				}
			}
		}
		else if(Australis && parent.nodeName == 'toolbar' && parent != node.parentNode) {
			// Save a copy of the widget node in the sandbox,
			// so CUI can use it when opening a new window without having to wait for the overlay.
			if(!Globals.widgets[overlayNode.id]) {
				Globals.widgets[overlayNode.id] = overlayNode;
			}
			
			return this.appendButton(aWindow, parent, node);
		}
		
		var newParent = null;
		if(overlayNode.getAttribute('newparent')) {
			newParent = aWindow.document.getElementById(overlayNode.getAttribute('newparent'));
			if(newParent) { parent = newParent; }
		}
		
		if(overlayNode.getAttribute('insertafter')) {
			var idList = overlayNode.getAttribute('insertafter').split(',');
			for(var i = 0; i < idList.length; i++) {
				var id = trim(idList[i]);
				if(id == '') { continue; }
				if(id == node.id) { continue; } // this is just stupid of course...
				
				for(var c = 0; c < parent.childNodes.length; c++) {
					if(parent.childNodes[c].id == id) {
						return this.insertBefore(aWindow, node, parent, parent.childNodes[c].nextSibling);
					}
				}
			}
		}
		
		if(overlayNode.getAttribute('insertbefore')) {
			var idList = overlayNode.getAttribute('insertbefore').split(',');
			for(var i = 0; i < idList.length; i++) {
				var id = trim(idList[i]);
				if(id == '') { continue; }
				if(id == node.id) { continue; } // this is just stupid of course...
				
				for(var c = 0; c < parent.childNodes.length; c++) {
					if(parent.childNodes[c].id == id) {
						return this.insertBefore(aWindow, node, parent, parent.childNodes[c]);
					}
				}
			}
		}
		
		if(overlayNode.getAttribute('position')) {
			var position = parseInt(overlayNode.getAttribute('position')) -1; // one-based children list
			var sibling = (position < parent.childNodes.length) ? parent.childNodes[position] : null;
			return this.insertBefore(aWindow, node, parent, sibling);
		}
		
		if(!node.parentNode || newParent) {
			return this.appendChild(aWindow, node, parent);
		}
		return node;
	},
	
	getChildrenOf: function(aWindow, node) {
		var getID = node.getAttribute('getchildrenof');
		if(!getID) { return; }
		
		getID = getID.split(',');
		for(var i = 0; i < getID.length; i++) {
			var getNode = aWindow.document.getElementById(trim(getID[i]));
			if(!getNode) { continue; }
			
			var curChild = 0;
			while(curChild < getNode.childNodes.length) {
				if(getNode.childNodes[curChild].nodeName == 'preferences' || isAncestor(node, getNode.childNodes[curChild])) {
					curChild++;
					continue;
				}
				
				this.appendChild(aWindow, getNode.childNodes[curChild], node);
			}
		}
	},
	
	appendChild: function(aWindow, node, parent) {
		var originalParent = node.parentNode;
		var updateList = this.updateOverlayedNodes(aWindow, node);
		
		try { node = parent.appendChild(node); } catch(ex) { Cu.reportError(ex); node = null; }
		
		this.updateOverlayedNodes(aWindow, node, updateList);
		this.traceBack(aWindow, {
			action: 'appendChild',
			node: node,
			originalParent: originalParent
		});
		return node;
	},
	
	insertBefore: function(aWindow, node, parent, sibling) {
		var originalParent = node.parentNode;
		
		if(originalParent) {
			for(var o = 0; o < originalParent.childNodes.length; o++) {
				if(originalParent.childNodes[o] == node) {
					break;
				}
			}
		}
		var updateList = this.updateOverlayedNodes(aWindow, node);
		
		try { node = parent.insertBefore(node, sibling); } catch(ex) { Cu.reportError(ex); return null; }
		
		this.updateOverlayedNodes(aWindow, node, updateList);
		if(!originalParent) {
			this.traceBack(aWindow, {
				action: 'appendChild',
				node: node,
				originalParent: null
			});
		} else {
			this.traceBack(aWindow, {
				action: 'insertBefore',
				node: node,
				originalParent: originalParent,
				originalPos: o
			});
		}
		
		return node;
	},
	
	removeChild: function(aWindow, node) {
		var updateList = this.updateOverlayedNodes(aWindow, node);
		var originalParent = node.parentNode;
		
		var o = 0;
		if(node.parentNode) {
			for(o = 0; o < node.parentNode.childNodes.length; o++) {
				if(node.parentNode.childNodes[o] == node) {
					break;
				}
			}
		}
		
		try { node = node.parentNode.removeChild(node); } catch(ex) { Cu.reportError(ex); node = null; }
		
		this.updateOverlayedNodes(aWindow, node, updateList);
		this.traceBack(aWindow, {
			action: 'removeChild',
			node: node,
			originalParent: originalParent,
			originalPos: o
		});
		return node;
	},
	
	setAttribute: function(aWindow, node, attr) {
		if(node.hasAttribute(attr.name)) {
			this.traceBack(aWindow, {
				action: 'modifyAttribute',
				node: node,
				name: attr.name,
				value: node.getAttribute(attr.name)
			});
		} else {
			this.traceBack(aWindow, {
				action: 'addAttribute',
				node: node,
				name: attr.name
			});
		}
		
		try { node.setAttribute(attr.name, attr.value); } catch(ex) {}
	},
	
	appendXMLSS: function(aWindow, node) {
		try {
			node = aWindow.document.importNode(node, true); // Firefox 9- deep argument is mandatory
			// these have to come before the actual window element
			node = aWindow.document.insertBefore(node, aWindow.document.documentElement);
		} catch(ex) { node = null; }
		this.traceBack(aWindow, {
			action: 'appendXMLSS',
			node: node
		});
		return node;
	},
	
	addPreferences: function(aWindow, node) {
		var prefPane = aWindow.document.getElementById(node.parentNode.id);
		if(!prefPane) { return; }
		
		var prefElements = prefPane.getElementsByTagName('preferences');
		if(prefElements.length == 0) {
			try {
				var prefs = aWindow.document.importNode(node, true); // Firefox 9- deep argument is mandatory
				prefs = prefPane.appendChild(prefs);
			} catch(ex) { prefs = null; }
			this.traceBack(aWindow, {
				action: 'addPreferencesElement',
				prefs: prefs
			});
			return;
		}
		
		var prefs = prefElements[0];
		for(var p = 0; p < node.childNodes.length; p++) {
			if(!node.childNodes[p].id) { continue; }
			
			try {
				var pref = aWindow.document.importNode(node.childNodes[p], true); // Firefox 9- deep argument is mandatory
				pref = prefs.appendChild(pref);
			} catch(ex) { pref = null; }
			this.traceBack(aWindow, {
				action: 'addPreference',
				pref: pref
			});
		}
	},
	
	startPreferences: function(aWindow) {
		var prefs = aWindow.document.getElementsByTagName('preference');
		for(var i = 0; i < prefs.length; i++) {
			// Overlayed preferences have a null value, like they haven't been initialized for some reason, this takes care of that
			if(prefs[i].value === null) {
				prefs[i].value = prefs[i].valueFromPreferences;
			}
			try { prefs[i].updateElements(); } catch(ex) {}
		}
	},
	
	sizeToContent: function(aWindow) {
		var isPrefDialog = aWindow.document.getElementsByTagName('prefwindow');
		if(isPrefDialog.length > 0 && isPrefDialog[0].parentNode == aWindow.document) {
			try { aWindow.sizeToContent(); } catch(ex) {}
			this.traceBack(aWindow, { action: 'sizeToContent' }, true);
		}
	},
	
	reAppendPlaceholder: function(aWindow, node, palette) {
		removeAttribute(node, 'CUI_placeholder');
		hideIt(node, true);
		this.appendButton(aWindow, palette, node);
	},
	
	appendButton: function(aWindow, palette, node) {
		closeCustomize();
		var updateList = this.updateOverlayedNodes(aWindow, node);
		
		if(!Australis || (node.parentNode != palette && palette.nodeName == 'toolbarpalette')) {
			node = palette.appendChild(node);
		}
		var id = node.id;
		
		if(!Australis) {
			var toolbars = aWindow.document.querySelectorAll("toolbar");
			toolbar_loop: for(var a=0; a<toolbars.length; a++) {
				var currentset = toolbars[a].getAttribute('currentset').split(",");
				if(currentset.indexOf(node.id) > -1) {
					for(var e=0; e<currentset.length; e++) {
						if(currentset[e] == node.id) {
							var shift = 0;
							for(var i=e+1; i<currentset.length; i++) {
								if(currentset[i] == 'separator' || currentset[i] == 'spring' || currentset[i] == 'spacer') {
									shift++;
									continue;
								}
								
								var beforeEl = aWindow.document.getElementById(currentset[i]);
								if(beforeEl) {
									while(shift > 0 && beforeEl.previousSibling) {
										if(beforeEl.previousSibling.nodeName != 'toolbarseparator'
										&& beforeEl.previousSibling.nodeName != 'toolbarspring'
										&& beforeEl.previousSibling.nodeName != 'toolbarspacer') {
											break;
										}
										beforeEl = beforeEl.previousSibling;
										shift--;
									}
									// insertItem doesn't seem to be defined until the toolbar becomes visible
									if(toolbars[a].insertItem) { toolbars[a].insertItem(node.id, beforeEl); }
									else { node = toolbars[a].insertBefore(node, beforeEl); }
									break toolbar_loop;
								}
							}
							// insertItem doesn't seem to be defined until the toolbar becomes visible
							if(toolbars[a].insertItem) { toolbars[a].insertItem(node.id, null, null, false); }
							else { node = toolbars[a].appendChild(node); }
							break toolbar_loop;
						}
					}
				}
			}
		}
		else {
			// see note in runRegisterToolbar()
			if(palette.nodeName == 'toolbar' && !palette._init) {
				this.tempAppendToolbar(aWindow, palette);
			}
			
			var created = false;
			var widget = aWindow.CustomizableUI.getWidget(id);
			if(!widget || widget.provider != aWindow.CustomizableUI.PROVIDER_API) {
				aWindow.CustomizableUI.createWidget(this.getWidgetData(aWindow, node, palette));
				created = true;
			}
			
			aWindow.CustomizableUI.ensureWidgetPlacedInWindow(id, aWindow);
			
			// CUI always gets the widget from the Globals.widgets object in this case
			if(palette.nodeName == 'toolbar') {
				node = aWindow.document.getElementById(id);
				removeAttribute(node, 'CUI_placeholder');
				hideIt(node, true);
			}
			
			if(this.tempAppend) {
				this.tempRestoreToolbar();
			}
			
			if(!node) { node = aWindow.document.getElementById(id); }
		}
		
		this.updateOverlayedNodes(aWindow, node, updateList);
		this.traceBack(aWindow, {
			action: 'appendButton',
			node: node
		});
		return node;
	},
	
	removeButton: function(aWindow, palette, node) {
		closeCustomize();
		var updateList = this.updateOverlayedNodes(aWindow, node);
		
		node = node.parentNode.removeChild(node);
		
		if(Australis) {
			aWindow.CustomizableUI.destroyWidget(node.id);
		}
		
		this.updateOverlayedNodes(aWindow, node, updateList);
		this.traceBack(aWindow, {
			action: 'removeButton',
			node: node,
			palette: palette
		});
	},
	
	addToAttr: function(aWindow) {
		var attr = this.getAllInAttr(aWindow);
		if(attr.indexOf(objName) > -1) { return; }
		
		attr.push(objName);
		setAttribute(aWindow.document.documentElement, 'Bootstrapped_Overlays', attr.join(' '));
	},
	
	getAllInAttr: function(aWindow) {
		var attr = aWindow.document.documentElement.getAttribute('Bootstrapped_Overlays');
		if(!attr) { return new Array(); }
		else { return attr.split(' '); }
	},
	
	removeFromAttr: function(aWindow) {
		var attr = this.getAllInAttr(aWindow);
		if(attr.indexOf(objName) == -1) { return; }
		
		attr.splice(attr.indexOf(objName), 1);
		toggleAttribute(aWindow.document.documentElement, 'Bootstrapped_Overlays', attr.length > 0, attr.join(' '));
	}
};

moduleAid.LOADMODULE = function() {
	Globals.widgets = {};
	
	windowMediator.register(overlayAid.scheduleAll, 'domwindowopened');
	browserMediator.register(overlayAid.scheduleBrowser, 'pageshow');
	browserMediator.register(overlayAid.scheduleBrowser, 'SidebarFocused');
	browserMediator.register(overlayAid.closedBrowser, 'pagehide');
	browserMediator.register(overlayAid.closedBrowser, 'SidebarClosed');
	observerAid.add(overlayAid.observingSchedules, 'window-overlayed');
};

moduleAid.UNLOADMODULE = function() {
	observerAid.remove(overlayAid.observingSchedules, 'window-overlayed');
	windowMediator.unregister(overlayAid.scheduleAll, 'domwindowopened');
	browserMediator.unregister(overlayAid.scheduleBrowser, 'pageshow');
	browserMediator.unregister(overlayAid.scheduleBrowser, 'SidebarFocused');
	browserMediator.unregister(overlayAid.closedBrowser, 'pagehide');
	browserMediator.unregister(overlayAid.closedBrowser, 'SidebarClosed');
	windowMediator.callOnAll(overlayAid.unloadAll);
	browserMediator.callOnAll(overlayAid.unloadBrowser);
	
	delete Globals.widgets;
};
