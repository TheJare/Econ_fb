/*
(C) Copyright by Javier Arevalo in 2012.
		http://www.iguanademos.com/Jare/
		@TheJare on twitter
		https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

// LCG random number generator using GCC's constants
// See http://stackoverflow.com/a/424445

var LCG = function (seed) {
	this.state = seed ? seed : LCG.newSeed();
}

var LCG_m = 0x100000000; // 2**32;
var LCG_a = 1103515245;
var LCG_c = 12345;

LCG.newSeed = function() {
	return Math.floor(Math.random() * (LCG_m-1))
}

LCG.prototype.nextInt = function() {
	this.state = (LCG_a * this.state + LCG_c) % LCG_m;
	return this.state;
}

LCG.prototype.nextFloat = function() {
	// returns in range [0,1]
	return this.nextInt() / (LCG_m - 1);
}

LCG.prototype.nextRange = function(start, end) {
	// returns in range [start, end): including start, excluding end
	// can't modulu nextInt because of weak randomness in lower bits
	var rangeSize = end - start;
	var randomUnder1 = this.nextInt() / LCG_m;
	return start + Math.floor(randomUnder1 * rangeSize);
}

LCG.prototype.choice = function(array) {
	return array[this.nextRange(0, array.length)];
}

exports.LCG = LCG
