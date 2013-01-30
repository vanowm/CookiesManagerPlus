coomanPlus.dump = function _dump(aMessage, obj, param)
{
//	return;
/*
	parent = parent || aMessage;
	c = c || 0;
	tab = tab || 0;
*/
	param = param || [0, aMessage, 0]

	let showType = 1,
			sort = 1, //0 = none, 1 = case sensetive, 2 = case insensitive
			ret = ret || "",
			i,
			r = "",
			t2,
			t = typeof(aMessage),
			append = "",
			tText = "",
			t2Text = "",
			[tab, parent, c] = param;
	function _tab(tab)
	{
		return (new Array(tab)).join(" ");
	}
	if (showType)
		tText = " (" + t + ")";

	if (obj && t == "object" && aMessage !== null)
	{
		try
		{
			var array = new Array();
			for(i in aMessage)
				array.push(i);

			if (sort)
				if (sort == 2)
				{
					array.sort(function (a, b)
					{
						function chunkify(t)
						{
							var tz = [], x = 0, y = -1, n = 0, i, j;
				
							while ((i = (j = t.charAt(x++)).charCodeAt(0)))
							{
								var m = (i == 46 || (i >=48 && i <= 57));
								if (m !== n)
								{
									tz[++y] = "";
									n = m;
								}
								tz[y] += j;
							}
							return tz;
						}
				
						var aa = chunkify(a.toLowerCase()),
								bb = chunkify(b.toLowerCase()),
								x, c, d;
				
						for (x = 0; aa[x] && bb[x]; x++)
						{
							if (aa[x] !== bb[x])
							{
								c = Number(aa[x]), d = Number(bb[x]);
								if (c == aa[x] && d == bb[x])
								{
									return c - d;
								}
								else
									return (aa[x] > bb[x]) ? 1 : -1;
							}
						}
						return aa.length - bb.length;
					});
				}
				else
					array.sort();

			for(var ii = 0; ii < array.length; ii++)
			{
				i = array[ii];
				try
				{
					t2 = typeof(aMessage[i]);
				}
				catch(e)
				{
					t2 = "error";
				}
				if (showType)
					t2Text = " (" + t2 + ")";

				try
				{
					let text = aMessage[i];
					append = _tab(tab);
					try
					{
						text = text.toString();
						text = text.split("\n");
						for(var l = 1; l < text.length; l++)
							text[l] = append + text[l];

						text = text.join("\n");
					}
					catch(e){}
					r += append + i + t2Text + ": " + text;
				}
				catch(e)
				{
					r += append + i + t2Text + ": " + e;
				};
				if (t2 == "object" && aMessage[i] !== null && aMessage[i] != parent && c < obj)
				{
					r += "\n" + _tab(tab) + "{\n" + _dump(aMessage[i], obj, [tab + 5, parent, c+1]) + _tab(tab) + "}";
				}
				r += "\n"
			}
		}
		catch(e)
		{
			r += append + i + " (error): " + e + "\n"
		}
	}
	if (tab)
		return r;

	Components.classes["@mozilla.org/consoleservice;1"]
		.getService(Components.interfaces.nsIConsoleService)
		.logStringMessage("CM+" + tText + ":" + aMessage + (r ? "\n" + r : ""));
	return true;
}
