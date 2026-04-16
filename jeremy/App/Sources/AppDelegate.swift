import AppKit
import SwiftUI

/// Application delegate managing lifecycle and core dependencies
class AppDelegate: NSObject, NSApplicationDelegate {
    var menuBarController: MenuBarController?
    var settingsManager: SettingsManager?
    var xpcClient: XPCClient?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Initialize core managers
        settingsManager = SettingsManager()
        xpcClient = XPCClient()

        // Set up menu bar controller with dependencies
        if let settingsManager = settingsManager,
           let xpcClient = xpcClient {
            menuBarController = MenuBarController(
                settingsManager: settingsManager,
                xpcClient: xpcClient
            )
        }

        // Connect to driver via XPC
        xpcClient?.connect()
    }

    func applicationWillTerminate(_ notification: Notification) {
        // Clean disconnect from driver
        xpcClient?.disconnect()
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
}
