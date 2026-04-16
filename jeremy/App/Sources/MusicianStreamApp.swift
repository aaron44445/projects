import SwiftUI

/// Main app entry point - runs as menu bar app only (no dock icon)
@main
struct MusicianStreamApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        // Empty scene - app runs in menu bar only
        // LSUIElement=true in Info.plist hides dock icon
        Settings {
            EmptyView()
        }
    }
}
