Components.utils.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");
var coomanPlus = {
	_cw: null,
	args: null,
	sync: false,
	load: function()
	{
		window.removeEventListener("load", coomanPlus.load, true);
		coomanPlus.init();
	},

	init: function()
	{
		this._cw = gCookiesWindow;
		this._cw._tree.view.selection.clearSelection();
		document.getElementById("removeAllCookies").parentNode.insertBefore(document.getElementById("coomanPlusButton"), document.getElementById("removeAllCookies").nextSibling);
		document.getElementById("cookiesList").addEventListener("select", this._selected, false);
		this.sync = coomanPlusCommon.prefs.getBoolPref("nativesync")
		document.getElementById("csmSync").setAttribute("checked", this.sync);

	},

	openCSM: function()
	{
		if (!this.args)
			this.args = {};

		this.args.window = coomanPlusCore.openCSM();
	},

	_selected: function()
	{
		var args = coomanPlus.args;
		if (!args || !coomanPlus.sync || !args.window || !("coomanPlus" in args.window))
			return;

		var csm = args.window.coomanPlus;
		var _cw = coomanPlus._cw;
		var seln = _cw._tree.view.selection;
		var item;
		if (!_cw._view._filtered)
			item = _cw._view._getItemAtIndex(seln.currentIndex);
		else
			item = _cw._view._filterSet[seln.currentIndex];

		if (item.container)
			csm._selected = item.cookies;
		else
			csm._selected = [item];

		csm._cookiesTree.treeBoxObject.view.selection.currentIndex = -1;
		csm.selectLastCookie();
		var s = csm.getTreeSelections(csm._cookiesTree);
		var f = csm._cookiesTree.treeBoxObject.getFirstVisibleRow();
		var l = csm._cookiesTree.treeBoxObject.getLastVisibleRow();
		for(var i = 0; i < s.length; i++)
			if (s[i] < f || s[i] > l)
			{
				var p = csm._cookies.length - csm._cookiesTree.treeBoxObject.getPageLength();
				if (s[0] > p)
					s[0] = p;

				csm._cookiesTree.treeBoxObject.scrollToRow(s[0]);
				break;
			}
	},

	syncChange: function(e)
	{
		this.sync = e.target.getAttribute("checked") == "true";
		coomanPlusCommon.prefs.setBoolPref("nativesync", this.sync);
		e.stopPropagation();
		e.preventDefault();
		return false;
	},
}
coomanPlus.dump = function (aMessage, obj)
{
	var r = "";
	var t = typeof(aMessage);
	if (obj && t != "string" && t != "number" && t != "bool")
	{
		for(var i in aMessage)
			try
			{
				r = r + i + ": " + aMessage[i] + "\n";
			}catch(e){r = r + i + ": " + e + "\n"};


		if (r)
			r = "\n-------------\n"+t+"\n"+r;
	}
	Components.classes["@mozilla.org/consoleservice;1"]
		.getService(Components.interfaces.nsIConsoleService)
		.logStringMessage("CookiesManager+: " + aMessage + r);
};
var forced = false;
if ("arguments" in window && window.arguments.length && typeof(window.arguments[0]) == "object" && window.arguments[0] !== null)
{
	coomanPlus.args = window.arguments[0].wrappedJSObject;
	forced = coomanPlus.args.type == "forced";
}

if (coomanPlusCommon.prefs.getBoolPref("alwaysusecookiesmanagerplus") && !forced)
{
	gCookiesWindow.init = function(){};
	gCookiesWindow.uninit = function(){};
	coomanPlusCore.openCSM();
	window.close();
}
else
{
	window.addEventListener("load", coomanPlus.load, true);
}