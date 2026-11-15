import SwiftUI
import WebKit
import UIKit
import AVFoundation
import StoreKit
import GoogleMobileAds
import UserMessagingPlatform
import AppTrackingTransparency

/// Shows the game (copied into the app as the "www" folder at build time) in a WKWebView.
struct GameView: UIViewRepresentable {
    func makeCoordinator() -> Haptics { Haptics() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.isTextInteractionEnabled = false
        config.userContentController.add(context.coordinator, name: "haptic")
        config.userContentController.add(context.coordinator, name: "ads")
        config.userContentController.add(context.coordinator, name: "iap")
        // Safari on iOS has no navigator.vibrate: route the game's buzzes to the Taptic Engine instead.
        let shim = """
        navigator.vibrate = function (p) {
          try { window.webkit.messageHandlers.haptic.postMessage(Array.isArray(p) ? p.reduce(function (a, b) { return a + b; }, 0) : +p); } catch (e) {}
          return true;
        };
        """
        config.userContentController.addUserScript(WKUserScript(source: shim, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let web = WKWebView(frame: .zero, configuration: config)
        context.coordinator.webView = web
        context.coordinator.startIAP()
        // consent first (Google UMP, then Apple's tracking prompt), and only then the ads SDK
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { context.coordinator.gatherConsent() }
        context.coordinator.startLifecycleAudioRecovery()
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

/// Handles Taptic Engine haptics and native Google AdMob rewarded video ads.
final class Haptics: NSObject, WKScriptMessageHandler, GADFullScreenContentDelegate {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)

    weak var webView: WKWebView?
    private var rewardedAd: GADRewardedAd?
    private var isLoadingAd = false
    private var earnedReward = false

    // Debug builds (Xcode runs on your own phone) must use Google's test unit: clicking or watching your own
    // live ads counts as invalid traffic and can get the AdMob account suspended. Release builds use the real unit.
    #if DEBUG
    private let primaryUnitID = "ca-app-pub-3940256099942544/1712485313"
    #else
    private let primaryUnitID = "ca-app-pub-7235376124440923/2019691380"
    #endif
    // a load that takes longer than this is not shown any more: the player has been told it failed
    private let adPatience: TimeInterval = 12

    private let iapAmounts: [String: Int] = [
        "com.suzulus.oyun.feathers300": 300,
        "com.suzulus.oyun.feathers750": 750,
        "com.suzulus.oyun.feathers1800": 1800,
        "com.suzulus.oyun.feathers5000": 5000,
    ]
    private var iapProducts: [String: Product] = [:]
    private var updatesTask: Task<Void, Never>?
    private var handledTransactionIDs = Set<UInt64>()
    private var lifecycleObservers: [NSObjectProtocol] = []

    deinit {
        updatesTask?.cancel()
        for obs in lifecycleObservers {
            NotificationCenter.default.removeObserver(obs)
        }
    }

    func startLifecycleAudioRecovery() {
        guard lifecycleObservers.isEmpty else { return }
        let nc = NotificationCenter.default
        lifecycleObservers.append(
            nc.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
                self?.restoreAudioSessionAndNotifyJS()
            }
        )
        lifecycleObservers.append(
            nc.addObserver(forName: UIApplication.willEnterForegroundNotification, object: nil, queue: .main) { [weak self] _ in
                self?.restoreAudioSessionAndNotifyJS()
            }
        )
        lifecycleObservers.append(
            nc.addObserver(forName: AVAudioSession.interruptionNotification, object: AVAudioSession.sharedInstance(), queue: .main) { [weak self] note in
                guard let info = note.userInfo,
                      let rawType = info[AVAudioSessionInterruptionTypeKey] as? UInt,
                      let type = AVAudioSession.InterruptionType(rawValue: rawType),
                      type == .ended else { return }
                self?.restoreAudioSessionAndNotifyJS()
            }
        )
    }

    private func restoreAudioSessionAndNotifyJS() {
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        webView?.evaluateJavaScript("window.onNativeAppActive && window.onNativeAppActive()", completionHandler: nil)
    }

    // MARK: - Consent (Google UMP + App Tracking Transparency)

    private var adsStarted = false
    private var consentRunning = false

    /// Asks Google whether this user needs a consent form (EEA, UK, Switzerland and a few US states),
    /// shows it if so, then Apple's tracking prompt, and starts the ads SDK once ads may be requested.
    func gatherConsent(then done: (() -> Void)? = nil) {
        if consentRunning { return }
        consentRunning = true
        let params = UMPRequestParameters()
        #if DEBUG
        // to see the form from Türkiye while testing, uncomment and add your device's hash from the Xcode log:
        // let debug = UMPDebugSettings(); debug.geography = .EEA; debug.testDeviceIdentifiers = ["…"]; params.debugSettings = debug
        #endif
        let info = UMPConsentInformation.sharedInstance
        // a choice made on an earlier launch already allows ads: no need to wait for the network
        if info.canRequestAds { startAdsIfAllowed() }
        info.requestConsentInfoUpdate(with: params) { [weak self] _ in
            DispatchQueue.main.async {
                guard let self else { return }
                UMPConsentForm.loadAndPresentIfRequired(from: self.topViewController()) { [weak self] _ in
                    DispatchQueue.main.async {
                        guard let self else { return }
                        self.consentRunning = false
                        self.reportPrivacyOptions()
                        self.requestTrackingIfNeeded {
                            self.startAdsIfAllowed()
                            done?()
                        }
                    }
                }
            }
        }
    }

    private func requestTrackingIfNeeded(_ next: @escaping () -> Void) {
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined,
              UIApplication.shared.applicationState == .active else { next(); return }
        ATTrackingManager.requestTrackingAuthorization { _ in DispatchQueue.main.async { next() } }
    }

    private func startAdsIfAllowed() {
        guard UMPConsentInformation.sharedInstance.canRequestAds else { return }
        if !adsStarted {
            adsStarted = true
            GADMobileAds.sharedInstance().start(completionHandler: nil)
        }
        preloadAd()
    }

    /// Tells the page whether to show the "ad privacy options" button in settings.
    private func reportPrivacyOptions() {
        let required = UMPConsentInformation.sharedInstance.privacyOptionsRequirementStatus == .required
        webView?.evaluateJavaScript("window.onNativePrivacyOptions && window.onNativePrivacyOptions(\(required ? "true" : "false"))", completionHandler: nil)
    }

    private func showPrivacyOptions() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            UMPConsentForm.presentPrivacyOptionsForm(from: self.topViewController()) { [weak self] _ in
                DispatchQueue.main.async {
                    self?.reportPrivacyOptions()
                    self?.startAdsIfAllowed()
                }
            }
        }
    }

    func preloadAd() {
        guard UMPConsentInformation.sharedInstance.canRequestAds else { return }
        if isLoadingAd || rewardedAd != nil { return }
        isLoadingAd = true
        GADRewardedAd.load(withAdUnitID: primaryUnitID, request: GADRequest()) { [weak self] ad, _ in
            guard let self else { return }
            self.isLoadingAd = false
            if let ad = ad {
                ad.fullScreenContentDelegate = self
                self.rewardedAd = ad
            }
        }
    }

    private func topViewController() -> UIViewController? {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let root = scenes.flatMap { $0.windows }.first(where: { $0.isKeyWindow })?.rootViewController
        var current = root
        while let presented = current?.presentedViewController {
            current = presented
        }
        return current
    }

    private func showRewardedAd() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            if let ad = self.rewardedAd, let vc = self.topViewController() {
                self.earnedReward = false
                self.rewardedAd = nil
                self.webView?.evaluateJavaScript("window.onNativeAdPresented && window.onNativeAdPresented()", completionHandler: nil)
                ad.present(fromRootViewController: vc) { [weak self] in
                    self?.earnedReward = true
                }
                return
            }
            self.loadAndPresentImmediate()
        }
    }

    private func loadAndPresentImmediate() {
        // no consent yet (the form was closed or the network failed): ask again, and try the ad once it is settled
        guard UMPConsentInformation.sharedInstance.canRequestAds else {
            let asked = Date()
            gatherConsent { [weak self] in
                guard let self else { return }
                // only go on to the ad if the player is still waiting for it (the page gives up after 16 s)
                if UMPConsentInformation.sharedInstance.canRequestAds && Date().timeIntervalSince(asked) < 8 { self.loadAndPresentImmediate() }
                else { self.webView?.evaluateJavaScript("window.onNativeAdUnavailable && window.onNativeAdUnavailable()", completionHandler: nil) }
            }
            if consentRunning { return }
            webView?.evaluateJavaScript("window.onNativeAdUnavailable && window.onNativeAdUnavailable()", completionHandler: nil)
            return
        }
        isLoadingAd = true
        let asked = Date()
        GADRewardedAd.load(withAdUnitID: primaryUnitID, request: GADRequest()) { [weak self] ad, _ in
            guard let self else { return }
            self.isLoadingAd = false
            if let ad = ad, Date().timeIntervalSince(asked) > self.adPatience {
                // too late: keep it for the next request instead of popping up unasked
                ad.fullScreenContentDelegate = self
                self.rewardedAd = ad
                self.webView?.evaluateJavaScript("window.onNativeAdUnavailable && window.onNativeAdUnavailable()", completionHandler: nil)
                return
            }
            if let ad = ad, let vc = self.topViewController() {
                ad.fullScreenContentDelegate = self
                self.earnedReward = false
                self.webView?.evaluateJavaScript("window.onNativeAdPresented && window.onNativeAdPresented()", completionHandler: nil)
                ad.present(fromRootViewController: vc) { [weak self] in
                    self?.earnedReward = true
                }
            } else {
                self.webView?.evaluateJavaScript("window.onNativeAdUnavailable && window.onNativeAdUnavailable()", completionHandler: nil)
            }
        }
    }

    func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        let rewarded = earnedReward
        earnedReward = false
        DispatchQueue.main.async { [weak self] in
            self?.restoreAudioSessionAndNotifyJS()
            self?.webView?.evaluateJavaScript("window.onNativeAdClosed && window.onNativeAdClosed(\(rewarded ? "true" : "false"))", completionHandler: nil)
            self?.preloadAd()
        }
    }

    func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        rewardedAd = nil
        DispatchQueue.main.async { [weak self] in
            self?.restoreAudioSessionAndNotifyJS()
            self?.webView?.evaluateJavaScript("window.onNativeAdUnavailable && window.onNativeAdUnavailable()", completionHandler: nil)
            self?.preloadAd()
        }
    }

    // MARK: - StoreKit 2 In-App Purchases

    func startIAP() {
        updatesTask?.cancel()
        updatesTask = Task.detached(priority: .background) { [weak self] in
            for await result in StoreKit.Transaction.updates {
                guard let self else { return }
                if case .verified(let transaction) = result {
                    await self.handleVerifiedTransaction(transaction, fallbackAmount: nil)
                }
            }
        }
        fetchProducts()
    }

    // Paid packs waiting for the page to confirm it saved them, kept across launches.
    // StoreKit forgets a consumable once it is finished, so this is what makes sure no purchase is ever lost:
    // a pack is written here first, the transaction finished after, and the entry removed only on the page's "ack".
    private let pendingKey = "suzulus.pendingCredits"
    private var pendingCredits: [String: [String: Any]] {
        get { UserDefaults.standard.dictionary(forKey: pendingKey) as? [String: [String: Any]] ?? [:] }
        set { UserDefaults.standard.set(newValue, forKey: pendingKey) }
    }

    @MainActor
    @discardableResult
    private func handleVerifiedTransaction(_ transaction: StoreKit.Transaction, fallbackAmount: Int?) async -> Bool {
        if transaction.revocationDate != nil { await transaction.finish(); return false }
        let alreadyHandled = handledTransactionIDs.contains(transaction.id)
        handledTransactionIDs.insert(transaction.id)
        let amount = iapAmounts[transaction.productID] ?? fallbackAmount ?? 0
        let key = String(transaction.id)
        if !alreadyHandled && amount > 0 && pendingCredits[key] == nil {
            var p = pendingCredits
            p[key] = ["productId": transaction.productID, "amount": amount]
            pendingCredits = p
        }
        await transaction.finish()
        if alreadyHandled { return false }
        deliverPendingCredits()
        return amount > 0
    }

    /// Hands every unconfirmed pack to the page; harmless before it has loaded, as the page asks again on boot.
    @MainActor
    private func deliverPendingCredits() {
        for (tx, credit) in pendingCredits {
            var payload = credit
            payload["ok"] = true
            payload["tx"] = tx
            sendPurchaseResult(payload)
        }
    }

    private func restorePurchases() {
        Task { @MainActor [weak self] in
            guard let self else { return }
            do {
                try await AppStore.sync()
                var restoredCount = 0
                for await result in StoreKit.Transaction.unfinished {
                    if case .verified(let transaction) = result {
                        if await self.handleVerifiedTransaction(transaction, fallbackAmount: nil) {
                            restoredCount += 1
                        }
                    }
                }
                self.sendRestoreResult(["ok": true, "restored": restoredCount])
            } catch {
                self.sendRestoreResult(["ok": false, "code": "syncFailed"])
            }
        }
    }

    @MainActor
    private func sendRestoreResult(_ payload: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.onNativeRestoreResult && window.onNativeRestoreResult(\(json))", completionHandler: nil)
    }

    func fetchProducts() {
        let ids = Array(iapAmounts.keys)
        Task { @MainActor [weak self] in
            guard let self else { return }
            do {
                let products = try await Product.products(for: ids)
                var priceMap: [String: String] = [:]
                for product in products {
                    self.iapProducts[product.id] = product
                    priceMap[product.id] = product.displayPrice
                }
                if !priceMap.isEmpty,
                   let data = try? JSONSerialization.data(withJSONObject: priceMap),
                   let json = String(data: data, encoding: .utf8) {
                    self.webView?.evaluateJavaScript("window.onNativeProductsLoaded && window.onNativeProductsLoaded(\(json))", completionHandler: nil)
                }
            } catch {
                // App Store Connect products may not be active yet; the shop shows a placeholder price.
            }
        }
    }

    private func purchase(productID: String, fallbackAmount: Int) {
        Task { @MainActor [weak self] in
            guard let self else { return }
            var product = self.iapProducts[productID]
            if product == nil {
                if let fetched = try? await Product.products(for: [productID]).first {
                    self.iapProducts[productID] = fetched
                    product = fetched
                }
            }
            guard let product else {
                #if DEBUG
                if let vc = self.topViewController() {
                    let amount = self.iapAmounts[productID] ?? fallbackAmount
                    let alert = UIAlertController(
                        title: "Test Satın Alma (Debug)",
                        message: "\(amount) Altın Tüy paketini test modunda eklemek istiyor musun?",
                        preferredStyle: .alert
                    )
                    alert.addAction(UIAlertAction(title: "İptal", style: .cancel) { [weak self] _ in
                        self?.sendPurchaseResult(["ok": false, "cancelled": true])
                    })
                    alert.addAction(UIAlertAction(title: "Satın Al (Test)", style: .default) { [weak self] _ in
                        self?.sendPurchaseResult(["ok": true, "productId": productID, "amount": amount])
                    })
                    vc.present(alert, animated: true)
                    return
                }
                #endif
                self.sendPurchaseResult(["ok": false, "code": "unavailable"])
                return
            }

            do {
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await self.handleVerifiedTransaction(transaction, fallbackAmount: fallbackAmount)
                    case .unverified:
                        self.sendPurchaseResult(["ok": false, "code": "unverified"])
                    }
                case .userCancelled:
                    self.sendPurchaseResult(["ok": false, "cancelled": true])
                case .pending:
                    self.sendPurchaseResult(["ok": false, "pending": true])
                @unknown default:
                    self.sendPurchaseResult(["ok": false, "code": "failed"])
                }
            } catch {
                self.sendPurchaseResult(["ok": false, "code": "error"])
            }
        }
    }

    @MainActor
    private func sendPurchaseResult(_ payload: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.onNativePurchaseResult && window.onNativePurchaseResult(\(json))", completionHandler: nil)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "iap" {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }
            if action == "fetchProducts" {
                // the page sends this once it has booted: a good moment to hand over anything bought while it was loading
                fetchProducts()
                Task { @MainActor [weak self] in self?.deliverPendingCredits() }
            } else if action == "ack", let tx = body["tx"] as? String {
                var p = pendingCredits
                p.removeValue(forKey: tx)
                pendingCredits = p
            } else if action == "restore" {
                light.impactOccurred(intensity: 0.65)
                restorePurchases()
            } else if action == "openURL", let rawURL = body["url"] as? String,
                      let url = URL(string: rawURL), url.scheme == "https" {
                DispatchQueue.main.async {
                    UIApplication.shared.open(url)
                }
            } else if action == "purchase", let productID = body["productId"] as? String {
                light.impactOccurred(intensity: 0.65)
                let fallbackAmount = (body["amount"] as? NSNumber)?.intValue ?? iapAmounts[productID] ?? 0
                purchase(productID: productID, fallbackAmount: fallbackAmount)
            }
            return
        }
        if message.name == "ads" {
            let action = (message.body as? [String: Any])?["action"] as? String
            if action == "privacyOptions" { showPrivacyOptions(); return }
            if action == "consentStatus" { reportPrivacyOptions(); return }
            light.impactOccurred(intensity: 0.65)
            showRewardedAd()
            return
        }
        let ms = (message.body as? NSNumber)?.doubleValue ?? 0
        if ms <= 0 { return }
        if ms < 12 { light.impactOccurred(intensity: 0.7) }
        else if ms < 50 { medium.impactOccurred() }
        else { heavy.impactOccurred() }
    }
}
