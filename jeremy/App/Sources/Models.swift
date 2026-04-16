import Foundation

/// Represents the audio mode for driver operation
enum AudioMode: String, Codable {
    case stereo
    case mono
}

/// Represents the current status of the audio driver
struct DriverStatus: Codable {
    /// The name of the currently latched device
    let latchedDeviceName: String

    /// The current audio mode (stereo or mono)
    let currentMode: AudioMode

    /// The current limiter threshold value
    let limiterThreshold: Float

    /// Whether the driver is currently active
    let isActive: Bool

    /// A static disconnected status instance
    static let disconnected = DriverStatus(
        latchedDeviceName: "Disconnected",
        currentMode: .stereo,
        limiterThreshold: 0.0,
        isActive: false
    )
}

/// Application-wide settings and configuration constants
struct AppSettings {
    /// Storage key for persisting the audio mode preference
    static let audioModeKey = "audioMode"

    /// Storage key for persisting the limiter threshold value
    static let limiterThresholdKey = "limiterThreshold"

    /// Minimum allowed limiter threshold value
    static let limiterMin: Float = -6.0

    /// Maximum allowed limiter threshold value
    static let limiterMax: Float = 0.0

    /// Default limiter threshold value
    static let limiterDefault: Float = -1.0
}
