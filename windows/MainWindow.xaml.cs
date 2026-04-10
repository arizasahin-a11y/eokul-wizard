using System;
using System.IO;
using System.Management;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace EokulWizard
{
    [ComVisible(true)]
    public class Bridge
    {
        public void OpenWhatsApp(string number, string message)
        {
            try
            {
                string url = $"https://wa.me/{number}?text={Uri.EscapeDataString(message)}";
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show("WhatsApp açılamadı: " + ex.Message);
            }
        }
    }

    public partial class MainWindow : Window
    {
        private string hwid = "WIN-UNKNOWN";

        public MainWindow()
        {
            InitializeComponent();
            GenerateHWID();
            _ = InitializeWebView();
        }

        private void GenerateHWID()
        {
            try
            {
                string cpuId = "";
                ManagementClass mc = new ManagementClass("win32_processor");
                ManagementObjectCollection moc = mc.GetInstances();
                foreach (ManagementObject mo in moc)
                {
                    cpuId = mo.Properties["ProcessorId"].Value.ToString();
                    break;
                }

                string biosSerial = "";
                ManagementClass mc2 = new ManagementClass("Win32_BIOS");
                ManagementObjectCollection moc2 = mc2.GetInstances();
                foreach (ManagementObject mo in moc2)
                {
                    biosSerial = mo.Properties["SerialNumber"].Value.ToString();
                    break;
                }

                hwid = "WIN-" + cpuId + "-" + biosSerial;
            }
            catch (Exception ex)
            {
                hwid = "WIN-GENERIC-" + Environment.MachineName;
            }
        }

        private async Task InitializeWebView()
        {
            try
            {
                // CoreWebView2 Environment oluştur
                var env = await CoreWebView2Environment.CreateAsync(null, null);
                await webView.EnsureCoreWebView2Async(env);

                // User Agent ayarla (Mobil yönlendirmesi olmasın)
                webView.CoreWebView2.Settings.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
                
                // JavaScript Bridge ekle
                webView.CoreWebView2.AddHostObjectToScript("Windows", new Bridge());

                webView.NavigationCompleted += WebView_NavigationCompleted;
                webView.CoreWebView2.DOMContentLoaded += CoreWebView2_DOMContentLoaded;
            }
            catch (Exception ex)
            {
                MessageBox.Show("WebView2 başlatılamadı. Lütfen WebView2 Runtime yüklü olduğundan emin olun.\nHata: " + ex.Message);
            }
        }

        private void CoreWebView2_DOMContentLoaded(object sender, CoreWebView2DOMContentLoadedEventArgs e)
        {
            // Sayfa yüklendiğinde HWID'yi enjekte et
            _ = webView.CoreWebView2.ExecuteScriptAsync($"window.ANDROID_ID = '{hwid}';");
        }

        private async void WebView_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (e.IsSuccess && webView.Source.ToString().Contains("e-okul.meb.gov.tr"))
            {
                await InjectScripts();
            }
        }

        private async Task InjectScripts()
        {
            try
            {
                string xlsxPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "xlsx.full.min.js");
                string wizardPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "wizard.js");

                if (File.Exists(xlsxPath))
                {
                    string xlsxJs = File.ReadAllText(xlsxPath);
                    await webView.CoreWebView2.ExecuteScriptAsync($@"(typeof XLSX !== 'undefined') ? 'skip' : (function(){{ {xlsxJs} }})();");
                }

                if (File.Exists(wizardPath))
                {
                    string wizardJs = File.ReadAllText(wizardPath);
                    
                    // Windows Interop için minik bir patch
                    string patch = @"
                        window.Android = {
                            openWhatsApp: function(n, m) {
                                window.chrome.webview.hostObjects.Windows.OpenWhatsApp(n, m);
                            }
                        };
                    ";
                    
                    await webView.CoreWebView2.ExecuteScriptAsync(patch + wizardJs);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Script injection error: " + ex.Message);
            }
        }
    }
}
