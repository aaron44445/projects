import SwiftUI

/// Professional studio aesthetic color palette
extension Color {
    /// Background colors
    static let studioBackground = Color(hex: "1a1a1a")
    static let studioSurface = Color(hex: "242424")

    /// Text colors
    static let studioPrimary = Color(hex: "e8e8e8")
    static let studioSecondary = Color(hex: "8a8a8a")

    /// Accent color - warm copper for active states
    static let studioAccent = Color(hex: "d4845c")

    /// Limiter gradient colors
    static let limiterSafe = Color(hex: "4ade80")     // Green
    static let limiterWarning = Color(hex: "fbbf24")  // Amber
    static let limiterDanger = Color(hex: "ef4444")   // Red

    /// Hex color initializer
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
