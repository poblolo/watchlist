// ==UserScript==
// @name         Ticket Watchlist Test
// @namespace    http://tampermonkey.net/
// @version      1.1.9
// @description  Simple test script for OrangeMonkey
// @author       You
// @include      *
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

console.log('=== SCRIPT STARTING ===');
alert('SCRIPT IS LOADING!');

// Simple test function
function testFunction() {
    console.log('Test function called');
    alert('Test function works!');
}

// Try to run immediately
testFunction();

// Also try after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testFunction);
} else {
    testFunction();
}

// And with a timeout
setTimeout(testFunction, 1000);

console.log('=== SCRIPT FINISHED LOADING ===');
