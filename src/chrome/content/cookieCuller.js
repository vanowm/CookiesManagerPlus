coomanPlus.cookieCuller = {
	obj: null,
	inited: false,
	enabled: false,
	cookies: null,
	init: function()
	{
		this.enabled = true;
		try
		{
			this.obj = function(){};
			Cc["@mozilla.org/moz/jssubscript-loader;1"]
				.getService(Ci.mozIJSSubScriptLoader)
				.loadSubScript("chrome://cookieculler/content/CookieCullerViewer.js", this.obj);

			this.obj.cookieculler_prefs.QueryInterface(Ci.nsIPrefBranch2).addObserver('', this, false);
			document.getElementById("coocul_btn").setAttribute("image", "chrome://cookieculler/skin/cookiecullersmall.png");
			window.addEventListener("unload", function()
			{
				coomanPlus.cookieCuller.obj.cookieculler_prefs.QueryInterface(Ci.nsIPrefBranch2).removeObserver('', coomanPlus.cookieCuller, false);
			}, true);
		}
		catch(e){this.enabled = false; coomanPlusCommon.isCookieCuller = false};
		this.inited = true;
		if (this.enabled)
		{
			this.cookies = coomanPlus._cookiesAll;
			this.prefChanged();
		}
	},

	observe: function(subject, topic, key)
	{
		if (coomanPlus.cookieCuller.prefChangedIgnore)
			return;

		coomanPlus.cookieCuller.prefChangedTimer.cancel();
		coomanPlus.cookieCuller.prefChangedTimer.init(function()
		{
			coomanPlus.cookieCuller.prefChangedIgnore = true;
			coomanPlus.cookieCuller.prefChanged(subject, topic, key);
			coomanPlus.loadCookies();
			coomanPlus.cookieCuller.prefChangedIgnore = false;
		}, 0, coomanPlus.cookieCuller.prefChangedTimer.TYPE_ONE_SHOT);
	},


	prefChanged: function(subject, topic, key)
	{
		this.loadProtCookies();
	},

	prefChangedIgnore: false,
	prefChangedTimer: Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),

	loadProtCookies: function()
	{
		this.obj.savedcookies = [];
		this.obj.loadProtCookies();
	},

	protect: function(aCookie)
	{
		if (!this.enabled)
			return

		if (!aCookie)
		{
			var s = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
			if (!s)
				return;

			var p = false;
			for(var i = 0; i < s.length; i++)
			{
				var r = [];
				if(!coomanPlus._isSelected(coomanPlus._cookies[s[i]], coomanPlus._cookiesAll, r) || coomanPlus._cookies[s[i]].isProtected)
					continue;

				p = true;
				coomanPlus._cookies[s[i]].isProtected = true;
				coomanPlus._cookiesAll[r[0]].isProtected = true;
			}
			if (!p)
				return;

			coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow());
//				coomanPlus._cookiesTree.treeBoxObject.invalidate();

		}
		else
		{
			var r = [];
			if(coomanPlus._isSelected(aCookie, coomanPlus._cookiesAll, r))
				coomanPlus._cookiesAll[r[0]].isProtected = aCookie.isProtected;
			else
				coomanPlus._cookiesAll.push(aCookie);
		}
		this.obj.cookies = coomanPlus._cookiesAll;
		this.obj.saveProtCookies();
		this.loadProtCookies();
		if (!aCookie)
			coomanPlus.cookieSelected();
	},

	unprotect: function(aCookie)
	{
		if (!this.enabled)
			return

		if (!aCookie)
		{
			var s = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
			if (!s)
				return;

			var p = false;
			for(var i = 0; i < s.length; i++)
			{
				var r = [];
				if(!coomanPlus._isSelected(coomanPlus._cookies[s[i]], coomanPlus._cookiesAll, r) || !coomanPlus._cookies[s[i]].isProtected)
					continue;

				p = true;
				coomanPlus._cookies[s[i]].isProtected = false;
				coomanPlus._cookiesAll[r[0]].isProtected = false;
			}
			if (!p)
				return;

			coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow());
//				coomanPlus._cookiesTree.treeBoxObject.invalidate();

		}
		else
		{
			var r = [];
			if(coomanPlus._isSelected(aCookie, coomanPlus._cookiesAll, r))
				coomanPlus._cookiesAll[r[0]].isProtected = aCookie.isProtected;
			else
				coomanPlus._cookiesAll.push(aCookie);
		}
		this.obj.cookies = coomanPlus._cookiesAll;
		this.obj.saveProtCookies();
		this.loadProtCookies();
		if (!aCookie)
			coomanPlus.cookieSelected();
	},
	open: function()
	{
		var wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
		var browser = wm.getMostRecentWindow("navigator:browser");
		var m = browser.document.getElementById("menu_ToolsPopup").childNodes;
		for(var i = 0; i < m.length; i++)
		{
			if (m[i].getAttribute("oncommand").indexOf("cookieculler") != -1)
			{
				m[i].click();
				return;
			}
		}
	}
}
