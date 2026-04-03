import UIKit
import WebKit

class ViewController: UIViewController {

    // MARK: - Sabitler
    private let EOKUL_URL  = "https://e-okul.meb.gov.tr/giris.aspx"
    private let DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                             "AppleWebKit/537.36 (KHTML, like Gecko) " +
                             "Chrome/120.0.0.0 Safari/537.36"

    // Sayfa yüklenmeye başlar başlamaz ⚡ FAB ekle
    private let EARLY_FAB = """
    (function(){
      if (document.getElementById('ew-fab')) return;
      function mk() {
        var f = document.createElement('div'); f.id = 'ew-fab';
        Object.assign(f.style, {
          position:'fixed', bottom:'20px', right:'20px',
          width:'56px', height:'56px', zIndex:'99999999',
          background:'linear-gradient(135deg,#10b981,#059669)',
          borderRadius:'50%', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:'28px', cursor:'pointer',
          WebkitUserSelect:'none'
        });
        f.textContent = '⚡';
        document.body.appendChild(f);
      }
      if (document.body) mk();
      else document.addEventListener('DOMContentLoaded', mk);
    })();
    """

    // MARK: - WebView
    private var webView: WKWebView!

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        setupWebView()
        loadEOkul()
    }

    // MARK: - Kurulum
    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()          // Çerezler / localStorage
        config.preferences.javaScriptCanOpenWindowsAutomatically = true

        let controller = config.userContentController

        // 1) Her sayfa başında ⚡ FAB oluştur
        controller.addUserScript(WKUserScript(
            source: EARLY_FAB,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))

        // 2) Sayfa bittikten sonra SheetJS + Wizard çalıştır
        if let xlsx   = loadAsset("xlsx.full.min"),
           let wizard = loadAsset("wizard") {

            let xlsxSafe = "(typeof XLSX !== 'undefined') ? null : (function(){ \(xlsx) })();"
            controller.addUserScript(WKUserScript(
                source: xlsxSafe,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            ))
            controller.addUserScript(WKUserScript(
                source: wizard,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            ))
        }

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate         = self
        webView.customUserAgent    = DESKTOP_UA
        webView.scrollView.bounces = false

        view.addSubview(webView)
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func loadEOkul() {
        guard let url = URL(string: EOKUL_URL) else { return }
        webView.load(URLRequest(url: url))
    }

    // MARK: - Asset Yükle
    private func loadAsset(_ name: String) -> String? {
        guard let path = Bundle.main.path(forResource: name, ofType: "js"),
              let content = try? String(contentsOfFile: path, encoding: .utf8)
        else { return nil }
        return content
    }
}

// MARK: - WKNavigationDelegate
extension ViewController: WKNavigationDelegate {

    // SSL sertifika hatalarını geç (e-okul bazen sertifika uyarısı verir)
    func webView(_ webView: WKWebView,
                 didReceive challenge: URLAuthenticationChallenge,
                 completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        if challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
           let trust = challenge.protectionSpace.serverTrust {
            completionHandler(.useCredential, URLCredential(trust: trust))
        } else {
            completionHandler(.performDefaultHandling, nil)
        }
    }

    // Geri tuşu desteği
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }
}

// MARK: - WKUIDelegate (JavaScript diyalogları)
extension ViewController: WKUIDelegate {

    // window.confirm()
    func webView(_ webView: WKWebView,
                 runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Tamam",  style: .default) { _ in completionHandler(true) })
        alert.addAction(UIAlertAction(title: "İptal",  style: .cancel)  { _ in completionHandler(false) })
        present(alert, animated: true)
    }

    // window.alert()
    func webView(_ webView: WKWebView,
                 runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }
}
