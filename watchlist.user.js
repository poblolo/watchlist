// ==UserScript==
// @name         Ticket Watchlist Test
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Simple test script for OrangeMonkey
// @author       You
// @include      *
// @grant        window.close
// @grant        window.focus
// @grant        window.onurlchange
// @grant        window.setTimeout
// @grant        window.setInterval
// @grant        window.clearTimeout
// @grant        window.clearInterval
// @grant        window.alert
// @grant        window.confirm
// @grant        window.prompt
// @grant        window.print
// @grant        window.focus
// @grant        window.blur
// @grant        window.close
// @grant        window.open
// @grant        window.stop
// @grant        window.frames
// @grant        window.length
// @grant        window.top
// @grant        window.parent
// @grant        window.opener
// @grant        window.frameElement
// @grant        window.navigator
// @grant        window.document
// @grant        window.location
// @grant        window.history
// @grant        window.localStorage
// @grant        window.sessionStorage
// @grant        window.indexedDB
// @grant        window.crypto
// @grant        window.console
// @run-at       document-start
// @unwrap
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
