import AppKit
import SwiftUI

/// Manages the menu bar status item and popover for MusicianStream
class MenuBarController: NSObject, ObservableObject {
    private var statusItem: NSStatusItem?
    private var popover: NSPopover?

    @Published var isPopoverVisible: Bool = false

    // Dependencies
    private let settingsManager: SettingsManager
    private let xpcClient: XPCClient

    init(settingsManager: SettingsManager, xpcClient: XPCClient) {
        self.settingsManager = settingsManager
        self.xpcClient = xpcClient
        super.init()

        setupStatusItem()
        setupPopover()
    }

    // MARK: - Setup

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)

        if let button = statusItem?.button {
            // Use menu bar icon from Assets.xcassets
            button.image = NSImage(named: "MenuBarIcon")
            button.image?.isTemplate = true  // Ensures proper light/dark mode adaptation
            button.action = #selector(togglePopover)
            button.target = self
        }
    }

    private func setupPopover() {
        popover = NSPopover()
        popover?.contentSize = NSSize(width: 300, height: 260)  // Height adjusted for content
        popover?.behavior = .transient  // Closes when clicking outside
        popover?.delegate = self

        // Set popover content
        let contentView = PopoverMenuView(
            settingsManager: settingsManager,
            xpcClient: xpcClient
        )
        popover?.contentViewController = NSHostingController(rootView: contentView)
    }

    // MARK: - Public Methods

    /// Updates the popover content (useful if dependencies change)
    func updatePopoverContent() {
        let contentView = PopoverMenuView(
            settingsManager: settingsManager,
            xpcClient: xpcClient
        )
        popover?.contentViewController = NSHostingController(rootView: contentView)
    }

    /// Manually close the popover
    func closePopover() {
        popover?.performClose(nil)
        isPopoverVisible = false
    }

    // MARK: - Actions

    @objc private func togglePopover() {
        guard let button = statusItem?.button else { return }

        if let popover = popover, popover.isShown {
            popover.performClose(nil)
            isPopoverVisible = false
        } else {
            popover?.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            isPopoverVisible = true
        }
    }
}

// MARK: - NSPopoverDelegate

extension MenuBarController: NSPopoverDelegate {
    func popoverWillShow(_ notification: Notification) {
        isPopoverVisible = true
    }

    func popoverDidClose(_ notification: Notification) {
        isPopoverVisible = false
    }
}
