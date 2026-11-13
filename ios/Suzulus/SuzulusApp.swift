import SwiftUI
import AVFoundation

// Süzülüş for iPhone and iPad: the web game from the folder above, shown full screen in a web view.
@main
struct SuzulusApp: App {
    init() {
        // Web views default to an "ambient" audio session, which the ring/silent switch mutes.
        // Play as media instead, still mixing with music from other apps.
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        // Google Mobile Ads starts only after the consent check (GameView's coordinator runs it).
    }

    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)
                .background(Color(red: 0.047, green: 0.075, blue: 0.157))
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                    try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
                    try? AVAudioSession.sharedInstance().setActive(true)
                }
        }
    }
}
