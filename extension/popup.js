// Account basic info
let refreshButton = document.getElementById("refreshButton");
let accountAddr = document.getElementById("AccountAddr");
let accountBalance = document.getElementById("AccountBalance");
let channelSummary = document.getElementById('ChannelSummary');
let channelInfos = document.getElementById("ChannelInfos");
// Operation home page
let createButton = document.getElementById("CreateButton");
let topupButton = document.getElementById("TopupButton");
let renewButton = document.getElementById("RenewButton");
let bearLossButton = document.getElementById("BearLossButton");
let retrievalPermissionButton = document.getElementById("RetrievalPermissionButton");
// Create option page
let createTargetAddrText = document.getElementById("CreateTargetAddrText");
let createTargetAddr = document.getElementById("CreateTargetAddr");
let createQueryOfferButton = document.getElementById("CreateQueryOfferButton");
let createQueryOfferInfo = document.getElementById("CreateQueryOfferInfo");
let createAmountText = document.getElementById("CreateAmountText");
let createAmount = document.getElementById("CreateAmount");
let createConfirmButton = document.getElementById("CreateConfirmButton");
// Topup page
let topupTargetAddrText = document.getElementById("TopupTargetAddrText");
let topupTargetAddr = document.getElementById("TopupTargetAddr");
let topupAmountText = document.getElementById("TopupAmountText");
let topupAmount = document.getElementById("TopupAmount");
let topupConfirmButton = document.getElementById("TopupConfirmButton");
// Renew page
let renewTargetAddrText = document.getElementById("RenewTargetAddrText");
let renewTargetAddr = document.getElementById("RenewTargetAddr");
let renewConfirmButton = document.getElementById("RenewConfirmButton");
// Bear loss page
let bearLossTargetAddrText = document.getElementById("BearLossTargetAddrText");
let bearLossTargetAddr = document.getElementById("BearLossTargetAddr");
let bearLossConfirmButton = document.getElementById("BearLossConfirmButtion");
// Permission page
let currentPermissionInfo = document.getElementById("CurrentPermissionInfo");
let permissionAllowButton = document.getElementById("AllowButton");
let permissionDisallowButton = document.getElementById("DisallowButton");
// Back button
let backButton = document.getElementById("BackButton");
// Logging
let log = document.getElementById("Log");

// Logging logic
function print(output) {
    log.innerHTML = output;
}

// Account basic info logic.
function disableButtons() {
    refreshButton.disabled = true;
    createButton.disabled = true;
    topupButton.disabled = true;
    renewButton.disabled = true;
    bearLossButton.disabled = true;
    retrievalPermissionButton.disabled = true;
}

function enabledButtons() {
    refreshButton.disabled = false;
    createButton.disabled = false;
    topupButton.disabled = false;
    renewButton.disabled = false;
    bearLossButton.disabled = false;
    retrievalPermissionButton.disabled = false;
}

const refresh = async function() {
    disableButtons();
    print("Refreshing...");
    let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
    try {
        let req = fetch(api+"/fcr");
        let resp = await (await req).text();
        if (resp != "OK") {
            print("Fail to connect to FCR Web API.");
        } else {
            // Get retrieval access.
            req = fetch(api+"/fcr/access");
            resp = await (await req).text();
            if (resp.includes("Allowed")) {
                // Allowed.
                chrome.storage.local.set({ "access":  true });
            } else {
                // Not allowed.
                chrome.storage.local.set({ "access":  false });
            }
            // Load account.
            req = fetch(api+"/fcr/wallet");
            resp = await (await req).text();
            if (resp.includes("Fail")) {
                print(resp);
            } else {
                accountAddr.innerHTML = resp.split(":")[0]
                accountBalance.innerHTML = resp.split(":")[1]
                // Load channels.
                req = fetch(api+"/fcr/channel");
                resp = await (await req).text();
                if (resp.includes("Fail")) {
                    print(resp);
                } else {
                    let totalRedeemed = 0;
                    let totalBalance = 0;
                    let totalLoss = 0;
                    let chmap = new Map();
                    let peers = resp.split(";");
                    channelInfos.innerHTML = "";
                    for (let i = 0; i < peers.length; i++) {
                        let channels = peers[i].split("#");
                        channelInfos.innerHTML += "Recipient: " + channels[0] + ":<br />";
                        for (let j = 1; j < channels.length; j++) {
                            let infos = channels[j].split(",")
                            channelInfos.innerHTML += "&nbsp&nbsp&nbsp Ch" + j + ": " + infos[0] + "<br />";
                            chmap.set(infos[0], channels[0]);
                            channelInfos.innerHTML += "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Balance: " + infos[1] + "<br />";
                            totalBalance += Number(infos[1]);
                            channelInfos.innerHTML += "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Redeemed: " + infos[2] + "<br />";
                            totalRedeemed += Number(infos[2]);
                            channelInfos.innerHTML += "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Loss: " + infos[3] + "<br />";
                            if (infos[3] != "(0)") {
                                totalLoss += 1;
                            }
                            let settlement = infos[4].replace("/", " ").split("/")[0].split(".")[0] + " " + infos[4].replace("/", " ").split("/")[2];
                            channelInfos.innerHTML += "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Settlement: " + settlement + "<br />";
                        }
                    }
                    channelSummary.innerHTML = "Used/Available(Loss): " + totalRedeemed + "/" + totalBalance + "(" + totalLoss +")";
                    await chrome.storage.local.set({ "chmap": [...chmap] });
                    print("Refresh succeed.");
                }
            }
        }
    } catch (err) {
        print(err);
    }
    enabledButtons();
}

refreshButton.addEventListener("click", async() => {
    refresh();
})

// Home page logic.
const homepage = async function() {
    createButton.style.display = "";
    topupButton.style.display = "";
    renewButton.style.display = "";
    bearLossButton.style.display = "";
    retrievalPermissionButton.style.display = "";
    createTargetAddrText.style.display = "none";
    createTargetAddr.style.display = "none";
    createTargetAddr.innerHTML = "none";
    createQueryOfferButton.style.display = "none";
    createQueryOfferInfo.style.display = "none";
    createAmountText.style.display = "none";
    createAmount.style.display = "none";
    createConfirmButton.style.display = "none";
    topupTargetAddrText.style.display = "none";
    topupTargetAddr.style.display = "none";
    topupAmountText.style.display = "none";
    topupAmount.style.display = "none";
    topupConfirmButton.style.display = "none";
    renewTargetAddrText.style.display = "none";
    renewTargetAddr.style.display = "none";
    renewConfirmButton.style.display = "none";
    bearLossTargetAddrText.style.display = "none";
    bearLossTargetAddr.style.display = "none";
    bearLossConfirmButton.style.display = "none";
    currentPermissionInfo.style.display = "none";
    permissionAllowButton.style.display = "none";
    permissionDisallowButton.style.display = "none";
    backButton.style.display = "none";
}

// Create button logic.
let offerData;

const createPage1 = async function() {
    createButton.style.display = "none";
    topupButton.style.display = "none";
    renewButton.style.display = "none";
    bearLossButton.style.display = "none";
    retrievalPermissionButton.style.display = "none";
    createTargetAddrText.style.display = "";
    createTargetAddr.value = "";
    createTargetAddr.style.display = "";
    createQueryOfferButton.style.display = "";
    createQueryOfferInfo.style.display = "";
    createQueryOfferInfo.innerHTML = "Awaiting query offer...";
    createAmountText.style.display = "none";
    createAmount.style.display = "none";
    createConfirmButton.style.display = "none";
    backButton.style.display = "";
    backButton.disabled = false;
    createQueryOfferButton.disabled = false;
    createConfirmButton.disabled = false;
}

createButton.addEventListener("click", async() => {
    createPage1();
})

const createPage2 = async function() {
    createTargetAddrText.style.display = "none";
    createTargetAddr.style.display = "none";
    createQueryOfferButton.style.display = "none";
    createAmountText.style.display = "";
    createAmount.value = "";
    createAmount.style.display = "";
    createConfirmButton.style.display = "";
    createQueryOfferInfo.innerHTML = "Received offer with settlement: " + offerData.split("#")[0].split('.')[0].replace("/", " ");
}

createQueryOfferButton.addEventListener("click", async() => {
    createQueryOfferButton.disabled = true;
    backButton.disabled = true;
    if (createTargetAddr.value != "") {
        let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
        try {
            let req = fetch(api+"/fcr/query?" + new URLSearchParams({
                target: createTargetAddr.value
            }));
            let resp = await (await req).text();
            if (resp.includes("Fail")) {
                print(resp);
            } else {
                offerData = resp.trim();
                createQueryOfferButton.disabled = false;
                createPage2();
            }
        } catch (err) {
            print(err);
        }
    }
    createQueryOfferButton.disabled = false;
    backButton.disabled = false;
})

createConfirmButton.addEventListener("click", async() => {
    createConfirmButton.disabled = true;
    backButton.disabled = true;
    if (createAmount.value != 0) {
        let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
        try {
            let req = fetch(api+"/fcr/create?" + new URLSearchParams({
                offer: offerData.split('#')[1],
                amt: createAmount.value
            }));
            let resp = await (await req).text();
            print(resp);
        } catch (err) {
            print(err);
        }
    }
    createConfirmButton.disabled = false;
    backButton.disabled = false;
})

// Topup button logic.
const topupPage = async function() {
    createButton.style.display = "none";
    topupButton.style.display = "none";
    renewButton.style.display = "none";
    bearLossButton.style.display = "none";
    retrievalPermissionButton.style.display = "none";
    topupTargetAddrText.style.display = "";
    topupTargetAddr.value = "";
    topupTargetAddr.style.display = "";
    topupAmountText.style.display = "";
    topupAmount.value = "";
    topupAmount.style.display = "";
    topupConfirmButton.style.display = "";
    backButton.style.display = "";
    backButton.disabled = false;
    topupConfirmButton.disabled = false;
}

topupButton.addEventListener("click", async() => {
    topupPage();
})

topupConfirmButton.addEventListener("click", async() => {
    topupConfirmButton.disabled = true;
    backButton.disabled = true;
    if (topupAmount.value != 0 && topupTargetAddr.value != "") {
        let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
        try {
            // Get peer address
            let saved = (await chrome.storage.local.get("chmap")).chmap;
            let chmap = new Map(saved);
            if (chmap.has(topupTargetAddr.value)) {
                let peerAddr = chmap.get(topupTargetAddr.value);
                let req = fetch(api+"/fcr/topup?" + new URLSearchParams({
                    peerAddr: peerAddr,
                    chAddr: topupTargetAddr.value,
                    amt: topupAmount.value
                }))
                let resp = await (await req).text();
                print(resp);
            } else {
                print("Fail to find " + topupTargetAddr.value + ", try refresh.")
            }
        } catch (err) {
            print(err);
        }
    }
    topupConfirmButton.disabled = false;
    backButton.disabled = false;
})

// Renew channel logic.
const renewPage = async function() {
    createButton.style.display = "none";
    topupButton.style.display = "none";
    renewButton.style.display = "none";
    bearLossButton.style.display = "none";
    retrievalPermissionButton.style.display = "none";
    renewTargetAddrText.style.display = "";
    renewTargetAddr.value = "";
    renewTargetAddr.style.display = "";
    renewConfirmButton.style.display = "";
    backButton.style.display = "";
    backButton.disabled = false;
    renewConfirmButton.disabled = false;
}

renewButton.addEventListener("click", async() => {
    renewPage();
})

renewConfirmButton.addEventListener("click", async() => {
    renewConfirmButton.disable = true;
    backButton.disabled = true;
    if (renewTargetAddr.value != "") {
        let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
        try {
            // Get peer address
            let saved = (await chrome.storage.local.get("chmap")).chmap;
            let chmap = new Map(saved);
            if (chmap.has(renewTargetAddr.value)) {
                let peerAddr = chmap.get(renewTargetAddr.value);
                let req = fetch(api+"/fcr/renew?" + new URLSearchParams({
                    peerAddr: peerAddr,
                    chAddr: renewTargetAddr.value
                }))
                let resp = await (await req).text();
                print(resp);
            } else {
                print("Fail to find " + renewTargetAddr.value + ", try refresh.")
            }
        } catch (err) {
            print(err);
        }
    }
    renewConfirmButton.disable = false;
    backButton.disabled = false;
})

// Bear network loss logic.
const bearPage = async function() {
    createButton.style.display = "none";
    topupButton.style.display = "none";
    renewButton.style.display = "none";
    bearLossButton.style.display = "none";
    retrievalPermissionButton.style.display = "none";
    bearLossTargetAddrText.style.display = "";
    bearLossTargetAddr.value = "";
    bearLossTargetAddr.style.display = "";
    bearLossConfirmButton.style.display = "";
    backButton.style.display = "";
    backButton.disabled = false;
    bearLossConfirmButton.disabled = false;
}

bearLossButton.addEventListener("click", async() => {
    bearPage();
})

bearLossConfirmButton.addEventListener("click", async() => {
    bearLossConfirmButton.disable = true;
    backButton.disabled = true;
    if (bearLossTargetAddr.value != "") {
        let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
        try {
            // Get peer address
            let saved = (await chrome.storage.local.get("chmap")).chmap;
            let chmap = new Map(saved);
            if (chmap.has(bearLossTargetAddr.value)) {
                let peerAddr = chmap.get(bearLossTargetAddr.value);
                let req = fetch(api+"/fcr/bear?" + new URLSearchParams({
                    peerAddr: peerAddr,
                    chAddr: bearLossTargetAddr.value
                }))
                let resp = await (await req).text();
                print(resp);
            } else {
                print("Fail to find " + bearLossTargetAddr.value + ", try refresh.")
            }
        } catch (err) {
            print(err);
        }
    }
    bearLossConfirmButton.disable = false;
    backButton.disabled = false;
})

// Retrieval permission logic.
const retrievalPage = async function() {
    createButton.style.display = "none";
    topupButton.style.display = "none";
    renewButton.style.display = "none";
    bearLossButton.style.display = "none";
    retrievalPermissionButton.style.display = "none";
    currentPermissionInfo.style.display = "";
    currentPermissionInfo.innerHTML = "Fetching current permission..."
    backButton.style.display = "";
    backButton.disabled = false;
    permissionAllowButton.style.display = "";
    permissionDisallowButton.style.display = "";
    permissionAllowButton.disabled = true;
    permissionDisallowButton.disabled = true;
    let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
    try {
        let req = fetch(api+"/fcr/access")
        let resp = await (await req).text();
        if (resp.includes("Allowed")) {
            currentPermissionInfo.innerHTML = "Currently allowed."
            permissionDisallowButton.disabled = false;
        } else if (resp.includes("Denied")) {
            currentPermissionInfo.innerHTML = "Currently disallowed."
            permissionAllowButton.disabled = false;
        } else {
            currentPermissionInfo.innerHTML = "Fetching current permission...unknown state."
        }
    } catch (err) {
        currentPermissionInfo.innerHTML = "Fetching current permission...failed."
        print(err);
    }
}

retrievalPermissionButton.addEventListener("click", async() => {
    retrievalPage();
})

permissionAllowButton.addEventListener("click", async() => {
    permissionAllowButton.disabled = true;
    permissionDisallowButton.disabled = true;
    backButton.disabled = true;
    let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
    try {
        let req = fetch(api+"/fcr/toggle-access")
        await (await req).text();
        retrievalPage();
    } catch (err) {
        print(err);
    }
    backButton.disabled = false;
})

permissionDisallowButton.addEventListener("click", async() => {
    permissionAllowButton.disabled = true;
    permissionDisallowButton.disabled = true;
    backButton.disabled = true;
    let api = "http://localhost:" + (await chrome.storage.local.get("api")).api;
    try {
        let req = fetch(api+"/fcr/toggle-access")
        await (await req).text();
        retrievalPage();
    } catch (err) {
        print(err);
    }
    backButton.disabled = false;
})

// Back button logic
backButton.addEventListener("click", async() => {
    homepage();
})

// Entry point.
homepage();
refresh();