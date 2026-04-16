import Foundation
import Combine

/// XPC Client for communicating with the MusicianStream audio driver
/// Manages connection to the driver service and handles all XPC message exchange
@MainActor
class XPCClient: ObservableObject {
    // MARK: - Published Properties

    /// Current status of the audio driver
    @Published var driverStatus: DriverStatus = .disconnected

    /// Whether the XPC connection to the driver is active
    @Published var isConnected: Bool = false

    // MARK: - Private Properties

    /// The active XPC connection object
    private var xpcConnection: NSXPCConnection?

    /// Queue for XPC operations
    private let xpcQueue = DispatchQueue(label: "com.musicianstream.xpc-client")

    /// Timer for periodic status updates
    private var statusUpdateTimer: Timer?

    /// Store for canceling subscriptions
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    init() {
        setupConnectionObserver()
    }

    deinit {
        disconnect()
    }

    // MARK: - Public Methods

    /// Establishes a connection to the XPC driver service
    func connect() {
        xpcQueue.async { [weak self] in
            guard let self = self else { return }

            // Create new XPC connection
            let connection = NSXPCConnection(
                serviceName: String(cString: kMusicianStreamXPCServiceName)
            )

            // Set up error handler
            connection.interruptionHandler = { [weak self] in
                Task { @MainActor [weak self] in
                    self?.isConnected = false
                    self?.driverStatus = .disconnected
                }
            }

            connection.invalidationHandler = { [weak self] in
                Task { @MainActor [weak self] in
                    self?.isConnected = false
                    self?.driverStatus = .disconnected
                }
            }

            // Resume the connection
            connection.resume()

            Task { @MainActor [weak self] in
                self?.xpcConnection = connection
                self?.isConnected = true
                // Fetch initial status
                await self?.fetchStatus()
                // Start periodic updates
                self?.startStatusUpdates()
            }
        }
    }

    /// Disconnects from the XPC driver service
    func disconnect() {
        statusUpdateTimer?.invalidate()
        statusUpdateTimer = nil

        xpcQueue.async { [weak self] in
            self?.xpcConnection?.invalidate()

            Task { @MainActor [weak self] in
                self?.xpcConnection = nil
                self?.isConnected = false
                self?.driverStatus = .disconnected
            }
        }
    }

    /// Sets the audio mode (stereo or mono) on the driver
    /// - Parameter mode: The desired audio mode
    func setMode(_ mode: AudioMode) {
        guard isConnected else { return }

        xpcQueue.async { [weak self] in
            guard let self = self else { return }

            let request = NSXPCInterface(with: XPCServiceProtocol.self)
            let proxy = self.xpcConnection?.remoteObjectProxyWithErrorHandler { error in
                Task { @MainActor in
                    print("XPC Error setting mode: \(error)")
                }
            } as? XPCServiceProtocol

            proxy?.setMode(mode.rawValue)
        }
    }

    /// Sets the limiter threshold value on the driver
    /// - Parameter threshold: The desired threshold value (between -6.0 and 0.0 dB)
    func setLimiterThreshold(_ threshold: Float) {
        guard isConnected else { return }

        xpcQueue.async { [weak self] in
            guard let self = self else { return }

            let request = NSXPCInterface(with: XPCServiceProtocol.self)
            let proxy = self.xpcConnection?.remoteObjectProxyWithErrorHandler { error in
                Task { @MainActor in
                    print("XPC Error setting threshold: \(error)")
                }
            } as? XPCServiceProtocol

            proxy?.setThreshold(threshold)
        }
    }

    /// Fetches the current status from the driver
    func fetchStatus() async {
        guard isConnected else { return }

        await withCheckedContinuation { continuation in
            xpcQueue.async { [weak self] in
                guard let self = self else {
                    continuation.resume()
                    return
                }

                let proxy = self.xpcConnection?.remoteObjectProxyWithErrorHandler { error in
                    print("XPC Error fetching status: \(error)")
                    continuation.resume()
                } as? XPCServiceProtocol

                proxy?.getStatus { [weak self] response in
                    Task { @MainActor [weak self] in
                        if let response = response {
                            self?.updateStatusFromResponse(response)
                        }
                        continuation.resume()
                    }
                }
            }
        }
    }

    // MARK: - Private Methods

    /// Sets up an observer for connection status changes
    private func setupConnectionObserver() {
        // In production, this would observe actual system notifications
        // For now, manual connect/disconnect is the trigger
    }

    /// Starts periodic status update timer
    private func startStatusUpdates() {
        Task { @MainActor in
            self.statusUpdateTimer = Timer.scheduledTimer(
                withTimeInterval: 1.0,
                repeats: true
            ) { [weak self] _ in
                Task {
                    await self?.fetchStatus()
                }
            }
        }
    }

    /// Updates the published driver status from an XPC response dictionary
    /// - Parameter response: Dictionary containing driver status fields
    private func updateStatusFromResponse(_ response: [String: Any]) {
        let deviceName = response[String(cString: kXPCResponseDeviceName)] as? String ?? "Unknown"
        let modeString = response[String(cString: kXPCResponseCurrentMode)] as? String ?? "stereo"
        let mode = AudioMode(rawValue: modeString) ?? .stereo
        let threshold = response[String(cString: kXPCResponseThreshold)] as? Float ?? AppSettings.limiterDefault
        let isActive = response[String(cString: kXPCResponseIsActive)] as? Bool ?? false

        let status = DriverStatus(
            latchedDeviceName: deviceName,
            currentMode: mode,
            limiterThreshold: threshold,
            isActive: isActive
        )

        Task { @MainActor [weak self] in
            self?.driverStatus = status
        }
    }
}

// MARK: - XPC Service Protocol

/// Protocol defining the XPC service interface
@objc protocol XPCServiceProtocol {
    /// Sets the audio mode on the driver
    func setMode(_ mode: String)

    /// Sets the limiter threshold on the driver
    func setThreshold(_ threshold: Float)

    /// Gets the current status from the driver
    func getStatus(reply: @escaping ([String: Any]?) -> Void)
}
