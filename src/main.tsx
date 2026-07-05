import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/global.css";

const rootElement: HTMLElement = document.getElementById("root") as HTMLElement;

// hash routing is used so the same build works when loaded from a plain
// file path inside electron, not just from a server root.
ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <HashRouter future={{ v7_startTransition: true }}>
            <App />
        </HashRouter>
    </React.StrictMode>
);
