/*----------------------
 Contains some of the code is from Mozilla original Cookie Editor and from "Add N Edit Cookies" v0.2.1.3 by goodwill
 ----------------------*/


/*##################################################################################### */

Components.utils.import("resource://cookiesmaster/cookiesMasterCore.jsm");
var cookiesMaster = {
	_aWindow: null,
	winid: new Date(),
	inited: false,
	app: null,
	focused: null,
	args: {},
	backup: {},
	website: false,
	websiteHost: null,
	websiteHostStripped: null,
	prefAutoUpdate: false,
	prefAutoFilter: false,
	prefTopmost: false,
	prefShowExtra: false,
	prefDateFormat: "",
	prefFiltersearchname: true,
	prefFiltersearchhost: true,
	prefFiltersearchcontent: true,
	prefFiltersearchcase: false,
	prefFiltersearchrelaxed: true,
	prefSimpleHost: false,
	prefExpireProgress: false,
	prefExpireCountdown: true,
	prefCookieCuller: false,
	prefCookieCullerDelete: false,
	prefViewOrder: "",
	prefViewOrderDefault: "name|value|host|path|isSecure|expires|creationTime|lastAccessed|isHttpOnly|policy|status|isProtected",

	lastKeyDown: [],
	strings: {},
	_noObserve: false,
	_selected: [],
	_cb2: null,
	_cookies: [],
	_cookiesAll: [],
	_cb: null,
	_cookiesTree: null,
	supress_getCellText: false,
	contextDelay: 0,
	isXP: false,

	prefs: cookiesMasterCommon.prefs,

	dragCancel: true,
	dragoverObj: null,
	infoRowsFirst: null,
	infoRowsLast: null,
	infoRowsChanged: false,

	_cookiesTreeView: {
		rowCount : 0,
		tree: null,
		canDrop: function(){ return false },
		setTree : function(tree){ this.tree = tree },
		getImageSrc : function(row,column) {},
		getProgressMode : function(row,column)
		{
			return cookiesMaster._cookies[row]["expires"] ? 1 : 3;
		},
		getCellValue : function(row,column)
		{
			switch(column.id)
			{
				case "expiresProgress":
					if (!cookiesMaster._cookies[row].extra)
						cookiesMaster._cookies[row] = cookiesMaster._cookieGetExtraInfo(cookiesMaster._cookies[row].aCookie);

					var p = 0;
					var e = cookiesMaster._cookies[row]["expires"] * 1000
					if ((new Date()).getTime() < e)
					{
						var c = cookiesMaster._cookies[row]["creationTime"] / 1000;
						var d = new Date();
						var m = ((e - c) * 10000).toFixed();
						var n = ((e - d.getTime()) * 10000).toFixed();
						n = Math.round(n * 10000 / m);
						m = 10000; //as larger the number, as smoother the progress bar will be. It seems FF chokes on numbers larger then 10M though
						p = n * 100 / m;
					}
					return p;
				default:
					return cookiesMaster._cookies[row][column.id];
			}
		},
		setCellText : function(row,column,val) {},
		getCellText : function(row,column)
		{
			if (cookiesMaster.supress_getCellText || column.id == "sel")
				return "";
			switch(column.id)
			{
				case "expires":
					return cookiesMaster.getExpiresString(cookiesMaster._cookies[row]["expires"]);
				case "creationTimeString":
						if (!cookiesMaster._cookies[row].extra)
							cookiesMaster._cookies[row] = cookiesMaster._cookieGetExtraInfo(cookiesMaster._cookies[row].aCookie);
					return cookiesMaster.getExpiresString(Math.round(cookiesMaster._cookies[row]["creationTime"]/1000000));
				case "lastAccessedString":
						if (!cookiesMaster._cookies[row].extra)
							cookiesMaster._cookies[row] = new cookiesMaster.cookieObject(cookiesMaster._cookies[row].aCookie.QueryInterface(Ci.nsICookie2), cookiesMaster._cookies[row].sel, cookiesMaster._cookies[row].updated);
					return cookiesMaster.getExpiresString(Math.round(cookiesMaster._cookies[row]["lastAccessed"]/1000000));
				case "isHttpOnlyString":
						if (!cookiesMaster._cookies[row].extra)
							cookiesMaster._cookies[row] = new cookiesMaster.cookieObject(cookiesMaster._cookies[row].aCookie.QueryInterface(Ci.nsICookie2), cookiesMaster._cookies[row].sel, cookiesMaster._cookies[row].updated);
					return cookiesMaster.string("yesno"+(cookiesMaster._cookies[row]["isHttpOnly"]?1:0));
				case "policyString":
					return cookiesMaster.string("policy"+cookiesMaster._cookies[row]["policy"]);
				case "statusString":
						if (!cookiesMaster._cookies[row].extra)
							cookiesMaster._cookies[row] = new cookiesMaster.cookieObject(cookiesMaster._cookies[row].aCookie.QueryInterface(Ci.nsICookie2), cookiesMaster._cookies[row].sel, cookiesMaster._cookies[row].updated);
					return cookiesMaster.string("status"+cookiesMaster._cookies[row]["status"]);
				case "isProtected":
					return cookiesMaster.string("yesno"+(cookiesMaster._cookies[row]["isProtected"]?1:0));
				case "expiresProgress":
					return cookiesMaster._cookies[row]["expires"] ? "" : "---";
				case "expiresCountdown":
						if (!cookiesMaster._cookies[row].extra)
							cookiesMaster._cookies[row] = cookiesMaster._cookieGetExtraInfo(cookiesMaster._cookies[row].aCookie);

					var c = cookiesMaster._cookies[row]["creationTime"] / 1000;
					var e = cookiesMaster._cookies[row]["expires"] * 1000
					var d = new Date();
					var tt = cookiesMaster._cookies[row]["expires"] ? cookiesMaster.strings.cookieexpired_tree : "---";
					if (d.getTime() < e)
					{
						var m = ((e - c) * 10000).toFixed();
						var n = ((e - d.getTime()) * 10000).toFixed();
						n = Math.round(n * 10000 / m);
						m = 10000; //as larger the number, as smoother the progress bar will be. It seems FF chokes on numbers larger then 10M though
						var p = n * 100 / m;
						if (p <= 0.0009)
							p = p.toFixed();
						else if (p <= 0.009)
							p = p.toFixed(3);
						else if (p <= 0.09)
							p = p.toFixed(2);
						else if (p <= 0.9)
							p = p.toFixed(1);
						else
							p = p.toFixed();
						var e = new Date(e);
						var dd = e-d;
						var dday = Math.floor(dd/(86400000)*1)
						var dhour = Math.floor((dd%(86400000))/(3600000)*1)
						var dmin = Math.floor(((dd%(86400000))%(3600000))/(60000)*1)
						var dsec = Math.floor((((dd%(86400000))%(3600000))%(60000))/1000*1)
						var s = cookiesMaster.strings;
						var t = [];
						var l;
						if (dday > 0)
							t.push(dday + " " + s['day' + (dday != 1 ? "s" : "")]);

						if (dhour > 0 || t.length)
							t.push(dhour + " " + s['hour' + (dhour != 1 ? "s" : "")]);


						if (dmin > 0 || t.length)
							t.push(dmin + " " + s['minute' + (dmin != 1 ? "s" : "")]);

						if (dsec > 0 || t.length)
							t.push(dsec + " " + s['second' + (dsec != 1 ? "s" : "")]);

						if (t.length)
							tt = t.join(", ") + (p !== null ? " (" + cookiesMaster.strings.cookieexpire_progress_life.replace("#", p) + ")" : "");
					}
					return tt;
			}
			return cookiesMaster._cookies[row][column.id];
		},
		isSeparator: function(index) {return false;},
		isSorted: function() { return false; },
		isContainer: function(index) {return false;},
		isContainerOpen: function(index) {return false;},
		isContainerEmpty: function(index) {},
		toggleOpenState: function(index) {},
		cycleHeader: function(aColId, aElt) {},
		getRowProperties: function(row,props)
		{
			var aserv=Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
			if (cookiesMaster._cookies[row]['deleted'])
				props.AppendElement(aserv.getAtom("deleted"));

			if (cookiesMaster._cookies[row]['deleting'])
				props.AppendElement(aserv.getAtom("deleting"));
		},
		getColumnProperties: function(column,columnElement,prop)
		{
		},
		getCellProperties: function(row,col,props)
		{
			var aserv=Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
			if (cookiesMaster._cookies[row]['isProtected'] && cookiesMaster.cookieCuller.enabled && cookiesMaster.prefCookieCuller && !cookiesMaster.prefCookieCullerDelete)
				props.AppendElement(aserv.getAtom("protected"));

			if (cookiesMaster._cookies[row]['deleted'])
				props.AppendElement(aserv.getAtom("deleted"));

			if (cookiesMaster._cookies[row]['deleting'])
				props.AppendElement(aserv.getAtom("deleting"));

			if (!cookiesMaster._cookies[row]['expires'])
				props.AppendElement(aserv.getAtom("session"));

			if (cookiesMaster._cookies[row]['expires'] && cookiesMaster._cookies[row]['expires'] *1000 < (new Date()).getTime())
				props.AppendElement(aserv.getAtom("expired"));

			if (col.type == col.TYPE_CHECKBOX && this.selection.isSelected(row))
				props.AppendElement(aserv.getAtom("checked"));

/*
			if (cookiesMaster._cookies[row]['updated'] && cookiesMaster._cookies[row]['updated'] + 60000 < (new Date()).getTime())
				props.AppendElement(aserv.getAtom("updated"));
*/
		},
		isEditable: function(row, col){ return col.editable; },
		setCellValue: function(row, col, val)
		{
			var s = true;
			if (this.selection.isSelected(row))
			{
				s = false;
				this.selection.clearRange(row,row);
				cookiesMaster.cookieSelected();
			}
			else
			{
				this.selection.rangedSelect(row,row, true);
			}
//			this.tree.invalidateRow(row);
//			cookiesMaster._cookies[row][col.id] = s;
		},
		getLevel: function(aIndex){},
		getParentIndex: function(aIndex){},
	},

	load: function()
	{
		cookiesMaster.start();
	},

	start: function()
	{
		this.inited = true;
		if (!this.app)
			return;

		this.isXP = window.navigator.oscpu.indexOf("Windows NT 5") != -1;

		document.getElementById("cookiesTreeChildren").setAttribute("xp", this.isXP);
		document.getElementById("menu_about").collapsed = !this.isFF4;
		document.getElementById("menu_about_sep").collapsed = !this.isFF4;
		this._aWindow = cookiesMasterCore.aWindow;
		cookiesMasterCore.aWindow = window;
		this._cb = document.getElementById("cookieBundle");
		this._cb2 = document.getElementById("bundlePreferences");

		this.strings.secureYes = this.string("forSecureOnly");
		this.strings.secureNo = this.string("forAnyConnection");
		this._cookiesTree = document.getElementById("cookiesTree");

		if (!cookiesMasterCore.updated)
		{
			let update = function(){};
			Cc["@mozilla.org/moz/jssubscript-loader;1"]
				.getService(Ci.mozIJSSubScriptLoader)
				.loadSubScript("chrome://cookiesmaster/content/update.js", update);
		}

		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		for(var i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_start" || rows[i].id == "row_end")
				continue;

			rows[i].firstChild.addEventListener("dragstart", this.dragstart, true);
			rows[i].addEventListener("dragenter", this.dragenter, true);
			rows[i].addEventListener("dragover", this.dragover, true);
			rows[i].addEventListener("dragend", this.dragend, true);
			document.getElementById("ifl_" + rows[i].id.replace("row_", "")).addEventListener("keydown", this.dragKeyDown, true);

		}
		cookiesMasterCore.lastKeyDown = [];
		document.getElementById("cookiesTree").addEventListener("keydown", this.onKeyDown, true);
		document.getElementById("cookiesTree").addEventListener("keyup", this.onKeyUp, true);
		document.getElementById("cookiesTree").addEventListener("scroll", this.treeScroll, true);
		document.getElementById("cookiesTree").addEventListener("select", this.cookieSelectedEvent, true);
		document.getElementById("cookiesTree").addEventListener("click", this.cookieSelectedEvent, true);
		document.getElementById("cookiesTree").addEventListener("mousedown", this.cookieSelectMouse, true);
		document.getElementById("cookiesTreeChildren").addEventListener("click", this.dblClickEdit, true);

		if ("arguments" in window && window.arguments.length)
		{
			this.args = window.arguments[0];
			if (this.args && typeof(this.args) == "object")
				this.args = this.args.wrappedJSObject;

			if (this.args.gBrowser)
			{
				let host;
				try
				{
					host = this.args.gBrowser.currentURI.host;
				}
				catch(e)
				{
					host = ""
				};
				this.website = true;
				this.websiteHost = host.toLowerCase();
/*
				this.prefFiltersearchcontent = false;
				this.prefFiltersearchhost = true;
				this.prefFiltersearchname = false;
				this.prefFiltersearchcase = false;
				this.prefFiltersearchrelaxed = true;
*/
				this.backup.filter = document.getElementById('lookupcriterium').getAttribute("filter");
				document.getElementById('lookupcriterium').setAttribute("filter", this.websiteHost);
			}
		}

		var searchfor = document.getElementById('lookupcriterium').getAttribute("filter");
		document.getElementById('lookupcriterium').value = searchfor;

		Cc["@mozilla.org/observer-service;1"]
			.getService(Ci.nsIObserverService)
			.addObserver(this, "cookie-changed", false);

		this.title = document.title + " v" + this.app.version
//		this.setFilter();
//		this.setSort();
		if (cookiesMasterCommon.isCookieCuller)
		{
			this.cookieCuller.init();
		}
		this.onPrefChange.do();
		this.loadCookies();
//		this.selectLastCookie(true);
		this.prefs.QueryInterface(Ci.nsIPrefBranch2).addObserver('', this.onPrefChange, false);
		this.onPrefChange.inited = true;
		this._cookiesTree.focus();
		switch (Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("ui.key.").getIntPref("accelKey"))
		{
			case 17:  this.accel = "CONTROL"; break;
			case 18:  this.accel = "ALT"; break;
			case 224: this.accel = "META"; break;
			default:  this.accel = (this.isMac ? "META" : "CONTROL");
		}
		var k = document.getElementById("platformKeys").getString("VK_" + this.accel);
		document.getElementById("infoRowUp").label += " (" + k + " + " + document.getElementById("localeKeys").getString("VK_UP") + ")";
		document.getElementById("infoRowDown").label += " (" + k + " + " + document.getElementById("localeKeys").getString("VK_DOWN") + ")";
		document.getElementById("cookiesMaster_inforow_drag_menu").getElementsByTagName("menuitem")[0].label = document.getElementById("infoRowUp").label;
		document.getElementById("cookiesMaster_inforow_drag_menu").getElementsByTagName("menuitem")[1].label = document.getElementById("infoRowDown").label;
		document.getElementById("sel").width = document.getElementById("sel").boxObject.height;
//treecolpicker
		document.getAnonymousElementByAttribute(document.getAnonymousNodes(document.getElementById("treecols"))[1], "anonid", "popup").addEventListener("command", this.treeViewSelectNative, true)
//window resize doesn't work properly with persist attribute. it resizes slightly bigger each time window opened.
/*
		var w = document.getElementById("main").boxObject.width;
		var h = document.getElementById("main").boxObject.height;
		if (document.width < w || document.height < h)
			window.sizeToContent();
*/
	},

	cookieSelectMouse: function(e)
	{
		if (e.button || (cookiesMaster.contextDelay + 300) > (new Date()).getTime())
		{
			e.stopPropagation();
			e.preventDefault();
		}
	},

	cookieSelectedEvent: function(e)
	{
		if (e.type != "select")
			return;

		cookiesMaster.cookieSelected();
	},

	unload: function()
	{

		if (this.website)
		{
			if (this.websiteHost == document.getElementById('lookupcriterium').getAttribute("filter"))
			{
//				document.getElementById('lookupcriterium').setAttribute("filter", this.backup.filter);
			}
		}
		cookiesMasterCore.aWindow = null;
		try
		{
			Cc["@mozilla.org/observer-service;1"]
				.getService(Ci.nsIObserverService)
				.removeObserver(this, "cookie-changed", false);
		}catch(e){}
		try
		{
			this.prefs.QueryInterface(Ci.nsIPrefBranch2).removeObserver('', this.onPrefChange, false);
		}catch(e){}
		try
		{
			document.getElementById("cookiesTree").removeEventListener("keydown", this.onKeyDown, true);
			document.getElementById("cookiesTree").removeEventListener("keyup", this.onKeyUp, true);
			document.getElementById("cookiesTree").removeEventListener("scroll", this.treeScroll, true);
			document.getElementById("cookiesTree").removeEventListener("select", this.cookieSelectedEvent, true);
			document.getElementById("cookiesTree").removeEventListener("click", this.cookieSelectedEvent, true);
			document.getElementById("cookiesTree").removeEventListener("mousedown", this.cookieSelectMouse, true);
			document.getElementById("cookiesTreeChildren").removeEventListener("click", this.dblClickEdit, true);
		}catch(e){}

		try
		{
			for(var i = 0; i < rows.length; i++)
			{
				if (rows[i].id == "row_start" || rows[i].id == "row_end")
					continue;

				rows[i].firstChild.removeEventListener("dragstart", this.dragstart, true);
				rows[i].removeEventListener("dragenter", this.dragenter, true);
				rows[i].removeEventListener("dragover", this.dragover, true);
				rows[i].removeEventListener("dragend", this.dragend, true);
				document.getElementById("ifl_" + rows[i].id.replace("row_", "")).removeEventListener("keydown", this.dragKeyDown, true);

			}
		}
		catch(e){};
		var selections = this.getTreeSelections(this._cookiesTree);
		var host = [], path = [], name = [];

		var idx = this._cookiesTree.treeBoxObject.view.selection.currentIndex;
		if (idx != -1)
		{
			host.push(this._cookies[idx].host);
			path.push(this._cookies[idx].path);
			name.push(this._cookies[idx].name);
		}
		for(var i = 0; i < selections.length; i++)
		{
			host.push(this._cookies[selections[i]].host);
			path.push(this._cookies[selections[i]].path);
			name.push(this._cookies[selections[i]].name);
		}
		// save last selected name
		this._cookiesTree.setAttribute("selectedHost", host.join("\n"));
		this._cookiesTree.setAttribute("selectedPath", path.join("\n"));
		this._cookiesTree.setAttribute("selectedName", name.join("\n"));

	},

	setChecked: function(id)
	{
		if (this["prefFilter" + id])
			document.getElementById(id).setAttribute("checked", true);
		else
			document.getElementById(id).removeAttribute("checked");

	},

	onPrefChangeDo: function()
	{
		cookiesMaster.onPrefChange.do();
	},

	onPrefChange: {
		inited: false,
		observe: function(subject, topic, key)
		{
			if (!cookiesMasterCore.prefNoObserve)
				this.do(subject, topic, key);
		},
		do: function(subject, topic, key)
		{
			var subject = typeof(subject) == "undefined" ? null : subject;
			var topic = typeof(topic) == "undefined" ? null : topic;
			var key = typeof(key) == "undefined" ? null : key;

			cookiesMaster.setFilter(subject, topic, key);
			cookiesMaster.prefAutoFilter = cookiesMaster.prefs.getBoolPref("autofilter");
			cookiesMaster.prefAutoUpdate = cookiesMaster.prefs.getBoolPref("autoupdate");
			cookiesMaster.prefTopmost = cookiesMaster.prefs.getBoolPref("topmost");
			cookiesMaster.prefDateFormat = cookiesMaster.prefs.getCharPref("dateformat");
			cookiesMaster.prefCookieCuller = cookiesMaster.prefs.getBoolPref("cookieculler");
			cookiesMaster.prefCookieCullerDelete = cookiesMaster.prefs.getBoolPref("cookiecullerdelete");

			if (key == "cookieculler")
				document.getElementById("row_isProtected").collapsed = !(cookiesMaster.prefCookieCuller && cookiesMaster.cookieCuller.enabled);

			cookiesMaster.setSort(subject, topic, key);
			var l = cookiesMaster.string("filter.refresh");
			if (!cookiesMaster.prefAutoFilter || (!cookiesMaster.prefAutoUpdate && !cookiesMaster.prefAutoFilter))
				l = cookiesMaster.string("filter.search") + "/" + cookiesMaster.string("filter.refresh");

			document.getElementById("lookupstart").label = l;
			if (key === null || key == "topmost")
			{
//topmost borrowed from Console2 extension
				var xulWin = window.QueryInterface(Ci.nsIInterfaceRequestor)
											.getInterface(Ci.nsIWebNavigation)
											.QueryInterface(Ci.nsIDocShellTreeItem)
											.treeOwner.QueryInterface(Ci.nsIInterfaceRequestor)
											.getInterface(Ci.nsIXULWindow);
				xulWin.zLevel = (cookiesMaster.prefTopmost) ? xulWin.raisedZ : xulWin.normalZ;
			}
			document.getElementById("menu_info_topmost").setAttribute("checked", cookiesMaster.prefTopmost);
			cookiesMaster.infoRowsShow();
			cookiesMaster.infoRowsSort();
			cookiesMaster.prefTemplateClipboard.value = cookiesMaster.prefs.getComplexValue("templateclipboard", Ci.nsISupportsString).data;
			cookiesMaster.prefTemplateFile.value = cookiesMaster.prefs.getComplexValue("templatefile", Ci.nsISupportsString).data;
			cookiesMaster.prefBackupFileName = cookiesMaster.prefs.getComplexValue("backupfilename", Ci.nsISupportsString).data;

			cookiesMaster.prefTemplateClipboard.extra = (cookiesMaster.prefTemplateClipboard.value.indexOf("{ISHTTPONLY}") != -1
																								|| cookiesMaster.prefTemplateClipboard.value.indexOf("{STATUS}") != -1
																								|| cookiesMaster.prefTemplateClipboard.value.indexOf("{CREATIONTIME}") != -1
																								|| cookiesMaster.prefTemplateClipboard.value.indexOf("{LASTACCESSED}") != -1
																								|| cookiesMaster.prefTemplateClipboard.value.indexOf("{ISHTTPONLY_RAW}") != -1
																								|| cookiesMaster.prefTemplateClipboard.value.indexOf("{STATUS_RAW}") != -1
																								|| cookiesMaster.prefTemplateClipboard.value.indexOf("{CREATIONTIME_RAW}") != -1
																								|| cookiesMaster.prefTemplateClipboard.value.indexOf("{LASTACCESSED_RAW}") != -1);
			cookiesMaster.prefTemplateFile.extra = (cookiesMaster.prefTemplateFile.value.indexOf("{ISHTTPONLY}") != -1
																						|| cookiesMaster.prefTemplateFile.value.indexOf("{STATUS}") != -1
																						|| cookiesMaster.prefTemplateFile.value.indexOf("{CREATIONTIME}") != -1
																						|| cookiesMaster.prefTemplateFile.value.indexOf("{LASTACCESSED}") != -1
																						|| cookiesMaster.prefTemplateFile.value.indexOf("{ISHTTPONLY_RAW}") != -1
																						|| cookiesMaster.prefTemplateFile.value.indexOf("{STATUS_RAW}") != -1
																						|| cookiesMaster.prefTemplateFile.value.indexOf("{CREATIONTIME_RAW}") != -1
																						|| cookiesMaster.prefTemplateFile.value.indexOf("{LASTACCESSED_RAW}") != -1);

			cookiesMaster.prefBackupEncrypt = cookiesMaster.prefs.getBoolPref("backupencrypt");
			if (cookiesMaster._cookiesAll.length > 0)
			{
				cookiesMaster.selectLastCookie(true);
			}
			cookiesMaster.resizeWindow();
		}
	},

	resizeWindow: function()
	{
		Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer).init({observe: function()
		{
			let w = -(document.width - parseInt(getComputedStyle(document.getElementById("main"), '' ).width));
			let h = -(document.height - parseInt(getComputedStyle(document.getElementById("main"), '' ).height));

//		cookiesMaster.dump(w + "x" + h + " | " + parseInt(getComputedStyle(document.getElementById("main"), '' ).width) + "x" + parseInt(getComputedStyle(document.getElementById("main"), '' ).height) + " | " + document.width + "x" + document.height);
			if (w || h)
				window.resizeBy(w, h);
		}}, 0, Ci.nsITimer.TYPE_ONE_SHOT);
	},

	loadCookies: function (criterium, noresort, updated)
	{
		var criterium = typeof(criterium) == "undefined" ? document.getElementById('lookupcriterium').getAttribute("filter") : criterium;
		// load cookies into a table
		var count = 0;
		var e = cookiesMasterCommon._cm.enumerator;
		this._cookiesAll = [];
/*
		if (!document.getElementById(this._cookiesTree.getAttribute("sortResource"))
				|| document.getElementById(this._cookiesTree.getAttribute("sortResource")).getAttribute("hidden") == "true")
			this._cookiesTree.setAttribute("sortResource", "rawHost");
*/

		var extra = ['creationTimeString', 'lastAccessedString', 'isHttpOnlyString', 'statusString'].indexOf(this._cookiesTree.getAttribute("sortResource")) != -1;
		while (e.hasMoreElements())
		{
			var nextCookie = e.getNext();
			if (!nextCookie || !(nextCookie instanceof Ci.nsICookie))
				break;

			var obj = new this.cookieObject(nextCookie, false, updated)
			this._cookiesAll.push(obj);

			if (criterium && !this._cookieMatchesFilter(nextCookie, criterium))
				continue;

			if (extra)
				obj = this._cookieGetExtraInfo(obj);

			this._cookies[count] = obj; //we can't use push() because we are replacing existing data to avoid flickering
			count++;
		}
		if (count < this._cookies.length) //to avoid flickering effect we replacing existing data in _cookies array, trimming off old data
		{
			this._cookies.splice(count, this._cookies.length - count);
		}
		this._noselectevent = true;
		this.sortTreeData(this._cookiesTree, this._cookies);
		this._cookiesTreeView.rowCount = this._cookies.length;
		this._cookiesTree.treeBoxObject.view = this._cookiesTreeView;
		this._selected = [];
		this._noselectevent = false;
		this.selectLastCookie(noresort);
	},

	_updateCookieData: function(aCookie, selections)
	{
		var selections = typeof(selections) == "undefined" ? this.getTreeSelections(this._cookiesTree) : selections;
		var multi = this.string("multipleSelection");
		var count = selections.length;
		if (this.prefShowExtra)
			aCookie = this._cookieGetExtraInfo(aCookie);

		var fixed = "QueryInterface" in aCookie ? new this.cookieObject(aCookie, false) : this.clone(aCookie);
		var value, field;
		for(var i = 0; i < count; i++)
		{
			if (this.prefShowExtra)
				this._cookies[selections[i]] = this._cookieGetExtraInfo(this._cookies[selections[i]]);

			var s = this._cookieEquals(aCookie, this._cookies[selections[i]]);
			for(var o in fixed)
			{
				if (typeof(fixed[o]) != "object" || fixed[o] === null)
					fixed[o] = [fixed[o], false, fixed[o]];

				if (!s && this._cookies[selections[i]] && o in this._cookies[selections[i]] && this._cookies[selections[i]][o] !== fixed[o][0])
				{
					fixed[o] = [multi, true, fixed[o]];
				}
			}
		}
		var props = [
			{id: "ifl_name", value: fixed.name},
			{id: "ifl_value", value: fixed.value},
			{id: "ifl_isDomain",
						 value: [aCookie.isDomain ?
										this.string("domainColon") : this.string("hostColon"), false]},
			{id: "ifl_host", value: fixed.host},
			{id: "ifl_path", value: fixed.path},
			{id: "ifl_isSecure",
						 value: [fixed.isSecure[1] ? fixed.isSecure[0] : (fixed.isSecure[0] ?
										this.strings.secureYes :
										this.strings.secureNo), fixed.isSecure[1]]},
			{id: "ifl_expires", value: [fixed.expires[1] ? fixed.expires[0] : this.getExpiresString(fixed.expires[0]), fixed.expires[1]]},
			{id: "ifl_expires2", value: [fixed.expires[1] ? fixed.expires[0] : this.getExpiresString(fixed.expires[0]), fixed.expires[1]]},
			{id: "ifl_status", value: [fixed.status[1] ? fixed.status[0] : this.string("status"+fixed.status[0]), fixed.status[1]]},
			{id: "ifl_policy", value: [fixed.policy[1] ? fixed.policy[0] : this.string("policy"+fixed.policy[0]), fixed.policy[1]]},

			{id: "ifl_lastAccessed", value: [fixed.lastAccessed[1] ? fixed.lastAccessed[0] : this.getExpiresString(Math.round(fixed.lastAccessed[0]/1000000)), fixed.lastAccessed[1]]},
			{id: "ifl_creationTime", value: [fixed.creationTime[1] ? fixed.creationTime[0] : this.getExpiresString(Math.round(fixed.creationTime[0]/1000000)), fixed.creationTime[1]]},
			{id: "ifl_isHttpOnly", value: [fixed.isHttpOnly[1] ? fixed.isHttpOnly[0] : this.string("yesno"+(fixed.isHttpOnly[0]?1:0)), fixed.isHttpOnly[1]]},
			{id: "ifl_isProtected", value: [fixed.isProtected[1] ? fixed.isProtected[0] : this.string("yesno"+(fixed.isProtected[0]?1:0)), fixed.isProtected[1], fixed.isProtected[2]]},
			{id: "ifl_isProtected2", value: [fixed.isProtected[1] ? fixed.isProtected[0] : this.string("yesno"+(fixed.isProtected[0]?1:0)), fixed.isProtected[1], fixed.isProtected[2]]},
		];
		this.showedExpires = fixed.expires[0] * 1000;
		this.showedCreationTime = fixed.creationTime[0] / 1000;
		var expired = (aCookie.expires && aCookie.expires*1000 < (new Date()).getTime());
		document.getElementById("ifl_expires").setAttribute("expired", expired);

		if (fixed.expires[1] || (!this.prefExpireProgress && !this.prefExpireCountdown))
		{
			document.getElementById("expireProgressText").hidden = true;
			document.getElementById("expireProgress").hidden = true;
			if (document.getElementById("expiresCountdown").hidden && document.getElementById("expiresProgress").hidden)
				this.expiresProgress.cancel(1);
		}
		else
		{
			document.getElementById("expireProgressText").hidden = !this.prefExpireCountdown;
			document.getElementById("expireProgressText").setAttribute("progress", this.prefExpireProgress);
			if (!fixed.expires[1] && fixed.expires[0] && !fixed.creationTime[1] && fixed.creationTime[0]/1000000 < fixed.expires[0])
			{
				document.getElementById("expireProgress").hidden = !this.prefExpireProgress;
				document.getElementById("expireProgress").setAttribute("text", this.prefExpireCountdown);
			}
			else
			{
				if (!fixed.expires[0])
					document.getElementById("expireProgressText").hidden = true;

				document.getElementById("expireProgress").hidden = true;
			}
		}
		for( var i = 0; i < props.length; i++ )
		{
			field = document.getElementById(props[i].id);
			field.setAttribute("multi", props[i].value[1]);
			field.setAttribute("empty", !props[i].value[0].length);
			field.value = props[i].value[0].length ? props[i].value[0] : this.string("empty");
			field.realValue = props[i].value[2];
		}

		if (!fixed.value[1] && fixed.value[0].length > 0)
		{
			document.getElementById("ifl_value").setAttribute("tooltip", "tooltipValue");
			document.getElementById("tooltipValue").label = document.getElementById("ifl_value").value;
		}
		else
		{
			document.getElementById("ifl_value").removeAttribute("tooltip");
		}
		this.secure((fixed.isSecure[0] && !fixed.isSecure[1]));
		if (this.cookieCuller.enabled && this.prefCookieCuller)
		{
			if (fixed.isProtected[1])
			{
				document.getElementById("protect_btn").collapsed = false;
				document.getElementById("unprotect_btn").collapsed = false;
				document.getElementById("menu_protect").collapsed = false;
				document.getElementById("menu_unprotect").collapsed = false;
			}
			else
			{
				document.getElementById("protect_btn").collapsed = fixed.isProtected[0];
				document.getElementById("unprotect_btn").collapsed = !fixed.isProtected[0];
				document.getElementById("menu_protect").collapsed = fixed.isProtected[0];
				document.getElementById("menu_unprotect").collapsed = !fixed.isProtected[0];
			}
			document.getElementById("cookieCullerMenuSeparator").collapsed = false;
		}
		document.getElementById("menu_exportclipboard").disabled = false;
		document.getElementById("menu_exportfile").disabled = false;
		document.getElementById("menu_backupselected").disabled = false;
		document.getElementById("menu_restoreselected").disabled = false;
		document.getElementById("menuBackupSelected").disabled = false;
		document.getElementById("menuRestoreSelected").disabled = false;
		if (!document.getElementById("expiresProgress").hidden
				|| !document.getElementById("expiresCountdown").hidden
				|| (!expired && aCookie.expires && !document.getElementById("expireProgressText").collapsed))
		{
			this.expiresProgress.init();
		}
		else if (expired || !aCookie.expires)
		{
			this.expiresProgress.cancel(1);
		}
	},

	expiresProgress: {
		timer: Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),
		started: false,
		init: function(f)
		{
			if (f || !this.started)
			{
				this.cancel();
				this.timer.init(this, 1000, this.timer.TYPE_REPEATING_SLACK);
				window.addEventListener("unload", this.unload, false);
				this.started = true;
			}
			this.observe(f);
		},
		unload: function()
		{
			cookiesMaster.expiresProgress.cancel();
		},
		cancel: function(f)
		{
			cookiesMaster.expiresProgress.timer.cancel();
			this.started = false;
			if (f)
				this.observe();
		},
		observe: function(f)
		{
			if (!document.getElementById("expiresProgress").hidden || !document.getElementById("expiresCountdown").hidden)
			{
				cookiesMaster._cookiesTree.treeBoxObject.invalidateRange(cookiesMaster._cookiesTree.treeBoxObject.getFirstVisibleRow(), cookiesMaster._cookiesTree.treeBoxObject.getLastVisibleRow())
				if (!cookiesMaster.showedExpires)
					return;
			}
			if (!cookiesMaster.showedExpires && document.getElementById("expiresProgress").hidden && document.getElementById("expiresCountdown").hidden)
			{
				this.cancel();
				return;
			}
			var d = new Date();
			var p = null;
			if (cookiesMaster.showedCreationTime)
			{
				var m = ((cookiesMaster.showedExpires - cookiesMaster.showedCreationTime) * 10000).toFixed();
				var n = ((cookiesMaster.showedExpires - d.getTime()) * 10000).toFixed();
				n = Math.round(n * 10000 / m);
				m = 10000; //as larger the number, as smoother the progress bar will be. It seems FF chokes on numbers larger then 10M though
				var p = n * 100 / m;
				if (p <= 0.0009)
					p = p.toFixed();
				else if (p <= 0.009)
					p = p.toFixed(3);
				else if (p <= 0.09)
					p = p.toFixed(2);
				else if (p <= 0.9)
					p = p.toFixed(1);
				else
					p = p.toFixed();
			}

			var e = cookiesMaster.showedExpires < d.getTime();

			var tt = cookiesMaster.strings.cookieexpired;
			if (e && !f && document.getElementById("expiresProgress").hidden && document.getElementById("expiresCountdown").hidden)
				this.cancel();
			else
			{
				var e = new Date(cookiesMaster.showedExpires);
				var dd = e-d;
				var dday = Math.floor(dd/(86400000)*1)
				var dhour = Math.floor((dd%(86400000))/(3600000)*1)
				var dmin = Math.floor(((dd%(86400000))%(3600000))/(60000)*1)
				var dsec = Math.floor((((dd%(86400000))%(3600000))%(60000))/1000*1)
				var s = cookiesMaster.strings;
				var t = [];
				var l;
				if (dday > 0)
					t.push(dday + " " + s['day' + (dday != 1 ? "s" : "")]);

				if (dhour > 0 || t.length)
					t.push(dhour + " " + s['hour' + (dhour != 1 ? "s" : "")]);


				if (dmin > 0 || t.length)
					t.push(dmin + " " + s['minute' + (dmin != 1 ? "s" : "")]);

				if (dsec > 0 || t.length)
					t.push(dsec + " " + s['second' + (dsec != 1 ? "s" : "")]);

				if (t.length)
					tt = cookiesMaster.strings.cookieexpire_progress.replace("#", t.join(", ")) + (p !== null ? " (" + cookiesMaster.strings.cookieexpire_progress_life.replace("#", p) + ")" : "");
				else
				{
					n = 0;
					e = true;
				}
			}
			document.getElementById("expireProgress").setAttribute("max", m);
			document.getElementById("expireProgress").value = n;
			document.getElementById("ifl_expires").setAttribute("expired", e);
			document.getElementById("expireProgressText").setAttribute("expired", e);
			document.getElementById("expiresProgressTooltip").setAttribute("label", tt);
			document.getElementById("expireProgressText").setAttribute("label", tt);
			document.getElementById("expireProgressText").value = tt;
		}
	},

	clearCookieProperties: function(l, d)
	{
		var properties =
			["ifl_name","ifl_value","ifl_host","ifl_path","ifl_isSecure",
				"ifl_expires", "ifl_expires2","ifl_policy", "ifl_isHttpOnly",
				"ifl_lastAccessed", "ifl_creationTime", "ifl_status",
				"ifl_isProtected", "ifl_isProtected2"];
		var l = typeof(l) == "undefined" ? 0 : l;
		l = (l == 0) ? this.string("noCookieSelected") : "";
		var field;
		for (var prop=0; prop<properties.length; prop++)
		{
			field = document.getElementById(properties[prop]);
			field.value = l;
			field.setAttribute("multi", true);
		}
		this.secure(false);
		if (d)
		{
			var b = this._cookiesTree.treeBoxObject.view.selection.selectEventsSuppressed;
			this._cookiesTree.treeBoxObject.view.selection.selectEventsSuppressed = true;
			this._cookiesTree.treeBoxObject.view.selection.clearSelection();
			this._cookiesTree.treeBoxObject.view.selection.currentIndex = null;
			this._cookiesTree.treeBoxObject.view.selection.selectEventsSuppressed = b;
		}
		document.getElementById("protect_btn").collapsed = true;
		document.getElementById("unprotect_btn").collapsed = true;
		document.getElementById("menu_protect").collapsed = true;
		document.getElementById("menu_unprotect").collapsed = true;
		document.getElementById("cookieCullerMenuSeparator").collapsed = true;
		document.getElementById("expireProgress").hidden = true;
		document.getElementById("expireProgressText").hidden = true;
		document.getElementById("menu_exportclipboard").disabled = true;
		document.getElementById("menu_exportfile").disabled = true;
		document.getElementById("menu_backupselected").disabled = true;
		document.getElementById("menu_restoreselected").disabled = true;
		document.getElementById("menuBackupSelected").disabled = true;
		document.getElementById("menuRestoreSelected").disabled = true;
		this._selected = [];
		this.UI_EnableCookieBtns(false, false);
		if (document.getElementById("expiresProgress").hidden	 && document.getElementById("expiresCountdown").hidden)
			this.expiresProgress.cancel(1);

	},

	clearFilter: function ()
	{
		document.getElementById('lookupcriterium').value = "";
		document.getElementById('lookupcriterium').setAttribute("filter", "");
		this.loadCookies();
	},

	checkFilter: function ()
	{
		return document.getElementById("lookupcriterium").value != document.getElementById("lookupcriterium").getAttribute("filter");
	},

	observe: function (aCookie, aTopic, aData)
	{
		if (this._noObserve || !this.prefAutoUpdate || aTopic != "cookie-changed")
			return;

		if (aCookie instanceof Ci.nsICookie)
		{
			if (aData == "changed")
				this._handleCookieChanged(aCookie);
			else if (aData == "added")
				this._handleCookieAdded(aCookie);
			else if (aData == "deleted")
				this._handleCookieDeleted(aCookie);
		}
		else if (aData == "cleared")
		{
			this._cookies = [];
			var oldRowCount = this._cookiesTreeView.rowCount;
			this._cookiesTreeView.rowCount = 0;
			this._cookiesTree.treeBoxObject.rowCountChanged(0, -oldRowCount);
			this._cookiesTree.treeBoxObject.view.selection.clearSelection();
			this._cookiesTree.treeBoxObject.view.selection.currentIndex = -1;
			this._selected = [];
			this.loadCookies();
		}
		else if (aData == "reload")
		{
			// first, clear any existing entries
			this.observe(aCookie, aTopic, "cleared");

			// then, reload the list
			this.loadCookies();
		}

	},

	_handleCookieAdded: function(aCookie)
	{
		this.loadCookies(document.getElementById('lookupcriterium').getAttribute("filter"), false, (new Date()).getTime());
	},

	_handleCookieDeleted: function(aCookie)
	{
		this.loadCookies();
	},

	_handleCookieChanged: function(aCookie)
	{
		for(var i = 0; i < this._cookies.length; i++)
		{
			if (this._cookieEquals(this._cookies[i], aCookie))
			{
				this._cookies[i] = new this.cookieObject(aCookie, false, (new Date()).getTime());
				if (this._isSelected(aCookie))
				{
					this._updateCookieData(aCookie);
				}
			}
		}
//		this.dump(this._cookiesTree.treeBoxObject.getFirstVisibleRow() + " | "  +  this._cookiesTree.treeBoxObject.getLastVisibleRow());
		this._cookiesTree.treeBoxObject.invalidateRange(this._cookiesTree.treeBoxObject.getFirstVisibleRow(), this._cookiesTree.treeBoxObject.getLastVisibleRow());
//		this._cookiesTree.treeBoxObject.invalidate();
	},

	_cookieEquals: function (aCookieA, aCookieB)
	{
		return aCookieA.host == aCookieB.host &&
					 aCookieA.name == aCookieB.name &&
					 aCookieA.path == aCookieB.path;
	},

	secure: function(type)
	{
		document.getElementById("secure").hidden = type ? false : true;
	},

	onKeyDown: function(e)
	{
		var keys = cookiesMaster.getKeys(e);
		if (cookiesMaster.matchKeys(cookiesMasterCore.lastKeyDown, keys[0], keys[0].length) || !("className" in e.target) || e.target.className == "hotkey") //prevent repeats
			return true;

		cookiesMasterCore.lastKeyDown = keys[0];
		var r = true;
		if (cookiesMaster.matchKeys(keys[0], ["RETURN"], 1))
		{
			cookiesMaster.openEdit();
		}
		else if (cookiesMaster.matchKeys(keys[0], ["DELETE"], 1))
		{
			cookiesMaster.deleteCookies();
		}
		else if (cookiesMaster.matchKeys(keys[0], ["SHIFT", "DELETE"], 2))
		{
			cookiesMaster.deleteCookies(true);
		}
		else if (cookiesMaster.matchKeys(keys[0], ["F5"], 1))
		{
			cookiesMaster.loadCookies(document.getElementById('lookupcriterium').getAttribute("filter"), true);
		}
		else if (cookiesMaster.matchKeys(keys[0], ["ACCEL", "A"], 2))
		{
			cookiesMaster.selectAllShown();
		}
		else if (cookiesMaster.matchKeys(keys[0], ["ALT", cookiesMaster.strings.cookieculler_protect_accesskey], 2))
		{
			e.preventDefault();
			e.stopPropagation();
			cookiesMaster.cookieCuller.protect();
			return false;
		}
		else if (cookiesMaster.matchKeys(keys[0], ["ALT", cookiesMaster.strings.cookieculler_unprotect_accesskey], 2))
		{
			e.preventDefault();
			e.stopPropagation();
			cookiesMaster.cookieCuller.unprotect();
			return false;
		}
		return true;
	},

	onKeyUp: function(e)
	{
		cookiesMasterCore.lastKeyDown = [];
		cookiesMaster.lastKeyTime = (new Date()).getTime();
		var keys = cookiesMaster.getKeys(e);
		if (cookiesMaster.matchKeys(keys[0], ["CONTEXT_MENU"], 1) || cookiesMaster.matchKeys(keys[0], ["SHIFT", "F10"], 2))
		{
			document.getElementById("cookiesMaster_tree_menu").openPopup(e.target, "overlap", 3, 0, false, false);
			e.preventDefault();
			e.stopPropagation();
		}
	},

	_isSelected: function(aCookie, list, r)
	{
		var list = list || this._selected;
		var r = r || [];
		for(var i = 0; i < list.length; i++)
		{
			if (this._cookieEquals(list[i], aCookie))
			{
				r[0] = i;
				return true;
			}
		}
		return false;
	},

	treeScroll: function()
	{
		cookiesMaster._cookiesTree.setAttribute("scrollPos", cookiesMaster._cookiesTree.treeBoxObject.getFirstVisibleRow());
	},

	selectLastCookie: function(noresort)
	{
		var s = this._cookiesTree.getAttribute("scrollPos");
		if (!noresort && this._cookies.length - this._cookiesTree.treeBoxObject.getPageLength() >= s)
			this._cookiesTree.treeBoxObject.scrollToRow(s);

		var stored = false, index = null, indexSelect = true;
		if (this._selected.length == 0)
		{
			stored = true;
			var host = this._cookiesTree.getAttribute("selectedHost").split("\n");
			var path = this._cookiesTree.getAttribute("selectedPath").split("\n");
			var name = this._cookiesTree.getAttribute("selectedName").split("\n");
			this._selected = []
			for(var i = 0; i < host.length; i++)
			{
				this._selected.push({
					host: host[i],
					path: path[i],
					name: name[i]
				});
			};
//			if (this._selected.length > 1)
				index = this._selected.splice(0, 1)[0];

			if (index)
			{
				indexSelect = this._isSelected(index, this._selected);
				if (!indexSelect)
					this._selected.splice(0, 0, index);
			}
		}
		var s = 0, idx, first = null, last = null;
		var currentIndex = this._cookiesTree.treeBoxObject.view.selection.currentIndex;
		var newIndex = null;
		if (this._selected.length)
		{
			var b = this._cookiesTree.treeBoxObject.view.selection.selectEventsSuppressed;
			this._cookiesTree.treeBoxObject.view.selection.selectEventsSuppressed = true;
			for(var i = 0; i < this._cookies.length; i++)
			{
				var r = [];
				if(this._isSelected(this._cookies[i], null, r))
				{
					idx = false;
					if (first === null)
						first = i;

					if (index)
					{
						idx = this._cookieEquals(this._cookies[i], index);
						if (idx && currentIndex == i)
							newIndex = i;

						if (idx && newIndex === null)
							newIndex = i
					}
					if (indexSelect || (!indexSelect && !idx))
					{
						last = i;
						this._cookiesTree.treeBoxObject.view.selection.rangedSelect(i, i , s ? true : false);
					}


					if (s > this._selected.length)
						break;

					s++
				}
			}
			if (newIndex !== null || first !== null)
			{
//				currentIndex = newIndex !== null ? newIndex : (this._cookies[currentIndex] && this._isSelected(this._cookies[currentIndex])) ? currentIndex : first;
				currentIndex = newIndex !== null ? newIndex : this._cookies[currentIndex] ? currentIndex : first;
				this._cookiesTree.treeBoxObject.view.selection.currentIndex = currentIndex;
			}

			if (stored)
				this._selected.splice(0, 1);

			
			if (!noresort)
			{
				var v = false;
				var f = this._cookiesTree.treeBoxObject.getFirstVisibleRow();
				var l = this._cookiesTree.treeBoxObject.getLastVisibleRow();
				for(i = 0; i < this._selected.length; i++)
				{
					if (this._selected[i] >= f || this._selected[i] <= l)
					{
						v = true;
						break;
					}
				}
				if (!v)
				{
					i = currentIndex != -1 ? currentIndex : first
					if (i !== null)
						this._cookiesTree.treeBoxObject.ensureRowIsVisible(i);
				}
			}
			this._cookiesTree.treeBoxObject.view.selection.selectEventsSuppressed = b;
		}
		if (!s)
		{
			this._cookiesTree.treeBoxObject.view.selection.clearSelection();
			this._cookiesTree.treeBoxObject.view.selection.currentIndex = -1;
			this._selected = [];
		}
		this.cookieSelected(noresort);
	},

	doLookup: function(e)
	{
		if (this.website)
		{
			this.website = false;
			this.setFilter();
		}
		if( (e && e.keyCode == 13) || !e || this.prefAutoFilter)
		{
			var searchfor = document.getElementById('lookupcriterium').value;
			document.getElementById('lookupcriterium').setAttribute("filter", searchfor);
			this.loadCookies();
		}
	},

	twochar: function(s)
	{
		var str =   '00' + s;
		return str.substring( ((str.length)-2) ,str.length);
	},

	cookieSelected: function (noresort)
	{
		if (this._noselectevent)
			return;

		var selections = this.getTreeSelections(this._cookiesTree);
		document.getElementById("sel").setAttribute("checked", (selections.length == this._cookies.length))

		document.title = this.title + "  [" + this.string("stats").replace("NN", this._cookies.length).replace("TT", this._cookiesAll.length).replace("SS", selections.length) + "]";
		if(selections.length < 1)
		{
			this.clearCookieProperties(0);
			return true;
		}

		var index = this._cookiesTree.treeBoxObject.view.selection.currentIndex;
		var idx = selections.indexOf(index);
		idx = selections[((idx == -1) ? 0 : idx)];
		if( idx >= this._cookies.length )
		{
			this.UI_EnableCookieBtns(false, false);
			return false;
		}

		this._selected = [];
		var host = [], path = [], name = [];

		if (this._cookies[index])
		{
			host.push(this._cookies[index].host);
			path.push(this._cookies[index].path);
			name.push(this._cookies[index].name);
		}
		for(var i = 0; i < selections.length; i++)
		{
			host.push(this._cookies[selections[i]].host);
			path.push(this._cookies[selections[i]].path);
			name.push(this._cookies[selections[i]].name);
			this._selected.push({
				host: this._cookies[selections[i]].host,
				path: this._cookies[selections[i]].path,
				name: this._cookies[selections[i]].name
			});
		}
		// save last selected name
		this._cookiesTree.setAttribute("selectedHost", host.join("\n"));
		this._cookiesTree.setAttribute("selectedPath", path.join("\n"));
		this._cookiesTree.setAttribute("selectedName", name.join("\n"));

		this._updateCookieData(this._cookies[idx], selections);
		// make the delete button active
		var del = (document.getElementById("ifl_isProtected").getAttribute("multi") == "true" || !this.cookieCuller.enabled || !this.prefCookieCuller || this.prefCookieCullerDelete || !document.getElementById("ifl_isProtected").realValue)

		this.UI_EnableCookieBtns(del, true);

		if ((index != -1 || selections.length) && !noresort)
			this._cookiesTree.treeBoxObject.ensureRowIsVisible(index != -1 ? index : selections[0]);

	//out_d("Cookie Manager::CookieSelected::END");

		return true;
	},

	cookieColumnSort: function(column, noresort)
	{
		this.sortTree( this._cookiesTree, this._cookies, column);
		this.selectLastCookie(noresort);
	},

	UI_EnableCookieBtns: function(flag, flag2)
	{
		document.getElementById('deleteCookie').disabled = !flag;
		document.getElementById('editCookie').disabled = !flag2;
		document.getElementById('menu_delete').disabled = !flag;
		document.getElementById('menu_delete_block').disabled = !flag;
		document.getElementById('menu_edit').disabled = !flag2;
		document.getElementById('tree_menu_delete').disabled = !flag;
		document.getElementById('tree_menu_delete_block').disabled = !flag;
		document.getElementById('tree_menu_edit').disabled = !flag2;
		document.getElementById('menuExportFile').disabled = !flag2;
		document.getElementById('menuExportClipboard').disabled = !flag2;
	},

	deleteCookies: function(block)
	{
		var deletedCookies = [];

		this.deleteSelectedItemFromTree(this._cookiesTree, this._cookiesTreeView,
																	 this._cookies, deletedCookies, block);
		if (!this._cookies.length)
			this.clearCookieProperties(0, true);

		this._noObserve = true;
		var coocul = this.finalizeCookieDeletions( deletedCookies );
		this._noObserve = false;
		this.loadCookies(undefined, true);
		if (coocul)
		{
			this.cookieCuller.obj.cookies = this._cookiesAll;
			this.cookieCuller.obj.saveProtCookies();
			this.cookieCuller.loadProtCookies();
		}
//		this.cookieSelected();
//		this.selectLastCookie(); //selection done in loadCookies()
	},

	deleteSelectedItemFromTree: function(tree, view, table, deletedTable, block)
	{
		var block = typeof(block) == "undefined" ? false : block;
		var DeleteAll = false;
		var uChoice = {button:0, block:block};
		var prefDeleteConf = this.prefs.getBoolPref("delconfirm", true);
		var index = this._cookiesTree.treeBoxObject.view.selection.currentIndex;

		var s = this.getTreeSelections(tree, table);
		// Turn off tree selection notifications during the deletion
		tree.treeBoxObject.view.selection.selectEventsSuppressed = true;

		// remove selected items from list (by setting them to null) and place in deleted list
		if (!this.cookieCuller.enabled || !this.prefCookieCuller || this.prefCookieCullerDelete)
			selections = s;
		else
		{
			var selections = [];
			for(var i = 0; i < s.length; i++)
			{
				if (!this._cookies[s[i]].isProtected)
					selections.push(s[i]);
			}
		}
		var params = [];
		for (var s = 0; s < selections.length; s++)
		{
			var i = selections[s];
				// delete = 1, delete all = 2, do not delete = 4, cancel = 3, close window = 0
			if (prefDeleteConf && !DeleteAll)
			{
				table[i].deleting = true;
				tree.treeBoxObject.invalidateRow(i);
				tree.treeBoxObject.ensureRowIsVisible(i);

				uChoice = this.promptDelete([table[i].name, table[i].host, selections.length - s], block);
				if (uChoice.button == 0 || uChoice.button == 4) //don't delete / close window
				{
					table[i].deleting = false;
					tree.treeBoxObject.invalidateRow(i);
					continue;
				}
				else if (uChoice.button == 3) //cancel
					break;
				else if (uChoice.button == 2) //delete all
					DeleteAll = true;
			}

			if ( DeleteAll || !prefDeleteConf || uChoice.button == 1 )
			{
				table[i].block = uChoice.block;
				table[i].deleted = true;
				deletedTable.push(table[i]);
			}
			table[i].deleting = false;
			tree.treeBoxObject.invalidateRow(i);
			tree.treeBoxObject.ensureRowIsVisible(i);
		}
		if (table[index].deleted)
		{
			for (var s = 0; s < selections.length; s++)
			{
				var i = selections[s];
				if (!table[i].deleted)
				{
					index = i;
					break;
				}
			}
		}
//		this.supress_getCellText = true;
		for (var j = 0; j < table.length; j++)
		{
			if (table[j].deleted)
				table.splice(j, 1);
		}
		view.rowCount = table.length;
		var newSelected = [];
		if (table.length)
		{
			var s = this._selected;
			for( var i = 0; i < s.length; i++ )
			{
				var r = [];
				if(this._isSelected(s[i], table, r))
					newSelected.push(table[r[0]]);
			}
			if (!newSelected.length)
			{
				var nextSelection = (selections[0] < table.length) ? selections[0] : table.length-1;
				newSelected.push({
					host: table[nextSelection].host,
					path: table[nextSelection].path,
					name: table[nextSelection].name
				});
			}
		}
		tree.treeBoxObject.view.selection.selectEventsSuppressed = false;
		this._selected = newSelected;
//		this.supress_getCellText = false;
	},

	finalizeCookieDeletions: function(deletedCookies)
	{
		var coocul = false;
		for (var c=0; c<deletedCookies.length; c++)
		{
			if (this.cookieCuller.enabled && this.prefCookieCuller && this.cookieCuller.obj.checkIfProtected(deletedCookies[c].name, deletedCookies[c].host, deletedCookies[c].path))
				coocul = true;

			cookiesMasterCommon._cm.remove(deletedCookies[c].host,
													 deletedCookies[c].name,
													 deletedCookies[c].path,
													 deletedCookies[c].block);
		}
		deletedCookies.length = 0;
		return coocul;
	},

	selectAllShown: function()
	{
		this._cookiesTree.treeBoxObject.view.selection.selectAll();
//		this._cookiesTree.focus();
	},

	selectAllTogle: function()
	{
		var s = this.getTreeSelections(this._cookiesTree);
		if (s.length == this._cookies.length)
			this._cookiesTree.treeBoxObject.view.selection.clearSelection();
		else
			this._cookiesTree.treeBoxObject.view.selection.selectAll();

//		this._cookiesTree.focus();
	},

	invertSelection: function()
	{
		var sel = this._cookiesTree.treeBoxObject.view.selection;
		var cnt = this._cookiesTree.treeBoxObject.view.rowCount ;


		for (var i=0;i<cnt;i++)
			sel.toggleSelect(i);

//		this._cookiesTree.focus();

	},

	setFilter: function(subject, topic, key)
	{
		if (!this.website)
		{
			this.prefFiltersearchcontent = this.prefs.getBoolPref("searchcontent");
			this.prefFiltersearchhost = this.prefs.getBoolPref("searchhost");
			this.prefFiltersearchname = this.prefs.getBoolPref("searchname");
			this.prefFiltersearchcase = this.prefs.getBoolPref("searchcase");
			this.prefFiltersearchrelaxed = this.prefs.getBoolPref("searchrelaxed");
		}
		this.setChecked("searchcontent");
		this.setChecked("searchhost");
		this.setChecked("searchname");
		this.setChecked("searchcase");
		this.setChecked("searchrelaxed");
		if (!this.prefFiltersearchcontent && !this.prefFiltersearchhost && !this.prefFiltersearchname)
		{
			var k = (topic == "nsPref:changed" && "prefFilter" + key in this) ? key : "searchhost";
			this['prefFilter' + k] = true;
			this.prefs.setBoolPref(k, true);
			return;
		}
		if (document.getElementById('lookupcriterium').getAttribute("filter") != "" && topic == "nsPref:changed" && "prefFilter" + key in this)
		{
			this.loadCookies();
			this.selectLastCookie(true);
		}
	},

	changeFilter: function(e)
	{
		var obj = e.originalTarget;
		this["prefFilter" + obj.id] = obj.hasAttribute("checked");
		this.prefs.setBoolPref(obj.id, obj.hasAttribute("checked"));
	},

	_cookieMatchesFilter: function (aCookie, filter)
	{
		if (this.website || this.prefFiltersearchrelaxed)
		{
			var website = this.website ? this.websiteHost : filter.toLowerCase();
			var host = aCookie.host.toLowerCase();
			if (host == website)
				return true;

			var p = -1;
			var l = website.lastIndexOf(".");
			while(1)
			{
				p = website.indexOf(".", p+1);
				if (p == -1 || p == l)
					if (this.website)
						return false;
					else
						break;

				if (host == website.substring(p))
					return true;
			}
		}
		if (this.prefFiltersearchcase)
			return (this.prefFiltersearchhost && aCookie.host.indexOf(filter) != -1) ||
						 (this.prefFiltersearchname && aCookie.name.indexOf(filter) != -1) ||
						 (this.prefFiltersearchcontent && aCookie.value.indexOf(filter) != -1);
		else
		{
			filter = filter.toLowerCase();
			return (this.prefFiltersearchhost && aCookie.host.toLowerCase().indexOf(filter) != -1) ||
						 (this.prefFiltersearchname && aCookie.name.toLowerCase().indexOf(filter) != -1) ||
						 (this.prefFiltersearchcontent && aCookie.value.toLowerCase().indexOf(filter) != -1);
		}
	},

	setSort: function(subject, topic, key)
	{
		this.prefSimpleHost = this.prefs.getIntPref("simplehost");
		if (topic == "nsPref:changed" && key == "simplehost")
			this.sortTree(this._cookiesTree, this._cookies);
	},

	openEdit: function()
	{
		var s = this.getTreeSelections(this._cookiesTree);
		if (!s.length)
		{
			this.openAdd();
			return;
		}
		var selIndex = s.indexOf(this._cookiesTree.treeBoxObject.view.selection.currentIndex);
		selIndex = s[((selIndex == -1) ? 0 : selIndex)]

		var cookies = [this._cookies[selIndex]];
		for(var i = 0; i < s.length; i++)
		{
			if (s[i] != selIndex)
				cookies[cookies.length] = this._cookies[s[i]];
		}
		this._openDialog("editCookie.xul", "_blank", "chrome,resizable,centerscreen,modal", {type: "edit", cookies: cookies});
	},

	openAdd: function()
	{
		this._openDialog("editCookie.xul", "_blank", "chrome,resizable,centerscreen,modal", {type: "add", cookies: this.getTreeSelections(this._cookiesTree).length ? [this._cookies[this._cookiesTree.treeBoxObject.view.selection.currentIndex]] : null});
	},

	openOptions: function()
	{
		this._openDialog("options.xul", "", "chrome,resizable=yes,centerscreen," + (this.isMac ? "dialog=no" : "modal"));
	},

	openChanges: function()
	{
		this._openDialog("changes.xul", "", "chrome,resizable=yes,centerscreen");
	},

	openCookies: function()
	{
		var cm = "chrome://browser/content/preferences/cookies.xul";
		var wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
		var browsers = wm.getZOrderDOMWindowEnumerator('', false);

		var browser;
		while (browser = browsers.getNext())
		{
			if (browser.location.href.toString() == cm)
			{
				browser.focus();
				return;
			}
		}
		var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
											 .getService(Components.interfaces.nsIWindowWatcher);
		var args = {
			window: window,
			type: "forced",
		};
		args.wrappedJSObject = args;
		ww.openWindow(null,	cm, "Browser:Cookies", "chrome,resizable,centerscreen", args).focus();
	},

	promptDelete: function(params, block)
	{
		var r = {button: 0, params: params, block: block};
		this._openDialog("promptDelete.xul", "promptDelete", "chrome,resizable=no,centerscreen,modal", r);
		return r;
	},

	openCookiesPermissions: function()
	{
		var cm = "chrome://browser/content/preferences/permissions.xul";
		var wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
		var browsers = wm.getZOrderDOMWindowEnumerator('', false);

		var browser;
		while (browser = browsers.getNext())
		{
			if (browser.location.href.toString() == cm)
			{
				browser.focus();
				return;
			}
		}
		var bundlePreferences = document.getElementById("bundlePreferences");
		var params = { blockVisible   : true,
									 sessionVisible : true,
									 allowVisible   : true,
									 prefilledHost  : "",
									 permissionType : "cookie",
									 windowTitle    : bundlePreferences.getString("cookiepermissionstitle"),
									 introText      : bundlePreferences.getString("cookiepermissionstext") };
		this._openDialog(cm, "Browser:Permissions", "chrome,resizable,centerscreen", params);
	},

	infoRowsShow: function()
	{
		this.prefExpireCountdown = !document.getElementById("expireProgressText").collapsed; //this.prefs.getBoolPref("expirecountdown");
		this.prefExpireProgress = !document.getElementById("expireProgress").collapsed;
		this.prefViewOrder = document.getElementById("cookieInfoRows").hasAttribute("order") ? document.getElementById("cookieInfoRows").getAttribute("order") : this.prefViewOrderDefault;
		this.prefView_name = !document.getElementById("row_name").collapsed;
		this.prefView_host = !document.getElementById("row_host").collapsed;
		this.prefView_value = !document.getElementById("row_value").collapsed;
		this.prefView_path = !document.getElementById("row_path").collapsed;
		this.prefView_expires = !document.getElementById("row_expires").collapsed;
		this.prefView_isSecure = !document.getElementById("row_isSecure").collapsed;
		this.prefView_creationTime = !document.getElementById("row_creationTime").collapsed;
		this.prefView_lastAccessed = !document.getElementById("row_lastAccessed").collapsed;
		this.prefView_isHttpOnly = !document.getElementById("row_isHttpOnly").collapsed;
		this.prefView_policy = !document.getElementById("row_policy").collapsed;
		this.prefView_status = !document.getElementById("row_status").collapsed;
		this.prefView_isProtected = !document.getElementById("row_isProtected").collapsed;

		this.prefShowExtra = this.prefView_creationTime || this.prefView_lastAccessed || this.prefView_isHttpOnly || this.prefView_status || this.prefExpireProgress;
		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var last, id;
		var s = 0;
		for(var i = 0; i < rows.length; i++)
		{
			id = rows[i].id.replace("row_", "");
			if ('prefView_' + id in this)
			{
//					rows[i].collapsed = !this['prefView_' + id];
				document.getElementById("menu_info_" + id).setAttribute("checked", this['prefView_' + id]);
			}
			if (!rows[i].collapsed && !rows[i].hidden)
			{
				rows[i].setAttribute("first", (!last));
				last = rows[i];
			}
		}
		document.getElementById("menu_info_expireProgress").disabled = !this.prefView_expires;
		document.getElementById("menu_info_expireProgressText").disabled = !this.prefView_expires;
		document.getElementById("menu_info_expireProgress").setAttribute("checked", this.prefExpireProgress);
		document.getElementById("menu_info_expireProgressText").setAttribute("checked", this.prefExpireCountdown);
		document.getElementById("cookieInfoBox").collapsed = last ? false : true;
		var c = (this.cookieCuller.enabled && this.prefCookieCuller);
//		document.getElementById("row_isProtected").hidden = !c;
		document.getElementById("row_isProtected").collapsed = !(c && this.prefView_isProtected);
		document.getElementById("isProtected").collapsed = !c;
		document.getElementById("cookieCullerMenuSeparator").collapsed = !c;
		document.getElementById("menu_info_isProtected").collapsed = !c;
		document.getElementById("menu_protect").collapsed = !c;
		document.getElementById("menu_unprotect").collapsed = !c;
		document.getElementById("tree_cookieCullerMenuSeparator").collapsed = !c;
		document.getElementById("tree_menu_protect").collapsed = !c;
		document.getElementById("tree_menu_unprotect").collapsed = !c;
		document.getElementById("coocul_btn").collapsed = !c;
		document.getElementById("isProtected")[c ? "removeAttribute" : "setAttribute"]("ignoreincolumnpicker", true);
		this.infoRowsChanged = this.prefViewOrder != this.prefViewOrderDefault;
		document.getElementById("menu_info_reset").disabled = !this.infoRowsChanged;
		this.resizeWindow();
	},

	infoRowsSort: function(order)
	{
		if (typeof(order) == "undefined")
			var order = this.prefViewOrder.split("|");//document.getElementById("cookieInfoRows").getAttribute("order").split("|");

		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var last, from, to;
		for(var i = 0; i < rows.length; i++)
		{
			if (!rows[i].collapsed && !rows[i].hidden && rows[i].id != "row_end")
			{
				if (!last)
				{
					this.infoRowsFirst = row;
					rows[i].setAttribute("first", true);
				}
				last = rows[i];
			}

			if (!order[i])
				continue;

			var row = document.getElementById("row_" + order[i]);
			if (!row || row.id == rows[i].id)
				continue;

			row.removeAttribute("highlight");
			from = row;
			to = rows[i];
			this.moveAfter(row, to);
			to.setAttribute("collapsed", to.collapsed);
		}
		if (last)
		{
			last.setAttribute("last", true);
			this.infoRowsLast = last;
		}
	},

	infoRowAction: function(e)
	{
		var o = e.currentTarget.parentNode.getElementsByTagName("textbox")[0]
		if (o.getAttribute("empty") == "true" || o.getAttribute("multi") == "true")
		{
			o.focus();
			return false;
		}
		if (!e.button)
			o.select();

		if (!e.button && e.detail > 1)
			this.infoRowCopyToClipboard(e);
	},

	infoRowCopyToClipboard: function(e)
	{
		if (e.button)
			return false;

		var o = e.currentTarget.parentNode.getElementsByTagName("textbox")[0]
		o.select();
		Cc["@mozilla.org/widget/clipboardhelper;1"]
		.getService(Ci.nsIClipboardHelper)
		.copyString(o.value);
	},

	infoRowContextCheck: function(e)
	{
		var obj = document.popupNode.getAttribute("onclick") != "" ? document.popupNode : document.popupNode.parentNode;
		var o = obj.parentNode.getElementsByTagName("textbox")[0]
		document.getElementById("infoRowCopy").disabled = (o.getAttribute("empty") == "true" || o.getAttribute("multi") == "true");
		document.getElementById("infoRowUp").disabled = obj.parentNode.id == cookiesMaster.infoRowsFirst.id;
		document.getElementById("infoRowDown").disabled = obj.parentNode.id == cookiesMaster.infoRowsLast.id;
		obj.click();
	},

	infoRowGetRowObj: function(p)
	{
		while(p)
		{
			if (p.tagName == "row")
				break;

			p = p.parentNode;
		}
		return p;
	},

	infoRowContextExec: function(e)
	{
		var obj = document.popupNode;
		var o = cookiesMaster.infoRowGetRowObj(obj);
		if (o)
			obj = o.firstChild;

		switch(e.target.value)
		{
			case "select":
					obj.click();
				break;
			case "copy":
					var evt = document.createEvent("MouseEvents");
					evt.initMouseEvent("click", true, true, window, 2, 0, 0, 0, 0, false, false, false, false, 0, null);
					obj.dispatchEvent(evt);
				break;
			case "up":
					var o = cookiesMaster.infoRowGetRowObj(obj.parentNode);
					if (o)
						cookiesMaster.dragMoveUp(o);
				break;
			case "down":
					var o = cookiesMaster.infoRowGetRowObj(obj.parentNode);
					if (o)
						cookiesMaster.dragMoveDown(o);
		}
		return true;
	},

	infoRowHighlight: function(obj, hide)
	{
		if (obj.editor)
			obj.editor.selectionController.setCaretEnabled(!(obj.getAttribute("empty") == "true" || obj.getAttribute("multi") == "true"));

		var o = this.infoRowGetRowObj(obj);
		if (o)
			if(hide)
				o.removeAttribute("highlight");
			else
				o.setAttribute("highlight", true);
	},

	moveAfter: function(item1, item2)
	{
		var parent = item1.parentNode
		parent.removeChild(item1)
		parent.insertBefore(item1, item2 ? item2.nextSibling : null)
	},

	dragstart: function(e)
	{
		cookiesMaster.dragStarted = true;
		var row = cookiesMaster.dragGetBox(e);
		row.getElementsByTagName("textbox")[0].focus();
		row.setAttribute("highlight", true);
		cookiesMaster.dragCancel = false;
		cookiesMaster.dragPause = false;
		e.dataTransfer.addElement(row);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.mozSetDataAt("application/x-moz-node", row, 0);
	},

	dragenter: function(e)
	{
		if (cookiesMaster.dragCancel || cookiesMaster.dragPause || !cookiesMaster.dragStarted)
			return true;

		e.preventDefault();
		return false;
	},

	dragover: function(e)
	{
		if (cookiesMaster.dragCancel || !cookiesMaster.dragStarted)
			return true;

		var obj = e.dataTransfer.mozGetDataAt("application/x-moz-node", 0);
		var box = document.getElementById("cookieInfoBox").boxObject;
		if (obj.firstChild.boxObject.x <= e.clientX && (obj.firstChild.boxObject.x + obj.firstChild.boxObject.width) >= e.clientX && e.clientY >= box.y && e.clientY <= (box.y + box.height))
		{
			var o = cookiesMaster.dragGetRow(e);
			if (o != cookiesMaster.dragoverObj)
			{
				cookiesMaster.dragoverObj = o;
				if (o)
				{
					var s;
					if (e.target.id == o.id)
						s = e.target.previousSibling;
					else
						s = o.previousSibling;

					cookiesMaster.dragoverShow(o.id);
				}
			}
			cookiesMaster.dragPause = false;
		}
		else
		{
			cookiesMaster.dragPause = true;
			cookiesMaster.dragoverShow();
			e.dataTransfer.effectAllowed = "none";
		}
		e.preventDefault();
		return false;
	},

	dragoverShow: function(id)
	{
		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var spacer, dragover, dragupdown, last, obj;
		for(var i = 0; i < rows.length; i++)
		{
			spacer = rows[i];
			if (spacer == last)
				continue;

			dragover = rows[i].id == id;
			if (dragover)
				obj = rows[i];

			dragupdown = "up"
			if(dragover)
			{
				if (spacer.collapsed)
				{
					spacer = document.getElementById("row_end");
					dragupdown = "down";
				}
				last = spacer;
			}
			spacer.setAttribute("dragover", dragover);
			spacer.setAttribute("dragupdown", dragupdown);
		}
	},

	dragend: function(e)
	{
		if (cookiesMaster.dragCancel || cookiesMaster.dragPause || !cookiesMaster.dragStarted)
			return false;

		cookiesMaster.dragStarted = false;
		cookiesMaster.dragCancel = true;
		cookiesMaster.dragoverShow();
		if (!e.dataTransfer.mozUserCancelled)
		{
			var obj = e.dataTransfer.mozGetDataAt("application/x-moz-node", 0);
			var t = obj.getElementsByTagName("textbox")[0];
			var r = [];
			for(var i = 0; i < t.editor.selection.rangeCount; i++)
				r.push(t.editor.selection.getRangeAt(i).cloneRange());

			var o = cookiesMaster.dragoverObj;
			if (o)
			{
				cookiesMaster.cookieInfoRowsOrderSave(obj, o);
				t.focus();
				for(var i = 0; i < r.length; i++)
				{
					t.editor.selection.addRange(r[i])
					t.selectionStart = r[i].startOffset;
					t.selectionEnd = r[i].endOffset;
				}
			}
/*
			var sel = cookiesMaster.getTreeSelections(cookiesMaster._cookiesTree);
			if (sel.length)
				cookiesMaster._updateCookieData(cookiesMaster._cookies[sel[0]], sel);
			else
				cookiesMaster.cookieSelected();
*/

		}
		cookiesMaster.dragoverObj = null;
		e.preventDefault();
		return false;
	},

	dragGetRow: function(e)
	{
		var dropTarget = e.target;
		var dropTargetCenter = dropTarget.boxObject.y + (dropTarget.boxObject.height / 2);
		var obj = cookiesMaster.dragGetBox(e);
		if (obj)
		{
			if (e.clientY > dropTargetCenter)
			{
				var o = obj.nextSibling;
				while(o)
				{
					if (!o.collapsed && !o.hidden && o.id != "row_end")
						break;

					o = o.nextSibling;
				}
				obj = o ? o : obj.nextSibling;
			}
		}
		return obj;
	},

	dragGetBox: function(e)
	{
		var obj = e.target;
		switch(obj.tagName)
		{
			case "spacer":
					obj = obj.nextSibling;
				break;
			case "hbox":
					obj = obj.parentNode;
				break;
			case "label":
					obj = obj.parentNode.parentNode;
				break;
		}
		if (obj && obj.tagName != "row")
			obj = null;

		return obj;
	},

	dragKeyDown: function(e)
	{
		var keys = cookiesMaster.getKeys(e);
		var r = true;
		var obj;
		var id = e.target.id.replace("ifl_", "");
		if (cookiesMaster.matchKeys(keys[0], ["ACCEL", "UP"], 2))
		{
			cookiesMaster.dragMoveUp(document.getElementById("row_" + id));
		}
		else if (cookiesMaster.matchKeys(keys[0], ["ACCEL", "DOWN"], 2))
		{
			cookiesMaster.dragMoveDown(document.getElementById("row_" + id));
		}
		else if (cookiesMaster.matchKeys(keys[0], ["UP"], 1))
		{
			cookiesMaster.dragChangeUp(document.getElementById("row_" + id));
		}
		else if (cookiesMaster.matchKeys(keys[0], ["DOWN"], 1))
		{
			cookiesMaster.dragChangeDown(document.getElementById("row_" + id));
		}
	},

	dragChangeUp: function(obj)
	{
		if (obj.id == this.infoRowsFirst.id)
			return;

		var id = obj.id.replace("row_", "");
		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var o = null;
		for(var i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_" + id)
				break;

			if (!rows[i].collapsed && !rows[i].hidden)
				o = rows[i];

		}
		if (o)
		{
			let t = o.getElementsByTagName("textbox")[0];
			t.focus();
			t.select();
		}
	},

	dragChangeDown: function(obj)
	{
		if (obj.id == this.infoRowsLast.id)
			return;

		var id = obj.id.replace("row_", "");
		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var o = null;
		var o2 = null;
		var s = false;
		for(var i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_" + id)
			{
				s = true;
				continue;
			}
			if (!s)
				continue;

			if (!rows[i].collapsed && !rows[i].hidden)
			{
				o = rows[i];
				break;
			}
		}
		if (o)
		{
			let t = o.getElementsByTagName("textbox")[0];
			t.focus();
			t.select();
		}
	},

	dragMoveUp: function(obj)
	{
		if (obj.id == this.infoRowsFirst.id)
			return;

		var id = obj.id.replace("row_", "");
		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var o = null;
		for(var i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_" + id)
				break;

			if (!rows[i].collapsed && !rows[i].hidden)
				o = rows[i];

		}
		if (o)
		{
			this.dragMove(obj, o);
		}
	},

	dragMoveDown: function(obj)
	{
		if (obj.id == this.infoRowsLast.id)
			return;

		var id = obj.id.replace("row_", "");
		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var o = null;
		var o2 = null;
		var s = false;
		for(var i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_" + id)
			{
				s = true;
				continue;
			}
			if (!s)
				continue;

			if (!rows[i].collapsed && !rows[i].hidden)
			{
				o2 = o;
				o = rows[i];
			}
			if (o2)
				break;
		}
		if (o)
		{
			this.dragMove(obj, o);
		}
	},

	dragMove: function(obj, o)
	{
		var field = document.getElementById(obj.id.replace("row_", "ifl_"));
		var selectionStart = field.selectionStart;
		var selectionEnd = field.selectionEnd;
		cookiesMaster.cookieInfoRowsOrderSave(obj, o);
		field.focus();
		field.selectionStart = selectionStart;
		field.selectionEnd = selectionEnd;
	},

	dragMenu: function(e, hide)
	{
		var obj = e.originalTarget;
		if (!obj.getElementsByAttribute("cookiesMaster", "true").length)
		{
			var menu = document.getElementById("cookiesMaster_inforow_drag_menu").childNodes;
			for(var i = 0; i < menu.length; i++)
			{
				var clone = document.importNode(menu[i], false);
				obj.appendChild(clone);
			}
		}
		var p = cookiesMaster.infoRowGetRowObj(e.target.parentNode);
		if (p)
		{
			if (hide)
				p.removeAttribute("highlight");
			else
				p.setAttribute("highlight", true);
		}
		obj.getElementsByAttribute("value", "up")[0].disabled = p.id == cookiesMaster.infoRowsFirst.id;
		obj.getElementsByAttribute("value", "down")[0].disabled = p.id == cookiesMaster.infoRowsLast.id;
	},

	cookieInfoRowsOrderSave: function(obj, target)
	{
		var rows = document.getElementById("cookieInfoRows").getElementsByTagName("row");
		var list = [];
		var id;
		for(var i = 0; i < rows.length; i++)
		{
			if (rows[i].id == obj.id && obj.id != target.id)
				continue

			if (rows[i].id == target.id && obj.id != target.id)
			{
				list.push(obj.id.replace("row_", ""));
				id = target.id;
			}
			else
				id = rows[i].id

			if (id != "row_start" && id != "row_end")
				list.push(id.replace("row_", ""));
		}
		var l = list.join("|");
		if (l != cookiesMaster.prefViewOrder)
		{
			cookiesMaster.prefViewOrder = l;
			document.getElementById("cookieInfoRows").setAttribute("order", l);
//			cookiesMaster.prefs.setCharPref("vieworder", l);
			cookiesMaster.infoRowsSort(list);
			var sel = cookiesMaster.getTreeSelections(cookiesMaster._cookiesTree);
			if (sel.length)
				cookiesMaster._updateCookieData(cookiesMaster._cookies[sel[0]], sel);
			else
				cookiesMaster.cookieSelected();
		}
		this.infoRowsShow();
	},

	cookieInfoRowsReset: function()
	{
		this.prefViewOrder = this.prefViewOrderDefault;
		document.getElementById("cookieInfoRows").setAttribute("order", this.prefViewOrderDefault);
//		cookiesMaster.clearUserPref("vieworder");
		cookiesMaster.infoRowsSort();
		var sel = cookiesMaster.getTreeSelections(cookiesMaster._cookiesTree);
		if (sel.length)
			cookiesMaster._updateCookieData(cookiesMaster._cookies[sel[0]], sel);
		else
			cookiesMaster.cookieSelected();

		this.infoRowsShow();
	},

	treeView: function(aPopup)
	{
//addopted from chrome://global/content/bindings/tree.xml
		// We no longer cache the picker content, remove the old content.
		while (aPopup.childNodes.length > 4)
			if (aPopup.firstChild.tagName == "menuitem" && !aPopup.firstChild.id.match("treeViewRest"))
				aPopup.removeChild(aPopup.firstChild);

		var refChild = aPopup.firstChild;

		var tree = cookiesMaster._cookiesTree;
		var i = 0;
		var d = true;
		for (var currCol = tree.columns.getFirstColumn(); currCol; currCol = currCol.getNext())
		{
			// Construct an entry for each column in the row, unless
			// it is not being shown.
			var currElement = currCol.element;
			if (d && i++ != currCol.index)
			{
				d = false;
			}

			if (!currElement.hasAttribute("ignoreincolumnpicker")) {
				var popupChild = document.createElement("menuitem");
				popupChild.setAttribute("type", "checkbox");
				popupChild.setAttribute("closemenu", "none");
				var columnName = currElement.getAttribute("display") ||
												 currElement.getAttribute("label");
				if (columnName.match(/\*$/))
					popupChild.setAttribute("tooltiptext", cookiesMaster.strings.fields_note);

				popupChild.setAttribute("label", columnName);
				popupChild.setAttribute("colindex", currCol.index);
				if (currElement.getAttribute("hidden") != "true")
					popupChild.setAttribute("checked", "true");
				if (currCol.primary)
					popupChild.setAttribute("disabled", "true");
				aPopup.insertBefore(popupChild, refChild);
			}
		}
		aPopup.getElementsByAttribute("anonid", "treeViewRest")[0].disabled = d;
	},

	treeViewSelectNative: function(event)
	{
		cookiesMaster.treeViewSelect(event);
		if (!document.getElementById("expiresProgress").hidden || !document.getElementById("expiresCountdown").hidden)
			cookiesMaster.expiresProgress.init();

		event.stopPropagation();
	},

	treeViewSelect: function(event)
	{
		var tree = cookiesMaster._cookiesTree;
		if (event.originalTarget.parentNode.id.match("treeViewSort"))
		{
			cookiesMaster.treeViewSortSelect(event)
			event.originalTarget.setAttribute("tooltiptext", cookiesMaster.strings[tree.getAttribute("sortDirection")]);
		}
		else
		{
//addopted from chrome://global/content/bindings/tree.xml
			tree.stopEditing(true);
			var menuitem = event.originalTarget.parentNode.getElementsByAttribute("anonid", "treeViewRest")[0];
			if (event.originalTarget == menuitem) {
				tree.columns.restoreNaturalOrder();
				tree._ensureColumnOrder();
				cookiesMaster.treeView(event.target.parentNode)
			}
			else {
				var colindex = event.originalTarget.getAttribute("colindex");
				var column = tree.columns[colindex];
				if (column) {
					var element = column.element;
					if (element.getAttribute("hidden") == "true")
						element.setAttribute("hidden", "false");
					else
						element.setAttribute("hidden", "true");
				}
			}
		}
	},

	treeViewSort: function(aPopup)
	{
		var tree = cookiesMaster._cookiesTree;
		// We no longer cache the picker content, remove the old content.
		while (aPopup.childNodes.length > 0)
			aPopup.removeChild(aPopup.firstChild);

		var column = tree.getAttribute("sortResource");
		var refChild = aPopup.firstChild;
		for (var currCol = tree.columns.getFirstColumn(); currCol;
				 currCol = currCol.getNext()) {
			// Construct an entry for each column in the row, unless
			// it is not being shown.
			var currElement = currCol.element;
			if (currElement.id != "colhid" && currElement.id != "sel" && currElement.getAttribute("hidden") != "true")
			{
				var popupChild = document.createElement("menuitem");
				popupChild.setAttribute("type", "radio");
				popupChild.setAttribute("closemenu", "none");
				popupChild.setAttribute("class", "menuitem-iconic sortmenu");
				popupChild.setAttribute("label", currElement.getAttribute("label"));
				popupChild.setAttribute("colindex", currCol.index);
				if (column == tree.columns[currCol.index].id)
				{
					popupChild.setAttribute("sortDirection", tree.getAttribute("sortDirection"));
					popupChild.setAttribute("tooltiptext", cookiesMaster.strings[tree.getAttribute("sortDirection")]);
					popupChild.setAttribute("checked", "true");
				}
				aPopup.insertBefore(popupChild, refChild);
			}
		}
	},

	treeViewSortSelect: function(event)
	{
		var tree = cookiesMaster._cookiesTree;
		var index = event.originalTarget.getAttribute("colindex");
		cookiesMaster.cookieColumnSort(tree.columns[index].id);
		var items = event.originalTarget.parentNode.childNodes;
		for(var i = 0; i < items.length; i++)
		{
			if (items[i].getAttribute("colindex") == index)
			{
				items[i].setAttribute("checked", true);
				items[i].setAttribute("sortDirection", tree.getAttribute("sortDirection"));
			}
			else
				items[i].setAttribute("checked", false);
		}
	},

	menuView: function(e)
	{
		if (e.target.id == "menu_info_reset")
		{
			this.cookieInfoRowsReset();
		}
		else if (e.target.id == "menu_info_topmost")
		{
			this.prefs.setBoolPref("topmost", e.target.getAttribute("checked") == "true");
			return;
		}
		else if (e.target.id.match("menu_info"))
		{
			var o = document.getElementById(e.target.id.replace("menu_info_", "row_"));
			if (!o)
				o = document.getElementById(e.target.id.replace("menu_info_", ""));
//			cookiesMaster.prefs.setBoolPref("view" + e.target.id.replace("menu_info_", "").toLowerCase(), e.target.getAttribute("checked") == "true");
			o.collapsed = e.target.getAttribute("checked") != "true";
			o.setAttribute("collapsed", o.collapsed);
			this.infoRowsShow();
		}
		this.cookieSelected();
	},

	openAbout: function()
	{
		openDialog("chrome://mozapps/content/extensions/about.xul",
							 "", "chrome,centerscreen,modal", this.app);
	},

	dblClickEdit: function(e)
	{
		if (!e.button && e.detail == 2)
		{
			var col={};
			e.rangeParent.treeBoxObject.getCellAt(e.clientX, e.clientY, {}, col, {});
			if (col.value.id == 'sel')
				return;

			cookiesMaster.openEdit();
		}
	},
};

var wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var browsers = wm.getZOrderDOMWindowEnumerator('', false);
var b = false;
while (browsers.hasMoreElements())
{
	var browser = browsers.getNext();
	if (browser.location.toString().indexOf("cookiesmaster.xul") != -1 && browser.cookiesMaster.winid != this.winid)
	{
		browser.focus();
		window.close();
	}
}

