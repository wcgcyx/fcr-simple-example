/*global chrome*/
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { fcrExtensionID, serverAddr } from './Config';

// Check if browser is supported.
let isChromium = window.chrome;
let winNav = window.navigator;
let vendorName = winNav.vendor;
let isOpera = typeof window.opr !== "undefined";
let isIEedge = winNav.userAgent.indexOf("Edg") > -1;
let isIOSChrome = winNav.userAgent.match("CriOS");
let supported = false;
let installed = false;
let localFCRProxy = "";
if (isIOSChrome) {
    // is Google Chrome on IOS
} else if(
isChromium !== null &&
typeof isChromium !== "undefined" &&
vendorName === "Google Inc." &&
isOpera === false &&
isIEedge === false
) {
// is Google Chrome
supported = true;
} else { 
// not Google Chrome 
}


export default class Home extends Component {
    constructor() {
        super();
        this.state = {
            videos: [],
            isLoading: true
        };
    }
    async componentDidMount() {
        try {
            // First try to communicate with extension.
            if (supported) {
                await chrome.runtime.sendMessage(fcrExtensionID, {message: "api"}, function (reply) {
                    if (reply) {
                        if (reply.api) {
                            installed = true;
                            localFCRProxy = "http://localhost:" + reply.api;
                        }
                    }
                })
            }
            // Second try to fetch videos.
            const response = await fetch("http://" + serverAddr + "/videos");
            const data = await response.json();
            this.setState({ videos: [...data] });
        } catch (error) {
            console.log(error);
        }
        await new Promise(t => setTimeout(t, 100));
        this.setState({isLoading: false});
    }
    render() {
        if (this.state.isLoading) {
            return (
                <div className="App App-header">
                    <Header />
                    <div className="container">
                        <div className="row">
                            <h4 className="card-title">Loading...</h4>
                        </div>
                    </div>
                    <Footer />
                </div>
            )
        }
        if (!supported) {
            return (
                <div className="App App-header">
                    <Header />
                    <div className="container">
                        <div className="row">
                            <h4 className="card-title">Only Chrome is supported!</h4>
                        </div>
                    </div>
                    <Footer />
                </div>
            )
        }
        if (!installed) {
            return (
                <div className="App App-header">
                    <Header />
                    <div className="container">
                        <div className="row">
                            <h4 className="card-title">FCR extension not found!</h4>
                        </div>
                    </div>
                    <Footer />
                </div>
            )
        }
        return (
            <div className="App App-header">
                <Header />
                <div className="container">
                    <div className="row">
                        {this.state.videos.map(video =>
                        <div className="col-md-4" key={video.cid}>
                            <Link to={`/player/${video.cid}`}>
                                <div className="card border-0">
                                    <img src={"http://" + serverAddr + "/posters/" + video.cid}alt={video.name} />
                                    <div className="card-body">
                                        <p>{video.name}</p>
                                        <p>{video.duration}</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        )}
                    </div>
                </div>
                <Footer />
            </div>
        )
    }
}