/*
(C) Copyright by Javier Arevalo in 2012.
    http://www.iguanademos.com/Jare/
    @TheJare on twitter
    https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

// Misc math and colors
function logobj(a) {console.log(JSON.stringify(a));}
function MakeColor(r,g,b) { return "rgb("+Math.floor(Clamp(r, 0, 255))+","+Math.floor(Clamp(g, 0, 255))+","+Math.floor(Clamp(b, 0, 255))+")"; }
function Pow2(v) { return v*v; }
function Lerp(a,b,t) { return a+(b-a)*t; }
function Clamp(v,a,b) { return Math.max(a,Math.min(v,b)); }
function Wrap(v,a,b) { return v<a? (v+(b-a)) : (v>b? (v-(b-a)) : v); }
function RandomInt(v) { return Math.floor(Math.random()*v); }
function RandomIntRange(a,b) { return Math.floor(Math.random()*(b-a)+a); }
function RandomFloat(v) { return Math.random()*v; }
function RandomFloatRange(a,b) { return Math.random()*(b-a)+a; }
function RandomColor(min, max) { return MakeColor(RandomIntRange(min, max), RandomIntRange(min, max), RandomIntRange(min, max)); }

// http://javascript.info/tutorial/coordinates#the-right-way-elem-getboundingclientrect
function getOffsetRect(elem) {
    // (1)
    var box = elem.getBoundingClientRect()
    
    var body = document.body
    var docElem = document.documentElement
    
    // (2)
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
    
    // (3)
    var clientTop = docElem.clientTop || body.clientTop || 0
    var clientLeft = docElem.clientLeft || body.clientLeft || 0
    
    // (4)
    var top  = box.top +  scrollTop - clientTop
    var left = box.left + scrollLeft - clientLeft
    var bottom = box.bottom +  scrollTop - clientTop
    var right = box.right + scrollLeft - clientLeft
    
    return { top: Math.round(top), left: Math.round(left), bottom: Math.round(bottom), right: Math.round(right), width: box.width, height: box.height,  }
}



PlayGame = function(server_url, facebook_user_id) {
	var ItemDefs = [
		['it0', { min:1, max:5, color:MakeColor(255,0,0) } ],
		['it1', { min:3, max:10, color:MakeColor(255,0,255) } ],
		['it2', { min:5, max:20, color:MakeColor(255,255,255) } ],
		['it3', { min:10, max:35, color:MakeColor(255,255,0) } ],
		['it4', { min:20, max:60, color:MakeColor(0,255,255) } ],
		['it5', { min:35, max:100, color:MakeColor(0,255,0) } ],
		['it6', { min:60, max:150, color:MakeColor(128,128,255) } ],
		['it7', { min:100, max:250, color:MakeColor(128,255,128) } ],
		['it8', { min:150, max:320, color:MakeColor(255,128,128) } ],
		['it9', { min:250, max:450, color:MakeColor(255,128,255) } ],
	];

	var Player = function() {
		this.money = 10;
		this.inventory = {};
	};
	Player.prototype.AddItem = function(market, i, n) {
		if (!this.inventory[i])
			this.inventory[i] = 0;
		var cost = market.exchange[i];
		var totalcost = cost*n;
		if (totalcost > 0) {
			if (totalcost <= this.money && this.inventory[i] < 10) {
				this.money -= totalcost;
				this.inventory[i] += n;
			}
		} else {
			if (this.inventory[i] >= -n) {
				this.money -= totalcost;
				this.inventory[i] += n;
			}
		}
	}

	var Market = function() {
		this.exchange = {};
		this.history = [];
		this.NewTrading();
	};
	Market.prototype.NewTrading = function() {
		this.exchange = {};
		for (var i in ItemDefs) {
			var it = ItemDefs[i][0];
			this.exchange[it] = RandomIntRange(ItemDefs[i][1].min, ItemDefs[i][1].max);
		}		
		this.history.push(this.exchange);
	}
	Market.prototype.NewDay = function() {
		if (this.history.length > 6) {
			this.history.shift();			
		}
		this.NewTrading();
	}

	var player = new Player();
	var market = new Market();
	var days = 1;

	var BuyItemEvent = function(i, v) {
		player.AddItem(market, i, v);
		setTimeout(DisplayUI, 1);
	}

	var DisplayUI = function() {
		var marketdiv = $("#market");
		var summarydiv = $("#summary");
		marketdiv.empty();
		summarydiv.empty();

		//var estimatedMoney = player.money + 
		
		var percents = [];
		for (var ii in ItemDefs) {
			var i = ItemDefs[ii][0];
			var itemDef = ItemDefs[ii][1];
			var pct = Math.floor((market.exchange[i] - itemDef.min) * 100 / (itemDef.max-itemDef.min));
			var d = $('<div class="itemmarketline" style="color:' + itemDef.color + '">'
				+ '<span class="itemmarketnum">' + pct + '%</span>'
				+ '<span class="itemmarketnum">' + market.exchange[i] + '</span>'
				+ '<span class="itemmarketnum">(' + (player.inventory[i] || 0) + ')</span>'
				+ '<span id="add" class="button itemmarketbtn">+</span><span id="sub" class="button itemmarketbtn">-</span>'
				+ '</div>');
			var dadd = $("#add", d);
			var dsub = $("#sub", d);
			// Function to make a closure bound to the current value of loop variable
			var MakeBuyHandler = function(i, n) { return function() {BuyItemEvent(i, n);};}
			dadd.click( MakeBuyHandler(i, 1) );
			dsub.click( MakeBuyHandler(i,-1) );
			marketdiv.append(d);

			var hist = [];
			for (var j = 0; j < market.history.length; ++j) {
				var val = market.history[j][i];
				var valpct = (val - itemDef.min) * 100 / (itemDef.max-itemDef.min);
				hist.push([j, valpct]);
			}
			percents.push( { color: itemDef.color, data: hist });
		}
		var d = '<div><p> Money: ' + player.money + ' - days: ' + days + '</p></div>';
		summarydiv.append(d);

		$.plot($("#marketgraph"), percents, { 
			series: { lines: { show: true }, points: { show: true } },
			xaxis: {min:0, max:6},
			yaxis: {min:0, max:100}
		});
	}

	var NextDay = function() {
		++days;

		$.ajax({
			url: server_url+'/'+facebook_user_id+'/NextDay',
			dataType: 'text',
			type: 'POST',
			data: {},
			success: function(data, textStatus, jqXHR) {
				logobj(data);
			}
		});

		market.NewDay();
		DisplayUI();
	}

	// Hook controls, display the game and start!
	$("#nextday").click(NextDay);
	DisplayUI();

};

