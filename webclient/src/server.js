const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/videos', (req, res) => {
    res.json(JSON.parse(fs.readFileSync("./src/assets/video_lists.json")));
});
app.get('/posters/:cid', (req, res) => {
    res.sendFile(`assets/posters/${req.params.cid}.png`, { root: __dirname });
})
app.listen(4000, () => {
    console.log('Listening on port 4000!');
});