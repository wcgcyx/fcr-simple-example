/*global chrome*/
import React, { Component } from 'react'
import Header from './Header';
import Footer from './Footer';
import { fcrExtensionID } from './Config';

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


export default class Player extends Component {
    constructor(props) {
        super(props);
        this.state = {
            videoId: this.props.match.params.id,
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
        } catch (error) {
            console.log(error);
        }
        await new Promise(t => setTimeout(t, 100));
        this.setState({ isLoading: false });
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
        return (
            <div className="App">
                <Header />
                <header className="App-header">
                    <video controls autoPlay>
                        <source src={`${localFCRProxy}/fcr/ret-video/${this.state.videoId}`} type="video/mp4"></source>
                    </video>
                </header>
                <Footer />
            </div>
        )
    }
}