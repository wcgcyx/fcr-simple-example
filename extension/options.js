let currentAPI = document.getElementById("CurrentAPI");
let newAPI = document.getElementById("NewAPI");
let updateButton = document.getElementById("UpdateButton");

updateButton.addEventListener("click", async() => {
  if (newAPI.value != 0) {
    await chrome.storage.local.set({ "api": newAPI.value });
    await start();
  }
})


const start = async function() {
  currentAPI.innerHTML = "http://localhost:" + (await chrome.storage.local.get("api")).api;
}
start();