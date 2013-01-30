 /* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.org.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Author(s): Michael Ryabushkin
 *
 * ***** END LICENSE BLOCK ***** */

/*----------------------
 Contains some of the code is from Mozilla original Cookie Editor
 ----------------------*/
Components.utils.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");
coomanPlusCore.lastKeyDown = [];

var coomanPlus = {
	aWindowBackup: null,
	standalone: true,
	winid: new Date(),
	_cb: null,
	instantApply: false,
	load: function()
	{
		coomanPlus.init();
	},

	init: function()
	{
		this._cb = document.getElementById("cookieBundle");
		this._cb2 = document.getElementById("bundlePreferences");

		this.strings.secureYes = this.string("forSecureOnly");
		this.strings.secureNo = this.string("forAnyConnection");
		this.test(document.getElementById("format"));
		this.instantApply = Cc["@mozilla.org/preferences-service;1"]
												.getService(Ci.nsIPrefBranch)
												.getBoolPref("browser.preferences.instantApply");

		var tree = document.getElementById("dateList");
		var p = null;
		var t = (new Date()).getTime() / 1000;
		for(var i = 0; i < tree.view.rowCount; i++)
		{
			if (p == null)
			{
				if (tree.view.getCellValue(i, tree.columns[0]) != "presets")
					continue;

				p = i;
				continue
			}
			if (tree.view.getParentIndex(i) != p)
				break;

			var val = tree.view.getCellValue(i, tree.columns[0]) != "default" ? tree.view.getCellText(i, tree.columns[0]) : "";

			tree.view.setCellText(i, tree.columns[2], ("Ex: " + this.getExpiresString(t, val)));
		}
		document.getElementById("cookiecullerCheckbox").addEventListener("CheckboxStateChange", this.enableDisable, false);
//		document.getElementById("ifl_expires").addEventListener("CheckboxStateChange", this.enableDisable, false);
		document.getElementById("templateclipboardinput").editor.transactionManager.clear();
		document.getElementById("templatefileinput").editor.transactionManager.clear();
		document.getElementById("templateclipboardinput").selectionStart = 0;
		document.getElementById("templateclipboardinput").selectionEnd = 0;
		document.getElementById("templatefileinput").selectionStart = 0;
		document.getElementById("templatefileinput").selectionEnd = 0;
		document.getElementById("dateList").addEventListener("keydown", this.dateFormatAdd, true);
		document.getElementById("dateList").addEventListener("click", this.dateFormatAdd, true);
		if (document.getElementById("options").tabs.itemCount <= parseInt(document.getElementById("options").getAttribute("selectedIndex")))
			document.getElementById("options").selectedIndex = 0;

		if (document.getElementById("exportChildren").tabs.itemCount <= parseInt(document.getElementById("exportChildren").getAttribute("selectedIndex")))
			document.getElementById("exportChildren").selectedIndex = 0;

		this.enableDisable();
		document.getElementById("dateListBox").setAttribute("collapsed", document.getElementById("dateListBox").collapsed);
		document.getElementById("dateListSplitter").setAttribute("state", document.getElementById("dateListBox").collapsed ? "collapsed" : "open");
		document.getElementById("dateListSplitter").setAttribute("substate", document.getElementById("dateListBox").collapsed ? "before" : "");
		this.exportFilename({target: document.getElementById("fieldBackupfilename")});
		this.dateListSizeMax();
	},

	unload: function()
	{
		coomanPlusCore.aWindowOptions = null;
		if (!coomanPlus.standalone)
			coomanPlusCore.aWindow = coomanPlus.aWindowBackup;
	},

	openLink: function(e)
	{
		var w = window.open('http://php.net/manual/en/function.date.php', "dateManual", "resizable=yes,scrollbars=yes,location=yes,centerscreen");
		if (this.prefTopmost)
		{
			var xulWin = w.QueryInterface(Ci.nsIInterfaceRequestor)
									.getInterface(Ci.nsIWebNavigation)
									.QueryInterface(Ci.nsIDocShellTreeItem)
									.treeOwner.QueryInterface(Ci.nsIInterfaceRequestor)
									.getInterface(Ci.nsIXULWindow);
			xulWin.zLevel = xulWin.normalZ;
		}
		w.focus();
	},

	enableDisable: function()
	{
		document.getElementById("cookiecullerbox").collapsed = !coomanPlusCommon.isCookieCuller;
		document.getElementById("cookiecullerdeleteCheckbox").disabled = !document.getElementById("cookiecullerCheckbox").checked;
	},

	test: function(obj)
	{
		document.getElementById("test").value = this.getExpiresString((new Date()).getTime()/1000, obj.value);
	},

	observeSend: function(data)
	{
		var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		var observerSubject = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
		observerSubject.data = data;
		observerService.notifyObservers(observerSubject, "coomanPlusWindow", null);
	},

	cookieInfoRowsReset: function()
	{
		this.observeSend("cookieInfoRowsReset");
	},

	templateReset: function(id)
	{
		document.getElementById("template" + id + "input").value = coomanPlusCommon.prefsDefault.getComplexValue("template" + id, Ci.nsISupportsString);
		document.getElementById("prefpane").userChangedValue(document.getElementById("template" + id + "input"));
	},

	backupDecrypt: function()
	{
		this.backupRemovePassword();
	},

	backupEncrypt: function()
	{
		this.backupAddPassword();
	},

	dateFormatAdd: function(e)
	{
		let k = coomanPlus.getKeys(e);
		if ((e.type == "click" && !e.button && e.detail > 1)
				|| (e.type == "keydown" && (coomanPlus.matchKeys(k[0], ["SPACE"], 1)
						|| coomanPlus.matchKeys(k[0], ["ENTER"], 1))))
		{
			var tree = document.getElementById("dateList");
			var start = new Object();
			var end = new Object();
			tree.view.selection.getRangeAt(0, start, end);
			if (!tree.view.isContainer(start.value))
			{
				if (tree.view.getCellValue(tree.view.getParentIndex(start.value), tree.columns[0]) == "presets")
				{
					let val = tree.view.getCellValue(start.value, tree.columns[0]) == "default" ? "" : tree.view.getCellText(start.value, tree.columns[0]);
					document.getElementById("format").value = val;
				}
				else
				{
					var val = tree.view.getCellText(start.value, tree.columns[0]);
					var start = document.getElementById("format").selectionStart;
					var end = document.getElementById("format").selectionEnd;
					document.getElementById("format").value = document.getElementById("format").value.substring(0, start) + val + document.getElementById("format").value.substring(end);
					document.getElementById("format").selectionStart = start + val.length;
					document.getElementById("format").selectionEnd = start + val.length;
				}
				coomanPlus.test(document.getElementById("format"));
				var event = document.createEvent("Events");
				event.initEvent("change", true, true);
				document.getElementById("format").dispatchEvent(event);
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		return false;
	},

	dateListSizeMax: function()
	{
		document.getElementById("formatBox").style.minHeight = (document.getElementById("dateListBox").collapsed ? 8 : 20) + "em";
	},

	dateListSize: function(e)
	{
		this.dateListSizeMax();
		document.getElementById(document.getElementById("dateListBox").collapsed ? "format" : "dateList").focus();
		let w = -(parseInt(getComputedStyle(document.getElementById("prefpane"), '' ).width) - parseInt(getComputedStyle(document.getElementById("main"), '' ).width));
		let h = -(parseInt(getComputedStyle(document.getElementById("prefpane"), '' ).height) - parseInt(getComputedStyle(document.getElementById("main"), '' ).height));
		if (w || h)
			window.resizeBy(w, h);

		document.getElementById("dateListBox").setAttribute("collapsed", document.getElementById("dateListBox").collapsed);
	},
	
	exportFilename: function(e)
	{
		var file = this.getFilename(true, e.target.value);
		document.getElementById("backupfilenameTest").value = file;
	},
}
function srGetStrBundle()
{
	return document.getElementById("pippkiBundle");
}

if (coomanPlusCore.aWindowOptions)
{
	coomanPlusCore.aWindowOptions.focus();
	window.close()
}
coomanPlusCore.aWindowOptions = window;
if ("arguments" in window && window.arguments.length && "window" in window.arguments[0])
{
	coomanPlus.aWindowBackup = coomanPlusCore.aWindow;
	coomanPlusCore.aWindow = window;
	coomanPlus.standalone = false;
}

var xulWin = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIWebNavigation)
						.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
						.treeOwner.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIXULWindow);
xulWin.zLevel = xulWin.raisedZ;
