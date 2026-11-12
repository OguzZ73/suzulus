import SwiftUI
import WebKit

/// Shows the game (copied into the app as the "www" folder at build time) in a WKWebView.
struct GameView: UIViewRepresentable {
    func makeCoordinator() -> Haptics { Haptics() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.isTextInteractionEnabled = false
        config.userContentController.add(context.coordinator, name: "haptic")
        // Safari on iOS has no navigator.vibrate: route the game's buzzes to the Taptic Engine instead.
        let shim = """
        navigator.vibrate = function (p) {
          try { window.webkit.messageHandlers.haptic.postMessage(Array.isArray(p) ? p.reduce(function (a, b) { return a + b; }, 0) : +p); } catch (e) {}
          return true;
        };
        """
        config.userContentController.addUserScript(WKUserScript(source: shim, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let web = WKWebView(frame: .zero, configuration: config)
        let night = UIColor(red: 0.047, green: 0.075, blue: 0.157, alpha: 1)
        web.isOpaque = false
        web.backgroundColor = night
        web.scrollView.backgroundColor = night
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsBackForwardNavigationGestures = false
        web.allowsLinkPreview = false

        if let www = Bundle.main.url(forResource: "www", withExtension: nil) {
            web.loadFileURL(www.appendingPathComponent("index.html"), allowingReadAccessTo: www)
        }
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

/// Turns the game's vibration lengths (milliseconds) into light, medium or heavy taps.
final class Haptics: NSObject, WKScriptMessageHandler {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let ms = (message.body as? NSNumber)?.doubleValue ?? 0
        if ms <= 0 { return }
        if ms < 12 { light.impactOccurred(intensity: 0.7) }
        else if ms < 50 { medium.impactOccurred() }
        else { heavy.impactOccurred() }
    }
}
