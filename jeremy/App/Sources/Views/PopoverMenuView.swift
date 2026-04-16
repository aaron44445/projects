import SwiftUI

/// Main popover menu view with professional studio aesthetic
struct PopoverMenuView: View {
    @ObservedObject var settingsManager: SettingsManager
    @ObservedObject var xpcClient: XPCClient

    var body: some View {
        VStack(spacing: 0) {
            // Header
            headerView

            Divider()
                .background(Color.studioSecondary.opacity(0.2))

            // Content
            VStack(spacing: 16) {
                // Device status
                deviceStatusView

                // Mode toggle
                modeToggleView

                // Limiter control
                limiterControlView
            }
            .padding(16)

            Divider()
                .background(Color.studioSecondary.opacity(0.2))

            // Footer
            footerView
        }
        .frame(width: 300)
        .background(Color.studioBackground)
    }

    // MARK: - Header

    private var headerView: some View {
        HStack(spacing: 8) {
            Text("MusicianStream")
                .font(.system(.title3, design: .default, weight: .semibold))
                .foregroundColor(.studioPrimary)

            Spacer()

            // Activity indicator
            Circle()
                .fill(xpcClient.driverStatus.isActive ? Color.studioAccent : Color.studioSecondary.opacity(0.3))
                .frame(width: 8, height: 8)
                .shadow(color: xpcClient.driverStatus.isActive ? Color.studioAccent.opacity(0.6) : .clear, radius: 4)
        }
        .padding(16)
    }

    // MARK: - Device Status

    private var deviceStatusView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("INPUT DEVICE")
                .font(.system(size: 9, weight: .semibold, design: .default))
                .foregroundColor(.studioSecondary)
                .tracking(1.2)

            Text(xpcClient.driverStatus.latchedDeviceName)
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundColor(.studioPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.studioSurface)
        .cornerRadius(8)
    }

    // MARK: - Mode Toggle

    private var modeToggleView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("MODE")
                .font(.system(size: 9, weight: .semibold, design: .default))
                .foregroundColor(.studioSecondary)
                .tracking(1.2)

            HStack(spacing: 8) {
                ModeButton(
                    title: "Stereo",
                    isSelected: settingsManager.audioMode == .stereo
                ) {
                    settingsManager.audioMode = .stereo
                }

                ModeButton(
                    title: "Mono",
                    isSelected: settingsManager.audioMode == .mono
                ) {
                    settingsManager.audioMode = .mono
                }
            }
        }
    }

    // MARK: - Limiter Control

    private var limiterControlView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("LIMITER")
                    .font(.system(size: 9, weight: .semibold, design: .default))
                    .foregroundColor(.studioSecondary)
                    .tracking(1.2)

                Spacer()

                Text(String(format: "%.1f dB", settingsManager.limiterThreshold))
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .foregroundColor(.studioPrimary)
            }

            LimiterSlider(
                value: $settingsManager.limiterThreshold,
                range: AppSettings.limiterMin...AppSettings.limiterMax
            )
        }
    }

    // MARK: - Footer

    private var footerView: some View {
        Button(action: { NSApplication.shared.terminate(nil) }) {
            HStack {
                Spacer()
                Text("Quit")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.studioSecondary)
                Spacer()
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .background(Color.studioBackground)
        .onHover { isHovered in
            if isHovered {
                NSCursor.pointingHand.push()
            } else {
                NSCursor.pop()
            }
        }
    }
}

// MARK: - Mode Button

struct ModeButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            HStack {
                Spacer()

                // Selection indicator
                Circle()
                    .fill(isSelected ? Color.studioAccent : Color.clear)
                    .frame(width: 6, height: 6)
                    .overlay(
                        Circle()
                            .stroke(isSelected ? Color.clear : Color.studioSecondary.opacity(0.4), lineWidth: 1)
                    )
                    .shadow(color: isSelected ? Color.studioAccent.opacity(0.6) : .clear, radius: 3)

                Text(title)
                    .font(.system(size: 12, weight: isSelected ? .semibold : .medium))
                    .foregroundColor(isSelected ? .studioPrimary : .studioSecondary)

                Spacer()
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(isSelected ? Color.studioSurface : Color.clear)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(
                                isSelected ? Color.studioAccent.opacity(0.3) : Color.studioSecondary.opacity(0.2),
                                lineWidth: 1
                            )
                    )
            )
            .scaleEffect(isHovered ? 1.02 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: isHovered)
            .animation(.easeInOut(duration: 0.15), value: isSelected)
        }
        .buttonStyle(.plain)
        .onHover { hovering in
            isHovered = hovering
            if hovering {
                NSCursor.pointingHand.push()
            } else {
                NSCursor.pop()
            }
        }
    }
}

// MARK: - Limiter Slider

struct LimiterSlider: View {
    @Binding var value: Float
    let range: ClosedRange<Float>

    @State private var isDragging = false

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Track background with gradient
                RoundedRectangle(cornerRadius: 3)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.limiterSafe.opacity(0.2),
                                Color.limiterWarning.opacity(0.2),
                                Color.limiterDanger.opacity(0.2)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(height: 6)

                // Active track with gradient
                RoundedRectangle(cornerRadius: 3)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.limiterSafe,
                                Color.limiterWarning,
                                Color.limiterDanger
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: thumbPosition(in: geometry.size.width), height: 6)

                // Thumb
                Circle()
                    .fill(Color.studioPrimary)
                    .frame(width: 14, height: 14)
                    .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 1)
                    .shadow(color: limiterColor.opacity(0.6), radius: isDragging ? 6 : 3)
                    .scaleEffect(isDragging ? 1.1 : 1.0)
                    .offset(x: thumbPosition(in: geometry.size.width) - 7)
                    .animation(.easeInOut(duration: 0.15), value: isDragging)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { gesture in
                                isDragging = true
                                updateValue(from: gesture.location.x, in: geometry.size.width)
                            }
                            .onEnded { _ in
                                isDragging = false
                            }
                    )
            }
        }
        .frame(height: 32)
        .onHover { hovering in
            if hovering {
                NSCursor.pointingHand.push()
            } else {
                NSCursor.pop()
            }
        }
    }

    private func thumbPosition(in width: CGFloat) -> CGFloat {
        let normalizedValue = (value - range.lowerBound) / (range.upperBound - range.lowerBound)
        return CGFloat(normalizedValue) * width
    }

    private func updateValue(from x: CGFloat, in width: CGFloat) {
        let normalizedX = max(0, min(x, width)) / width
        let newValue = Float(normalizedX) * (range.upperBound - range.lowerBound) + range.lowerBound
        value = max(range.lowerBound, min(newValue, range.upperBound))
    }

    private var limiterColor: Color {
        let normalizedValue = (value - range.lowerBound) / (range.upperBound - range.lowerBound)
        if normalizedValue < 0.33 {
            return .limiterSafe
        } else if normalizedValue < 0.67 {
            return .limiterWarning
        } else {
            return .limiterDanger
        }
    }
}

// MARK: - Preview

#Preview {
    PopoverMenuView(
        settingsManager: SettingsManager(),
        xpcClient: XPCClient()
    )
}
