# FCR simple example
### Introduction
This repository shows a simple example for a web page that builds on top of [FCR](https://github.com/wcgcyx/fcr). This example is a simple video sharing website that allows people who runs FCR client to stream videos. However, unlike other video sharing website, the videos are not hosted by the website's server. Instead, segments of the videos are retrieved from the retrieval providers in the FCR network.

Follow the instructions below, you will be setting up a local FCR network of 5 nodes (2 retrieval providers, 2 payment providers and 1 client) that is used for data retrieval, a web server that hosts only the video IDs and a simple chrome extension that interacts with FCR client.
### Notice
Please be noticed that this repository is self-contained: The binary of FCR is attached as part of the repo. To obtain the latest version of FCR, check https://github.com/wcgcyx/fcr. Also, this binary may only work on M1 Mac. If you encounter any issues, try to build from source and replace the binary here.

Also, I am NOT a front-end developer so a lot of example code may not make sense to you. You should never use any of the example code into production.
### Repo structure
`/extension` contains the code for a simple chrome extension.

`/fcrproxy` contains a simple proxy server that does API proxy for the extension to FCR.

`/network` contains the binary, configurations and scripts to run a local FCR network.

`/vidgen` contains a tool to transform videos to streamable segments.

`/webclient` contains the code for the video sharing website.
### Instructions
#### 1. Setup local FCR network
Ideally you will need to open a lot of terminals so you can clearly see the behaviour of every node with different roles. Open 6 terminals and `cd network`. (If you have run the demo previously and you wish to clean, run `./clean.sh`)

In terminal 1, start the mock FIL chain:
```
./binary/mc
```
In terminal 2, start provider 1:
```
./binary/fcr daemon -c ./config_provider1.yaml
```
In terminal 3, start provider 2:
```
./binary/fcr daemon -c ./config_provider2.yaml
```
In terminal 4, start payment broker 1:
```
./binary/fcr daemon -c ./config_broker1.yaml
```
In terminal 5, start payment broker 2:
```
./binary/fcr daemon -c ./config_broker2.yaml
```
In terminal 6, start retrieval client:
```
./binary/fcr daemon -c ./config_user.yaml
```
Open another terminal:
```
./setup.sh
```
This script sets up the network by 1. initialising private keys for each node. 2. Connecting nodes. 3. Creating payment channels between nodes.

Then, to import sample videos into the two retrieval providers (Source: [sample1](https://www.youtube.com/watch?v=l8bD3IpNll8), [sample2](https://www.youtube.com/watch?v=-kUyorDlEmo), [sample3](https://www.youtube.com/watch?v=oe70Uhjc_F4)):
```
./import.sh ../vidgen/sample-0/*
./import.sh ../vidgen/sample-1/*
./import.sh ../vidgen/sample-2/*
```
Note: The importing could take a while, please wait until it succeed.

In the end, you will get a local network that is similar to below, where each arrow represents a payment channel:

![alt text](docs/network.jpg)

### 2. Run web server
```
cd ./webclient
npm install
npm run serve
```
This will launch a web server hosts video (only IDs).

### 3. Install chrome extension
```
cd ./fcrproxy
npm install
npm run serve
```
This starts a small proxy server that proxy requests from extension to FCR. There should be a way to interact directly between the extension and FCR through its API. However, this is just an simple example only, so I didn't spend time on this.
Load the unpacked extension under `/extension`. If you don't know how to do this, check [here](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked).
After the extension is installed, you should see something like this:

![alt text](docs/extension.jpg)

Meanwhile, the overall system looks like this (FCR Proxy not included as it should be part of the extension):

![alt text](docs/system.jpg)

## Demo
Now you can visit http://localhost:3000/ to stream videos. 

![alt text](docs/web.jpg)

You can check the output of user terminal and the FCR proxy server to see things that are happening in the background. Try restart one of the providers or one of the brokers during the middle of a retrieval: You will see that FCR will atomatically switch to retrieve from the other provider or using the other broker as FCR loads data by content addressing, just like IPFS. If you are not familiar with content addressing, check [here](https://docs.ipfs.io/concepts/content-addressing/).

## Upload your own video
You can try to upload your own video. Check folder `webclient/src/assets` and the tool:
```
cd vidgen;
./vidgen --help
```

## Disclaimer
The purpose of this repository is just to demonstrate a simple use case of FCR. You should not use the code for any production work. Check https://github.com/wcgcyx/fcr to obtain the latest version of FCR.

## Contributor
Zhenyang Shi - wcgcyx@gmail.com