chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ "api": 9559 });
    chrome.storage.local.set({ "chmap":  [...new Map()] });
});
chrome.runtime.onMessageExternal.addListener(async function(request, sender, sendResponse) {
    if (request) {
        if(request.message) {
            if(request.message == "api") {
                let res = (await chrome.storage.local.get("api")).api;
                sendResponse({"api": res});
            }
        }
    }
})