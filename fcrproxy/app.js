const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { execSync } = require('child_process');
const { exit } = require('process');

// Use supplied or default fcr executable.
let fcr = "../network/binary/fcr -a ../network/fcr-user/token";
if (process.env.FCR_EXEC != undefined) {
    fcr = process.env.FCR_EXEC;
}
// Use supplied or default data dir.
let dir = "./tempdir";
if (process.env.DATA_DIR != undefined) {
    dir = process.env.DATA_DIR;
}
console.log("Using:", fcr);
console.log("Data dir:", dir);
// Try test FCR executable and create adapter folder
try {
    let out = execSync(fcr);
    console.log("Succeed loading fcr with version:", out.toString().split("\n")[7].replace(/\s/g, ''));
} catch (err) {
    console.log("Fail to get FCR version, use correct executable");
    exit(1);
}
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

function getAccountDetail() {
    try {
        let out = execSync(fcr + " wallet get 1").toString();
        if (out.includes("Type 1")) {
            let acct = out.split(" ")[0]
            let bal = out.split(" ")[3].split("\n")[0]
            return acct + ":" + bal
        }
        return "Fail to load account details";
    } catch (err) {
        return "Fail to load account details";
    }
}

function getChannelDetails() {
    try {
        let out = execSync(fcr + " paynet paych active-out list -l").toString();
        if (out.includes("Done")) {
            let elements = out.split("\n");
            if (elements[0] != "Currency 1") {
                return "";
            }
            let res = "";
            for (i = 1; i < elements.length; i++) {
                let element = elements[i].replace(/\t/g, '');
                if (element.includes("Done") || element.includes("Currency")) {
                    break;
                }
                if (element.includes("Peer")) {
                    if (res == "") {
                        res += element.split(" ")[1];
                    } else {
                        res += ";" + element.split(" ")[1];
                    }
                } else if (!element.includes("Balance")) {
                    res += "#" + element.split(":")[0];
                } else {
                    let state = element.split(" ");
                    let settlement = element.split("Settlement ")[1].split(", Last updated")[0].replace(/\s/g, '/');
                    res += "," + state[1] + state[3] + state[12] + settlement;
                }
            }
            return res;
        }
        return "Fail to load channel details";
    } catch (err) {
        return "Fail to load channel details";
    }
}

function queryPaychOffer(target) {
    try {
        let out = execSync(fcr + " paynet paych query 1 " + target).toString();
        if (out.includes("Paych offer:")) {
            let settlement = out.split("settlement ")[1].split("\n")[0].replace(/\s/g, '/');
            let offerData = out.split("offer data: ")[1];
            return settlement+"#"+offerData;
        }
        return "Fail to query paych offer";
    } catch (err) {
        return "Fail to query paych offer";
    }
}

function createPaych(offer, amt) {
    try {
        let out = execSync(fcr + " paynet paych create " + offer + " " + amt).toString();
        if (out.includes("Succeed")) {
            return "Succeed: " + out.split("\n")[1]
        }
        return "Fail to create paych";
    } catch (err) {
        return "Fail to create paych";
    }
}

function topupPaych(peerAddr, chAddr, amt) {
    try {
        let out = execSync(fcr + " paynet paych topup 1 " + peerAddr + " " + chAddr + " " + amt).toString();
        if (out.includes("Succeed")) {
            return "Succeed";
        }
        return "Fail to topup paych";
    } catch (err) {
        return "Fail to topup paych";
    }
}

function renewPaych(peerAddr, chAddr) {
    try {
        let out = execSync(fcr + " paynet paych renew 1 " + peerAddr + " " + chAddr).toString();
        if (out.includes("Succeed")) {
            return "Succeed";
        }
        return "Fail to renew paych";
    } catch (err) {
        return "Fail to renew paych";
    }
}

function bearNetworkLoss(peerAddr, chAddr) {
    try {
        let out = execSync(fcr + " paynet paych active-out bear 1 " + peerAddr + " " + chAddr).toString();
        if (out.includes("Succeed")) {
            return "Succeed";
        }
        return "Fail to bear network loss";
    } catch (err) {
        return "Fail to bear network loss";
    }
}

function fastRetrieval(cid) {
    if (cid == "") {
        return "Fail to fast retrieve, empty path";
    }
    // Retry at maximum 5 times, 3 seconds apart.
    for (let i = 0; i < 5; i++) {
        try {
            execSync(fcr + " fast-retrieve " + cid + " " + dir + " 1 10000000000", {timeout: 3000});    // Use 10^10 as maximum, that is equivalent to ~1G limit if ppb=1.
            if (fs.existsSync(path.join(dir, cid))) {
                return "Succeed";
            }
        } catch (err) {
        }
        console.log("retry...");
    }
    return "Fail to fast retrieve";
}

// Variable indicating whether retrieval access is allowed.
let retrievalAccess = true;

// Start the APP.
const app = express();
app.use(cors());

app.get('/fcr', (req, res) => {
    res.send('OK');
});
app.get('/fcr/wallet', (req, res) => {
    res.send(getAccountDetail());
});
app.get('/fcr/channel', (req, res) => {
    res.send(getChannelDetails());
});
app.get('/fcr/query', (req, res) => {
    res.send(queryPaychOffer(req.query.target));
});
app.get('/fcr/create', (req, res) => {
    res.send(createPaych(req.query.offer, req.query.amt));
});
app.get('/fcr/topup', (req, res) => {
    res.send(topupPaych(req.query.peerAddr, req.query.chAddr, req.query.amt));
});
app.get('/fcr/renew', (req, res) => {
    res.send(renewPaych(req.query.peerAddr, req.query.chAddr));
});
app.get('/fcr/bear', (req, res) => {
    res.send(bearNetworkLoss(req.query.peerAddr, req.query.chAddr));
});
app.get('/fcr/ret/:cid', (req, res) => {
    if (!retrievalAccess) {
        res.sendStatus(403);
        return;
    }
    // Allow, try to retrieve to temp dir
    let result = fastRetrieval(req.params.cid)
    if (!result.includes("Fail")) {
        res.sendStatus(404);
        return;
    }
    res.sendFile(path.join(dir, req.params.cid))
    try {
        // Remove file after fetch.
        fs.unlinkSync(path.join(dir, req.params.cid));
    } catch (err) {
        console.log(err);
    }
})
app.get("/fcr/ret-video/:cid", (req, res) => {
    try {
        if (!retrievalAccess) {
            res.sendStatus(403);
            return;
        }
        // Allow, try to retrieve metadata to temp dir
        let result = fastRetrieval(req.params.cid);
        if (result.includes("Fail")) {
            res.sendStatus(404);
            return;
        }
        let stat = JSON.parse(fs.readFileSync(path.join(dir, req.params.cid)));
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            // Now check which chunk does this start lie.
            let chunkId = Math.floor(start/stat.chunk);
            // Get cid.
            let children = new Map(Object.entries(stat.children));
            const cid = children.get(chunkId.toString());
            // Now try to retireve the cid.
            process.stdout.write(`Start retrieving ${cid}...`);
            result = fastRetrieval(cid);
            if (result.includes("Fail")) {
                console.log("failed.")
                res.sendStatus(404);
                return
            }
            let chunkState = fs.statSync(path.join(dir, cid));
            let end = chunkId * stat.chunk + chunkState.size - 1;
            let fStart = start - chunkId * stat.chunk;
            let fEnd = end - chunkId * stat.chunk;
            const file = fs.createReadStream(path.join(dir, cid), {start: fStart, end: fEnd});
            const head = {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': (end-start)+1,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
            file.on('close', () => {
                fs.unlinkSync(path.join(dir, cid));
            })
            fs.unlinkSync(path.join(dir, req.params.cid));
            console.log(`done.(${start}-${end}/${stat.size})`);
        } else {
            // Does not allow this operation.
            res.sendStatus(500);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})
app.get("/fcr/access", (req, res) => {
    if (retrievalAccess) {
        res.send("Allowed");
    } else {
        res.send("Denied");
    }
})
app.get("/fcr/toggle-access", (req, res) => {
    retrievalAccess = !retrievalAccess;
    res.send('OK');
})
app.listen(9559, () => {
    console.log('FCR Web API on port 9559!');
});
