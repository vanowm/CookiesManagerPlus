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
	_params: null,
	focused: null,
	_aWindow: null,

	_addFlag: false,
	_addFlagNew: false,
	_curCookie: null,
	_newCookie: null,
	_cb: null, //cookie bundle
	_parent: null,
	_multi: false,
	backup: {},
	prefs: coomanPlusCommon.prefs,
	mouseScrollTimeStamp: 0,

	load: function()
	{
		coomanPlus.init();
	},

	init: function()
	{
		this._aWindow = coomanPlusCore.aWindow;
		coomanPlusCore.aWindow = window;

		this._params = window.arguments[0];
		this._parent = this._params.document;

		this._addFlag = this._params.type == "add";
		this._cb = document.getElementById("bundlePreferences");

		document.getElementById('ifl_isSecureYes').label = document.getElementById('ifl_isSecureYes').value = this.string("forSecureOnly");
		document.getElementById('ifl_isSecureNo').label = document.getElementById('ifl_isSecureNo').value = this.string("forAnyConnection");

		if (this._params.cookies) //this._params.window.coomanPlus._selected.length == 1)
		{
			this._multi = (this._params.cookies.length > 1);
			var aCookie = this.clone(this._cookieGetExtraInfo(this._params.cookies[0]));
			if (this._addFlag)
			{
				aCookie.name = "";
				aCookie.value = "";
			}
			this._curCookie = new this.cookieObject(aCookie);
		}
		else
			this._curCookie = new this.cookieObject({name:"",value:"",host:"",path:"",isSecure:false,expires:0,policy:0,isHttpOnly:false});
		document.getElementById("ifl_name").readonly = this._multi;
		document.getElementById("ifl_host").readonly = this._multi;
		document.getElementById("ifl_path").readonly = this._multi;
		if (this._multi)
		{
			document.getElementById("c_name").disabled = this._multi;
			document.getElementById("c_host").disabled = this._multi;
			document.getElementById("c_path").disabled = this._multi;
			this.backup["c_name"] = document.getElementById("c_name").checked;
			this.backup["c_host"] = document.getElementById("c_host").checked;
			this.backup["c_path"] = document.getElementById("c_path").checked;
			document.getElementById("c_name").checked = false;
			document.getElementById("c_host").checked = false;
			document.getElementById("c_path").checked = false;
			document.title += " (" + this._params.cookies.length + " " + this.string("cookies") + ")";
			document.getElementById("ifl_value").setAttribute("type", "multi");
			document.getElementById("multiSelect").collapsed = false;
//			document.getElementById("valueMenuBox").collapsed = false;
//			document.getElementById("ifl_value").style.marginRight = 0;
			Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer).init({observe: function(){coomanPlus.loadMenu()}}, 0, Ci.nsITimer.TYPE_ONE_SHOT);
//			window.onresize = this.valueMenuSize;
		}
		for(var i in this._curCookie)
		{
			if (!document.getElementById("c_" + i))
				continue;

			if (this._addFlag)
				document.getElementById("c_" + i).disabled = true;

			document.getElementById("c_" + i).setAttribute("checked", !this._multi && this._addFlag ? true : document.getElementById("c_" + i).checked);
			document.getElementById("c_" + i).addEventListener("CheckboxStateChange", this.enableDisable, false);
			this.enableDisableChildren(document.getElementById("c_" + i));
		}
/*
		document.getElementById("ifl_expires_date").addEventListener("change", this.fixDate, true);
		document.getElementById("ifl_expires_time").addEventListener("change", this.fixTime, true);
*/
		document.getElementById("ifl_expires_Year").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Month").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Day").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Hours").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Minutes").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Seconds").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		window.addEventListener("focus", this.focus, true);
		if (this._addFlag)
		{
			document.title = this.string("titleAdd");
			document.getElementById("editCookie").hidden = false;

			document.getElementById('ifl_isSecure').value = document.getElementById('ifl_isSecureNo').value;

			document.getElementById("expr_selection").value = "expr_new";

			var newdate = (new Date());

			//add a day to the default time, so it does not expire right away.
			var newdate = (this.dateAdd(newdate, "d", 1));

			document.getElementById("ifl_expires_date").value = this.getDateStr(newdate);
			document.getElementById('ifl_expires_time').value = this.getTimeStr(newdate); //newdate.getHours() + ':' + newdate.getMinutes() + ':' +newdate.getSeconds();

			this.rebuildDateSelection(document.getElementById("expr_new"), true);
			//set date/time picker fields
		}
		this.setFieldProps();
		this.showNew();
	},

	loadMenu: function()
	{
		var c = this._params.cookies;
		for(var i = 0; i < c.length; i++)
		{
			let v = c[i].name + " @ " + c[i].host + c[i].path;
			if (!i)
			{
				document.getElementById("multiDefault").setAttribute("label", v);
			}
			document.getElementById("multiDefault").appendItem(v, i).setAttribute("tooltiptext", v);
			document.getElementById("ifl_value").appendItem("(" + v + ") " + c[i].value, c[i].value).setAttribute("tooltiptext", c[i].value);
		}
		document.getElementById("multiDefault").selectedIndex = 0;
	},

	unload: function()
	{
		coomanPlus.uninit();
	},

	uninit: function()
	{
		coomanPlusCore.aWindow = this._aWindow;

		for(var i in this._curCookie)
		{
			if (!document.getElementById("c_" + i))
				continue;

			document.getElementById("c_" + i).removeEventListener("CheckboxStateChange", this.enableDisable, false);
		}
/*
		document.getElementById("ifl_expires_date").removeEventListener("change", this.fixDate, true);
		document.getElementById("ifl_expires_time").removeEventListener("change", this.fixTime, true);
*/
		document.getElementById("ifl_expires_Day").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Month").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Year").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Hours").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Minutes").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		document.getElementById("ifl_expires_Seconds").removeEventListener("DOMMouseScroll", this.mouseScroll, true);

		for(var i in this.backup)
			document.getElementById(i).setAttribute("checked", this.backup[i]);

		window.removeEventListener("focus", this.focus, true);
	},

	focus: function(e)
	{
		coomanPlus.focused = "id" in e.target ? e.target.id : null;
	},

	setAttribute: function (obj, attr, value, remove)
	{
		if (typeof(obj) == "string")
			obj = document.getElementById(obj);

		var c = obj.childNodes;
		var command = remove ? "removeAttribute" : "setAttribute";
		function readonly(tagName)
		{
			return ["textbox"].indexOf(tagName) != -1
							|| obj.getAttribute("accept") == "readonly";
		}
		obj[command]((attr == "disabled" && readonly(obj) ? "readonly" : attr), value);
		for(var i = 0; i < c.length; i++)
		{
			if (c[i][command])
				c[i][command]((attr == "disabled" && readonly(c[i]) ? "readonly" : attr), value);

			if (c[i].childNodes.length > 0)
				this.setAttribute(c[i], attr, value, remove);
		}
	},

	enableDisable: function(e)
	{
		e.target.setAttribute("checked", e.target.checked); //work around of bug https://bugzilla.mozilla.org/show_bug.cgi?id=15232
		coomanPlus.enableDisableChildren(e.target);
		coomanPlus.showNew();
	},

	enableDisableChildren: function(obj)
	{
		coomanPlus.setAttribute(obj.parentNode.nextSibling, "disabled", !obj.checked, obj.checked);
	},

	secure: function()
	{
		document.getElementById("secure").hidden = document.getElementById('ifl_isSecure').value == document.getElementById('ifl_isSecureNo').value;
	},

	mouseScroll: function(e)
	{
		if (e.axis != e.VERTICAL_AXIS || e.timeStamp == coomanPlus.mouseScrollTimeStamp)
			return true;

		coomanPlus.mouseScrollTimeStamp = e.timeStamp;
	/*

	var t = "";
	var a = e.target;
	for(var i in a)
		t = t + i + ": " + a[i] + "\n";
	alert(t);
	*/
		if (e.target.id != coomanPlus.focused)
		{
	//		return true;
			e.target.focus();
		}
		var dir = e.detail > 0 ? "down" : "up";
		var s = e.target.parentNode.getElementsByTagName("spinbuttonsH");
		if (!s.length)
		{
			s = e.target.parentNode.getElementsByTagName("spinbuttonsV");
		}
		if (s.length)
		{
			coomanPlus.spinEvent("", s[0], dir);
		}
		return false;
	},

	setFieldProps: function()
	{
		var field;
		var i;
		var d = document;


		var props = [
			{id: "ifl_name", value: this._curCookie.name, readonly: true, hidden: false },
			{id: "ifl_value", value: this._curCookie.value, readonly: false, hidden: false},
			{id: "ifl_host", value: this._curCookie.host, readonly: true, hidden: false },
			{id: "ifl_path", value: this._curCookie.path, readonly: true, hidden: false },
			{id: "ifl_isSecure",
			 value: this._curCookie.isSecure ?
							this.string("forSecureOnly") :
							this.string("forAnyConnection"), readonly: false, hidden: false },
			{id: "ifl_expires", value: this._curCookie.expires, readonly: true, hidden: true },
			{id: "ifl_expires_date", value: "", readonly: true, hidden: false },
			{id: "ifl_expires_time", value: "", readonly: true, hidden: false },
			{id: "ifl_isHttpOnly", value: this._curCookie.isHttpOnly ? "true" : "false" , readonly: true, hidden: false },
		];


		for(i = 0; i < props.length; i++ )
		{
			field						= d.getElementById(props[i].id);
			field.value			= props[i].value;
			field.readonly	= props[i].readonly;
			field.hidden		= props[i].hidden;
		}

		this.secure();
		//rearrange radio bttons if this is a session cookie
		var sel = "new";
		if (!this._curCookie.expires)
		{
			sel = "session";
			var newdate = (new Date());

			//add a day to the default time, so it does not expire right away.
			var newdate = (this.dateAdd(newdate, "d", 1));

			d.getElementById("ifl_expires_date").value = this.getDateStr(newdate);
			d.getElementById('ifl_expires_time').value = this.getTimeStr(newdate); //newdate.getHours() + ':' + newdate.getMinutes() + ':' +newdate.getSeconds();

		}
		else
		{
			d.getElementById("ifl_expires_date").value = this.getDateStr(new Date(d.getElementById("ifl_expires").value*1000))
			d.getElementById('ifl_expires_time').value = this.getTimeStr(new Date(d.getElementById("ifl_expires").value*1000))
		}

		d.getElementById("expr_selection").value  = "expr_" + sel;
		//collapse the new date dialog
	//  d.getElementById("datetimepickerbox").hidden = true;
		this.rebuildDateSelection(document.getElementById("expr_" + sel));
		//set date/time picker fields
		this.fixDate();
		this.setDateField();
		this.fixTime();
		this.setTimeField();
	},

	rebuildDateSelection: function(radio, noresize)
	{
		if (radio.id == "expr_new")
			document.getElementById("datetimepickerbox").collapsed = false;
		else
			document.getElementById("datetimepickerbox").collapsed = true;
		this.showWarning();
		if (!noresize)
		Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer).init({observe: function(){coomanPlus.resizeWindow()}}, 0, Ci.nsITimer.TYPE_ONE_SHOT);
//			this.resizeWindow();
	},

	getExpireSelection: function()
	{
		switch (document.getElementById('expr_selection').value)
		{
			case "expr_new":
				return Date.parse(document.getElementById('ifl_expires_date').value + ' ' + document.getElementById('ifl_expires_time').value) / 1000;
			case "expr_session":
				return false;
			default:
				return this._curCookie.expires;
		}
		return this._curCookie.expires;

	},


	test_url: function(host, path)
	{
		var temp;
		var newuri = null;
		//check url
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		temp = "http://" + host + "/";
		try
		{
			newuri = ioService.newURI(temp, null, null);
		}
		catch(e)
		{
			try
			{
				temp = "http://[" + host + "]/";
				newuri = ioService.newURI(temp, null, null);
				try
				{
					temp += path
					newuri = ioService.newURI(temp, null, null);
				}
				catch(e)
				{
					return 'not a valid path: ' + path;
				}
			}
			catch(e)
			{
				return 'not a valid host: ' + host;
			}
		}
		return 0;
	},

	createNewCookie: function(check)
	{
		check = typeof(check) == "undefined" ? true : check;
		var name = this.trim(document.getElementById("ifl_name").value);
		var value = document.getElementById("ifl_value").value;
		var host = this.trim(document.getElementById("ifl_host").value);
		var path = this.trim(document.getElementById("ifl_path").value);
		var isHttpOnly = (document.getElementById("ifl_isHttpOnly").value == "true");
		if (check)
		{
			var isValidURI = this.test_url(host, path);

			if ( isValidURI != 0 )
			{
				alert('Error: \n' + isValidURI);
				return false;
			}

			if ( !(name.length > 0) )
			{
				alert('Error: \n' + 'please specify name');
				return false;
			}
/*
			if ( !(value.length > 0) ) {
				alert('Error: \n' + 'please specify value');
				return false;
			}
*/
		}

		this._newCookie = new this.cookieObject({
												name: this._escape(name, 4),
												value: this._escape(value, 0),
												host: this._escape(host, 4),
												path: this._escape(path),
												isSecure: document.getElementById("ifl_isSecure").value == coomanPlus.string("forSecureOnly"),
												expires: this.getExpireSelection(),
												policy: this._curCookie.policy,
												isHttpOnly: isHttpOnly
											});
		return true;

	},

	doEscape: function(obj)
	{
		let node = document.getElementById(obj.getAttribute("control"));
		if (obj.checked)
			node.value = this._escape(node.value, 11);
		else
			node.value = this._unescape(node.value, 11);
	},

	_cookieEquals: function (aCookieA, aCookieB)
	{
		return this.trim(aCookieA.host) == this.trim(aCookieB.host) &&
					 this.trim(aCookieA.name) == this.trim(aCookieB.name) &&
					 this.trim(aCookieA.path) == this.trim(aCookieB.path);
	},

	cookieMerge: function(a, b)
	{
		var r = {};
		for(var i in a)
		{
			r[i] = a[i];
			if (document.getElementById("c_" + i))
				if (document.getElementById("c_" + i).checked)
					r[i] = b[i];
		}

		return r;
	},

	saveCookie: function(asNew)
	{
		asNew = typeof(asNew) == "undefined" ? false : true;
	//out_d2("Cookie Manager::SaveCookie::BEGIN");

		var d= document;

		if (!this.createNewCookie())
			return false;

		var exists = coomanPlusCommon._cm2.cookieExists(this._newCookie);
		var cookieEqual = this._cookieEquals(this._curCookie, this._newCookie);
		if (!cookieEqual && exists)
		{
			if (!window.confirm(this.string("overwrite")))
				return false;
		}
		var list = this._params.cookies;
		if (!list)
			list = [this._curCookie];

		var selected = [];
		for(var i = 0; i < list.length; i++)
		{
			var aCookie = this.cookieMerge(list[i], this._newCookie);
			cookieEqual = this._cookieEquals(aCookie, list[i]);
			if(this._addFlag
					|| (!this._addFlag && !exists)
					|| !cookieEqual
					|| (aCookie.value != list[i].value)
					|| (aCookie.expires != list[i].expires)
					|| (aCookie.isSecure != list[i].isSecure)
					|| (aCookie.isHttpOnly != list[i].isHttpOnly)
				)
			{
				this._params.window.coomanPlus._noObserve = true;
				if (!this._addFlag && !asNew && !cookieEqual)
				{
					coomanPlusCommon._cm.remove(list[i].host, list[i].name, list[i].path, false);
				}
				coomanPlusCommon._cm2.add(aCookie.host,
											aCookie.path,
											aCookie.name,
											aCookie.value,
											aCookie.isSecure,
											aCookie.isHttpOnly,
											(aCookie.expires) ? false : true,
											aCookie.expires || Math.round((new Date()).getTime() / 1000 + 9999999999)
				);
				this._params.window.coomanPlus._noObserve = false;
			}
			selected.push(aCookie);
		}
		this._params.window.coomanPlus.loadCookies(this._parent.getElementById('lookupcriterium').getAttribute("filter"));
		this._params.window.coomanPlus._selected = selected;
		this._params.window.coomanPlus._cookiesTree.treeBoxObject.view.selection.currentIndex = -1;
		this._params.window.coomanPlus.selectLastCookie(); //we need this because loadCookies clears _selected
	//out_d2("Cookie Manager::SaveCookie::END");
		window.close();

		return true;

	},

	showNew: function()
	{
		var d = document;
		this.createNewCookie(false);
		try
		{
			coomanPlusCommon._cm2.cookieExists(this._newCookie);
			var ok = true;
		}
		catch(e)
		{
			var ok = false;
		}
		var e = (!ok
							|| !this.trim(d.getElementById('ifl_name').value)
							||	!this.trim(d.getElementById('ifl_host').value)
							||	(!d.getElementById('c_name').checked
										&& !d.getElementById('c_host').checked
										&& !d.getElementById('c_path').checked
										&& !d.getElementById('c_value').checked
										&& !d.getElementById('c_expires').checked
										&& !d.getElementById('c_isSecure').checked
										&& !d.getElementById('c_isHttpOnly').checked
									)
						);

		d.getElementById("editCookie").disabled = e;
		if (this._addFlag || this._multi)
			return;

		var aCookie = this.cookieMerge(this._curCookie, this._newCookie);
		this._addFlagNew = !this._cookieEquals(aCookie, this._curCookie);
		d.getElementById("editCookieNew").hidden = false;
		if (this._addFlagNew && !e)
		{
			d.getElementById("editCookieNew").disabled = false;
	//    d.getElementById("editCookie").style.fontWeight = "normal";
		}
		else
		{
			d.getElementById("editCookieNew").disabled = true;
	//    d.getElementById("editCookie").style.fontWeight = "bold";
		}
	},

	saveCookiesCheck: function(e)
	{
//		if (e.keyCode == KeyEvent.DOM_VK_RETURN && (this._addFlag || !this._addFlagNew))
		if (e.keyCode == KeyEvent.DOM_VK_RETURN && !document.getElementById("editCookie").disabled)
		{
			return this.saveCookie();
		}
		return false;
	},

	resizeWindow: function(f)
	{
		var w = document.getElementById("main").boxObject.width;
		var h = document.getElementById("main").boxObject.height;
	//	alert(document.width + "x" + document.height +"\n" + w + "x" + h);
		if (f || document.width < w || document.height < h)
			window.sizeToContent();
	},

	showValueSelect: function(e)
	{
		document.getElementById("ifl_value").value = e.target.value;
	},

	showDefaultSelect: function(e)
	{
		this._curCookie = new this.cookieObject(this._params.cookies[e.target.value]);
		this.setFieldProps();
	},

	valueMenuSize: function(e)
	{
//		document.getElementById("valueMenu").menupopup.style.maxWidth = document.getElementById("ifl_value").clientWidth + "px";
	},
	showMenu: function(e, hide)
	{
		var node = document.popupNode;
		if (!node)
			return;

		var obj = e.originalTarget;
		if (!obj.nodesAdded && !obj.hasAttribute("coomanPlus"))
		{
			obj.nodesAdded = true;
			var menu = document.getElementById("coomanPlus_menu").childNodes;
			for(var i = 0; i < menu.length; i++)
			{
				var clone = menu[i].cloneNode(true);
				obj.appendChild(clone);
			}
		}
/*
		var start = node.selectionStart,
				end = node.selectionEnd;
		obj.getElementsByAttribute("value", "escape")[0].disabled = start == end;
		obj.getElementsByAttribute("value", "unescape")[0].disabled = start == end;
*/
/*
		obj.getElementsByAttribute("value", "escape")[0].disabled = node.getAttribute("readonly") == "true";
		obj.getElementsByAttribute("value", "unescape")[0].disabled = node.getAttribute("readonly") == "true";
*/
		var nodes = obj.getElementsByAttribute("coomanPlus", "true");
		for(var i = 0; i < nodes.length; i++)
		{
			nodes[i].hidden = node.getAttribute("readonly") == "true";
		}

	},

	contextExec: function(e)
	{
		var node = document.popupNode;

		var text = node.value,
				start = node.selectionStart == node.selectionEnd ? 0 : node.selectionStart,
				end = node.selectionStart == node.selectionEnd ? text.length : node.selectionEnd,
				part = text.slice(start, end);
		switch(e.target.value)
		{
			case "escapeSimple":
					part = this._escape(part, 11);
				break;
			case "unescapeSimple":
					part = this._unescape(part, 11);
				break;
			case "escape":
					part = escape(part);
				break;
			case "escape":
					part = unescape(part);
				break;
			case "encodeURI":
					part = encodeURI(part);
				break;
			case "decodeURI":
					part = decodeURI(part);
				break;
			case "encodeURIComponent":
					part = encodeURIComponent(part);
				break;
			case "decodeURIComponent":
					part = decodeURIComponent(part);
				break;
			case "uppercase":
					part = part.toUpperCase();
				break;
			case "lowercase":
					part = part.toLowerCase();
				break;
			case "crc32":
					part = this.crc32(part);
				break;
			case "base64encode":
					part = this.Base64.encode(part);
				break;
			case "base64decode":
					part = this.Base64.decode(part);
				break;
			case "md2":
			case "md5":
			case "sha1":
			case "sha256":
			case "sha384":
			case "sha512":
					var data = this.strToArray(part);
					var ch = Cc["@mozilla.org/security/hash;1"]
										.createInstance(Ci.nsICryptoHash);
					ch.initWithString(e.target.value);
					ch.update(data, data.length);
					part = this.binToHex(ch.finish(false));
				break;
		}
		node.value = text.slice(0, start) + part + text.slice(end);
		node.selectionStart = start;
		node.selectionEnd = start + part.length;
		return true;
	},
};