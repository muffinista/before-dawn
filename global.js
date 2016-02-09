/**
 * parse any incoming URL parameters and put them into their own
 * variable. depending on how/when you need to access these variables,
 * there's a good chance that you are better off doing it yourself.
 */
window.urlParams = window.location.search.split(/[?&]/).slice(1).map(function(paramPair) {
    return paramPair.split(/=(.+)?/).slice(0, 2);
}).reduce(function (obj, pairArray) {            
    obj[pairArray[0]] = pairArray[1];
    return obj;
}, {});


