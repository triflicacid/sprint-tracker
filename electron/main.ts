import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import {pathToFileURL} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev: boolean = process.env.NODE_ENV === "development";
const port: number = 4000;

// starts the bundled express server. in dev mode the server is expected
// to already be running separately via `npm run dev:server`.
async function startServer() {
    if (isDev) {
        return;
    }
    process.env.DB_PATH = path.join(__dirname, "..", "..", "data", "sprint-tracker.sqlite3");
    process.env.PORT = String(port);
    await import(pathToFileURL(path.join(__dirname, "..", "server", "index.js")).href);
}

function createWindow(): void {
    const window: BrowserWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
        },
    });

    const targetUrl: string = isDev ? "http://localhost:5173" : `http://localhost:${port}`;
    console.log("Attempting to load window", targetUrl)
    window.loadURL(targetUrl)
        .then(_ => console.log("Success"))
        .catch(e => console.error(e));
}

app.whenReady().then(async () => {
    await startServer();
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
