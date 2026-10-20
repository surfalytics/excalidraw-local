import Cocoa
import WebKit

// Native window for the local Excalidraw build.
// Starts a static file server, shows the page in a WKWebView, stops the server on quit.

let port = 3456
// Where the repo lives. The app can sit in the repo root or in /Applications:
// 1. the folder next to the app bundle, 2. the path written by install-app.sh,
// 3. ~/dev/excalidraw.
let projectDir: String = {
    let fm = FileManager.default
    let hint = NSHomeDirectory() + "/Library/Application Support/Excalidraw/project-path"
    var candidates = [Bundle.main.bundleURL.deletingLastPathComponent().path]
    if let p = try? String(contentsOfFile: hint, encoding: .utf8) { candidates.append(p.trimmingCharacters(in: .whitespacesAndNewlines)) }
    candidates.append(NSHomeDirectory() + "/dev/excalidraw")
    return candidates.first { fm.fileExists(atPath: $0 + "/mcp_excalidraw/dist/server.js") } ?? candidates[0]
}()
let canvasServer = projectDir + "/mcp_excalidraw/dist/server.js"
let dataDir = projectDir + "/canvas-data"
let nodePath: String = {
    let candidates = ["/opt/homebrew/bin/node", "/usr/local/bin/node", "/usr/bin/node"]
    return candidates.first { FileManager.default.isExecutableFile(atPath: $0) } ?? "/usr/local/bin/node"
}()

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var server: Process?

    func applicationDidFinishLaunching(_ note: Notification) {
        startServerIfNeeded()
        buildMenu()

        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered, defer: false)
        window.title = "Excalidraw"
        window.minSize = NSSize(width: 600, height: 400)
        window.contentView = webView
        window.setFrameAutosaveName("ExcalidrawMain")
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        waitForServer(tries: 40)
        webView.load(URLRequest(url: URL(string: "http://127.0.0.1:\(port)/")!))
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func applicationWillTerminate(_ note: Notification) {
        server?.terminate()
    }

    // Open external links (docs, GitHub, etc.) in the default browser.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if action.shouldPerformDownload || action.request.url?.scheme == "blob" {
            decisionHandler(.download)
            return
        }
        if let url = action.request.url, let host = url.host, host != "127.0.0.1" {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, createWebViewWith config: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url { NSWorkspace.shared.open(url) }
        return nil
    }

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        decisionHandler(response.canShowMIMEType ? .allow : .download)
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }

    // Ask the user where to save the downloaded file.
    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                  suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = suggestedFilename
        panel.canCreateDirectories = true
        panel.beginSheetModal(for: window) { result in
            guard result == .OK, let url = panel.url else { completionHandler(nil); return }
            try? FileManager.default.removeItem(at: url)
            completionHandler(url)
        }
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        let alert = NSAlert()
        alert.messageText = "Save failed"
        alert.informativeText = error.localizedDescription
        alert.runModal()
    }

    // Needed for "Save as" / export dialogs.
    func webView(_ webView: WKWebView, runOpenPanelWith params: WKOpenPanelParameters,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = params.allowsMultipleSelection
        panel.canChooseDirectories = params.allowsDirectories
        panel.begin { completionHandler($0 == .OK ? panel.urls : nil) }
    }

    private func portIsOpen() -> Bool {
        let sock = socket(AF_INET, SOCK_STREAM, 0)
        defer { close(sock) }
        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = in_port_t(UInt16(port).bigEndian)
        addr.sin_addr.s_addr = inet_addr("127.0.0.1")
        let r = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { connect(sock, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) }
        }
        return r == 0
    }

    private func startServerIfNeeded() {
        if portIsOpen() { return }
        if !FileManager.default.fileExists(atPath: canvasServer) {
            let alert = NSAlert()
            alert.messageText = "Canvas server not built"
            alert.informativeText = "Missing \(canvasServer)\n\nRun ./setup.sh in the repo root, then open the app again."
            alert.runModal()
            NSApp.terminate(nil)
            return
        }
        // Live canvas server from mcp_excalidraw. Claude Code draws on it through MCP.
        let p = Process()
        p.executableURL = URL(fileURLWithPath: nodePath)
        p.arguments = [canvasServer]
        p.environment = ProcessInfo.processInfo.environment.merging([
            "PORT": "\(port)",
            "HOST": "127.0.0.1",
            "EXCALIDRAW_DATA_DIR": dataDir,
            "EXCALIDRAW_LIBS_DIR": projectDir + "/libs",
            "EXCALIDRAW_SCENES_DIR": projectDir + "/diagrams",
        ]) { $1 }
        p.currentDirectoryURL = URL(fileURLWithPath: NSHomeDirectory())
        p.standardOutput = FileHandle.nullDevice
        p.standardError = FileHandle.nullDevice
        try? p.run()
        server = p
    }

    private func waitForServer(tries: Int) {
        for _ in 0..<tries {
            if portIsOpen() { return }
            usleep(100_000)
        }
    }

    private func buildMenu() {
        let menubar = NSMenu()
        let appItem = NSMenuItem(); menubar.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Reload", action: #selector(reload), keyEquivalent: "r")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit Excalidraw", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let editItem = NSMenuItem(); menubar.addItem(editItem)
        let edit = NSMenu(title: "Edit")
        edit.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        edit.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
        edit.addItem(NSMenuItem.separator())
        edit.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit

        let winItem = NSMenuItem(); menubar.addItem(winItem)
        let win = NSMenu(title: "Window")
        win.addItem(withTitle: "Minimize", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
        win.addItem(withTitle: "Zoom", action: #selector(NSWindow.zoom(_:)), keyEquivalent: "")
        winItem.submenu = win
        NSApp.mainMenu = menubar
    }

    @objc func reload() { webView.reload() }
}

let app = NSApplication.shared
app.setActivationPolicy(.regular)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
