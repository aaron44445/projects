import Foundation
import Combine

/// Manages application settings with UserDefaults persistence
///
/// SettingsManager is an ObservableObject that handles saving and loading
/// user preferences for audio mode and limiter threshold settings.
/// Changes to published properties are automatically persisted to UserDefaults.
final class SettingsManager: ObservableObject {
    /// The currently selected audio mode (stereo or mono)
    @Published var audioMode: AudioMode {
        didSet {
            saveAudioMode()
        }
    }

    /// The current limiter threshold value
    @Published var limiterThreshold: Float {
        didSet {
            saveLimiterThreshold()
        }
    }

    private let userDefaults: UserDefaults

    /// Initializes the SettingsManager with an optional custom UserDefaults instance
    /// - Parameter userDefaults: The UserDefaults instance to use for persistence.
    ///   Defaults to UserDefaults.standard if not provided.
    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults

        // Load saved values or use defaults
        let savedAudioModeString = userDefaults.string(forKey: AppSettings.audioModeKey)
        self.audioMode = savedAudioModeString
            .flatMap(AudioMode.init(rawValue:))
            ?? .stereo

        self.limiterThreshold = userDefaults.object(forKey: AppSettings.limiterThresholdKey)
            .flatMap { $0 as? Float }
            ?? AppSettings.limiterDefault
    }

    // MARK: - Private Persistence Methods

    private func saveAudioMode() {
        userDefaults.set(audioMode.rawValue, forKey: AppSettings.audioModeKey)
    }

    private func saveLimiterThreshold() {
        userDefaults.set(limiterThreshold, forKey: AppSettings.limiterThresholdKey)
    }
}
