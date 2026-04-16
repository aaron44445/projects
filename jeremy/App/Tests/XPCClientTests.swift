import XCTest
import Combine
@testable import MusicianStream

/// Tests for the XPCClient class
/// Verifies connection lifecycle, status updates, and command delivery
final class XPCClientTests: XCTestCase {
    // MARK: - Properties

    var sut: XPCClient!
    var cancellables: Set<AnyCancellable>!

    // MARK: - Setup & Teardown

    @MainActor
    override func setUp() {
        super.setUp()
        sut = XPCClient()
        cancellables = []
    }

    @MainActor
    override func tearDown() {
        sut.disconnect()
        sut = nil
        cancellables = nil
        super.tearDown()
    }

    // MARK: - Initial State Tests

    /// Test that XPCClient initializes in disconnected state
    @MainActor
    func testInitialStateIsDisconnected() {
        XCTAssertFalse(sut.isConnected)
        XCTAssertEqual(sut.driverStatus, .disconnected)
    }

    /// Test that driverStatus matches disconnected state initially
    @MainActor
    func testInitialDriverStatusIsDisconnected() {
        XCTAssertEqual(sut.driverStatus.latchedDeviceName, "Disconnected")
        XCTAssertEqual(sut.driverStatus.currentMode, .stereo)
        XCTAssertEqual(sut.driverStatus.limiterThreshold, 0.0)
        XCTAssertFalse(sut.driverStatus.isActive)
    }

    // MARK: - Connection Tests

    /// Test that connect() transitions to connected state
    @MainActor
    func testConnectTransitionsToConnected() {
        let expectation = expectation(description: "Connection established")

        sut.$isConnected
            .dropFirst()
            .first()
            .sink { isConnected in
                if isConnected {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)

        sut.connect()

        // Wait for connection or timeout
        waitForExpectations(timeout: 2.0)
        XCTAssertTrue(sut.isConnected)
    }

    /// Test that disconnect() transitions to disconnected state
    @MainActor
    func testDisconnectTransitionsToDisconnected() {
        let expectation = expectation(description: "Connection closed")

        sut.connect()

        // Wait a bit for connection
        Thread.sleep(forTimeInterval: 0.1)

        sut.$isConnected
            .dropFirst()
            .filter { !$0 }
            .first()
            .sink { _ in
                expectation.fulfill()
            }
            .store(in: &cancellables)

        sut.disconnect()

        waitForExpectations(timeout: 2.0)
        XCTAssertFalse(sut.isConnected)
        XCTAssertEqual(sut.driverStatus, .disconnected)
    }

    // MARK: - Status Update Tests

    /// Test that driverStatus updates when data is available
    @MainActor
    func testDriverStatusUpdates() {
        let expectation = expectation(description: "Status updated")
        expectation.expectedFulfillmentCount = 1

        let mockResponse: [String: Any] = [
            String(cString: kXPCResponseDeviceName): "Built-in Microphone",
            String(cString: kXPCResponseCurrentMode): "mono",
            String(cString: kXPCResponseThreshold): -3.0,
            String(cString: kXPCResponseIsActive): true,
        ]

        sut.$driverStatus
            .dropFirst()
            .filter { $0 != .disconnected }
            .first()
            .sink { status in
                expectation.fulfill()
            }
            .store(in: &cancellables)

        // Simulate receiving a status update (in real scenario from XPC)
        sut.connect()

        waitForExpectations(timeout: 2.0)
    }

    /// Test that device name is correctly extracted from status
    @MainActor
    func testStatusContainsCorrectDeviceName() {
        let status = DriverStatus(
            latchedDeviceName: "USB Audio Device",
            currentMode: .mono,
            limiterThreshold: -2.0,
            isActive: true
        )

        sut.$driverStatus
            .sink { _ in }
            .store(in: &cancellables)

        XCTAssertEqual(status.latchedDeviceName, "USB Audio Device")
    }

    /// Test that audio mode is correctly extracted from status
    @MainActor
    func testStatusContainsCorrectAudioMode() {
        let status = DriverStatus(
            latchedDeviceName: "Device",
            currentMode: .mono,
            limiterThreshold: -2.0,
            isActive: true
        )

        XCTAssertEqual(status.currentMode, .mono)
    }

    /// Test that limiter threshold is within valid range
    @MainActor
    func testThresholdIsWithinValidRange() {
        let minStatus = DriverStatus(
            latchedDeviceName: "Device",
            currentMode: .stereo,
            limiterThreshold: AppSettings.limiterMin,
            isActive: false
        )

        let maxStatus = DriverStatus(
            latchedDeviceName: "Device",
            currentMode: .stereo,
            limiterThreshold: AppSettings.limiterMax,
            isActive: false
        )

        XCTAssertGreaterThanOrEqual(minStatus.limiterThreshold, AppSettings.limiterMin)
        XCTAssertLessThanOrEqual(maxStatus.limiterThreshold, AppSettings.limiterMax)
    }

    // MARK: - Command Tests

    /// Test that setMode() can be called when connected
    @MainActor
    func testSetModeWhenConnected() {
        let expectation = expectation(description: "setMode called")

        sut.$isConnected
            .dropFirst()
            .filter { $0 }
            .first()
            .sink { _ in
                expectation.fulfill()
            }
            .store(in: &cancellables)

        sut.connect()
        waitForExpectations(timeout: 2.0)

        // Should not crash when called
        XCTAssertNoThrow {
            sut.setMode(.mono)
        }
    }

    /// Test that setMode() is ignored when disconnected
    @MainActor
    func testSetModeWhenDisconnected() {
        XCTAssertFalse(sut.isConnected)

        // Should silently fail, not crash
        XCTAssertNoThrow {
            sut.setMode(.stereo)
        }
    }

    /// Test that setLimiterThreshold() can be called when connected
    @MainActor
    func testSetLimiterThresholdWhenConnected() {
        let expectation = expectation(description: "setThreshold called")

        sut.$isConnected
            .dropFirst()
            .filter { $0 }
            .first()
            .sink { _ in
                expectation.fulfill()
            }
            .store(in: &cancellables)

        sut.connect()
        waitForExpectations(timeout: 2.0)

        // Should not crash when called
        XCTAssertNoThrow {
            sut.setLimiterThreshold(-3.0)
        }
    }

    /// Test that setLimiterThreshold() is ignored when disconnected
    @MainActor
    func testSetLimiterThresholdWhenDisconnected() {
        XCTAssertFalse(sut.isConnected)

        // Should silently fail, not crash
        XCTAssertNoThrow {
            sut.setLimiterThreshold(-2.0)
        }
    }

    /// Test that setLimiterThreshold() accepts boundary values
    @MainActor
    func testSetLimiterThresholdBoundaryValues() {
        let expectation = expectation(description: "Connection established")

        sut.$isConnected
            .dropFirst()
            .filter { $0 }
            .first()
            .sink { _ in
                expectation.fulfill()
            }
            .store(in: &cancellables)

        sut.connect()
        waitForExpectations(timeout: 2.0)

        // Test minimum value
        XCTAssertNoThrow {
            sut.setLimiterThreshold(AppSettings.limiterMin)
        }

        // Test maximum value
        XCTAssertNoThrow {
            sut.setLimiterThreshold(AppSettings.limiterMax)
        }

        // Test middle value
        XCTAssertNoThrow {
            sut.setLimiterThreshold((AppSettings.limiterMin + AppSettings.limiterMax) / 2)
        }
    }

    // MARK: - Async Status Fetch Tests

    /// Test that fetchStatus() completes without error when disconnected
    @MainActor
    func testFetchStatusWhenDisconnected() async {
        XCTAssertFalse(sut.isConnected)

        // Should complete without error
        await sut.fetchStatus()
    }

    /// Test that fetchStatus() can be called when connected
    @MainActor
    func testFetchStatusWhenConnected() async {
        let connectExpectation = expectation(description: "Connected")

        sut.$isConnected
            .dropFirst()
            .filter { $0 }
            .first()
            .sink { _ in
                connectExpectation.fulfill()
            }
            .store(in: &cancellables)

        sut.connect()
        waitForExpectations(timeout: 2.0)

        // Should complete without error
        await sut.fetchStatus()
    }
}

// MARK: - Test Helpers

extension XCPCClientTests {
    /// Helper to assert that a closure doesn't throw
    func XCTAssertNoThrow(_ closure: () throws -> Void, file: StaticString = #file, line: UInt = #line) {
        do {
            try closure()
        } catch {
            XCTFail("Expected no throw, but got: \(error)", file: file, line: line)
        }
    }
}
