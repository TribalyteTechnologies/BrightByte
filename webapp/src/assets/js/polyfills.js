function arrayFrom(arr, callbackFn, thisArg){
    var arNew = [],
        k = [], 
        i = 0;

    if(window.Set && arr instanceof Set)
    {
        arr.forEach(function(v){k.push(v)});
        arr = k
    }
    for(; i < arr.length; i++)
        arNew[i] = callbackFn
            ? callbackFn.call(thisArg, arr[i], i, arr)
            : arr[i];
    return arNew
}
Array.from = Array.from || arrayFrom; 