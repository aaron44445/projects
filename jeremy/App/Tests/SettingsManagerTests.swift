import XCTest
@testable import MusicianStream

final class SettingsManagerTests: XCTestCase {
    var sut: SettingsManager!
    var userDefaults: UserDefaults!

    override func setUp() {
        super.setUp()
        // Create a temporary UserDefaults suite for testing
        userDefaults = UserDefaults(suiteName: UUID().uuidString)
        XCTAssertNotNil(userDefaults, "Failed to create temporary UserDefaults")
        sut = SettingsManager(userDefaults: userDefaults!)
    }

    override func tearDown() {
        // Clean up the temporary UserDefaults
        userDefaults?.removePersistentDomain(forName: userDefaults!.suiteName!)
        sut = nil
        userDefaults = nil
        super.tearDown()
    }

    // MARK: - Default Values Tests

    func testAudioModeDefaultValue() {
        // Given: A fresh SettingsManager with no saved data
        // When: Accessing audioMode
        // Then: It should return the default stereo mode
        XCTAssertEqual(sut.audioMode, .stereo)
    }

    func testLimiterThresholdDefaultValue() {
        // Given: A fresh SettingsManager with no saved data
        // When: Accessing limiterThreshold
        // Then: It should return the default value from AppSettings
        XCTAssertEqual(sut.limiterThreshold, AppSettings.limiterDefault)
    }

    // MARK: - Save and Load Mode Tests

    func testSaveAndLoadAudioMode() {
        // Given: A SettingsManager instance
        // When: Setting audioMode to mono
        sut.audioMode = .mono

        // Then: Creating a new SettingsManager should load the saved value
        let newManager = SettingsManager(userDefaults: userDefaults!)
        XCTAssertEqual(newManager.audioMode, .mono)
    }

    func testSaveAndLoadLimiterThreshold() {
        // Given: A SettingsManager instance
        let testThreshold: Float = -3.5

        // When: Setting limiterThreshold to a new value
        sut.limiterThreshold = testThreshold

        // Then: Creating a new SettingsManager should load the saved value
        let newManager = SettingsManager(userDefaults: userDefaults!)
        XCTAssertEqual(newManager.limiterThreshold, testThreshold, accuracy: 0.01)
    }
}
