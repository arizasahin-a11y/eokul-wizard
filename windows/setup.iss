; Inno Setup Script - e-Okul Gelişim Düzeyi Sihirbazı
; Bu script, 'dotnet publish' komutu çalıştırıldıktan sonra üretilen dosyaları paketler.

[Setup]
AppId={{E0KUL-WIZARD-WIN-2026}}
AppName=e-Okul Gelişim Düzeyi Sihirbazı
AppVersion=3.4
AppPublisher=Ali Rıza ŞAHİN
DefaultDirName={autopf}\eOkulWizard
DefaultGroupName=e-Okul Sihirbazı
AllowNoIcons=yes
; Setup EXE isminin ne olacağını belirler
OutputBaseFilename=eOkulSihirbazi_Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Derlenen tek-dosya EXE'yi buraya ekliyoruz (Publish klasöründen)
Source: "bin\Release\net8.0-windows\win-x64\publish\EokulWizard.exe"; DestDir: "{app}"; Flags: ignoreversion
; Assets klasörünü de kopyalıyoruz (Eğer EXE içine gömülmediyse)
Source: "bin\Release\net8.0-windows\win-x64\publish\Assets\*"; DestDir: "{app}\Assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\e-Okul Gelişim Düzeyi Sihirbazı"; Filename: "{app}\EokulWizard.exe"
Name: "{autodesktop}\e-Okul Gelişim Düzeyi Sihirbazı"; Filename: "{app}\EokulWizard.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\EokulWizard.exe"; Description: "{cm:LaunchProgram,e-Okul Gelişim Düzeyi Sihirbazı}"; Flags: nowait postinstall skipifsilent
