import JSZip from 'jszip';

/**
 * Converts a PNG Uint8Array into a standard Windows ICO format.
 * Since Vista, Windows supports PNG-compressed icons inside ICO,
 * allowing us to directly wrap our custom high-resolution PNG icon
 * into an ICO file client-side.
 */
const pngToIco = (pngBytes: Uint8Array): Uint8Array => {
    const icoSize = 6 + 16 + pngBytes.length;
    const buf = new Uint8Array(icoSize);
    const view = new DataView(buf.buffer);

    // 1. ICO Header (6 bytes)
    view.setUint16(0, 0, true);     // Reserved (must be 0)
    view.setUint16(2, 1, true);     // Image type (1 = ICO, 2 = CUR)
    view.setUint16(4, 1, true);     // Number of images in file (1)

    // 2. Directory Entry (16 bytes)
    view.setUint8(6, 0);            // Width (0 means 256 pixels)
    view.setUint8(7, 0);            // Height (0 means 256 pixels)
    view.setUint8(8, 0);            // Color count (0 for >= 256 colors)
    view.setUint8(9, 0);            // Reserved (must be 0)
    view.setUint16(10, 1, true);    // Color planes (1)
    view.setUint16(12, 32, true);   // Bits per pixel (32-bit ARGB)
    view.setUint32(14, pngBytes.length, true); // Size of the raw image data
    view.setUint32(18, 22, true);   // Offset of the image data (header + entry = 22)

    // 3. Image Data (raw PNG bytes)
    buf.set(pngBytes, 22);

    return buf;
};

/**
 * Converts a base64 Data URI to a Uint8Array of raw binary bytes.
 */
const dataUriToBytes = (dataUri: string): Uint8Array | null => {
    if (!dataUri) return null;
    try {
        const commaIndex = dataUri.indexOf(',');
        if (commaIndex === -1) {
            return null;
        }
        const base64Str = dataUri.substring(commaIndex + 1);
        const binaryStr = atob(base64Str);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Failed to parse Data URI to bytes:", e);
        return null;
    }
};

/**
 * Ensures the given icon URL is formatted as a 256x256 PNG Uint8Array.
 * If needed, loads the image and resizes it using a Canvas element.
 */
const ensure256x256PngBytes = async (iconUrl: string): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }
                ctx.drawImage(img, 0, 0, 256, 256);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUriToBytes(dataUrl));
            } catch (err) {
                console.error("Error resizing icon to 256x256:", err);
                resolve(null);
            }
        };
        img.onerror = () => {
            console.error("Error loading icon image:", iconUrl);
            resolve(null);
        };
        img.src = iconUrl;
    });
};

/**
 * Searches for occurrences of the padded 120,000-byte PNG icon inside the Go webview_stub.exe
 * and replaces them with the custom user PNG icon, padding with zeros.
 */
const replacePaddedIcon = (exeBytes: Uint8Array, customPngBytes: Uint8Array): Uint8Array => {
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 1, 0, 0, 0, 1, 0, 8, 6, 0, 0, 0, 92, 114, 168]);
    const targetLength = 120000;

    // Create a copy of the executable bytes
    const resultBytes = new Uint8Array(exeBytes);

    let replacedCount = 0;
    for (let i = 0; i <= resultBytes.length - targetLength; i++) {
        let isMatch = true;
        for (let j = 0; j < signature.length; j++) {
            if (resultBytes[i + j] !== signature[j]) {
                isMatch = false;
                break;
            }
        }

        if (isMatch) {
            console.log(`Patching embedded PE icon resource at offset ${i}...`);
            // Overwrite with customPngBytes, padded with zeros
            const bytesToCopy = Math.min(customPngBytes.length, targetLength);
            resultBytes.fill(0, i, i + targetLength);
            resultBytes.set(customPngBytes.subarray(0, bytesToCopy), i);

            // Skip the rest of this block
            i += targetLength - 1;
            replacedCount++;
        }
    }

    console.log(`PE Icon patching complete. Replaced ${replacedCount} instances.`);
    return resultBytes;
};

/**
 * Generates a 100% native Windows Standalone Game (.EXE) directly.
 * Dynamically bundles and injects the standalone HTML5 engine code into a precompiled Go Win32 WebView2 loader.
 * If compilation fails, it falls back to generating a full Go development workspace ZIP package.
 */
export const createWindowsPackage = async (
    title: string,
    htmlContent: string,
    iconUrl?: string | null
): Promise<Blob> => {
    // 1. Set up icon files first so they are available for both direct compilation and zip fallback
    let iconPngBytes: Uint8Array | null = null;
    let iconIcoBytes: Uint8Array | null = null;

    if (iconUrl) {
        iconPngBytes = await ensure256x256PngBytes(iconUrl);
        if (iconPngBytes) {
            try {
                iconIcoBytes = pngToIco(iconPngBytes);
            } catch (err) {
                console.error("Error creating ICO icon:", err);
            }
        }
    }

    // 2. Default Canvas Icon (if no custom icon exists, generate a beautiful Retro N-shaped icon)
    if (!iconPngBytes) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Background
                ctx.fillStyle = '#1e293b'; // slate-800
                ctx.fillRect(0, 0, 256, 256);

                // Border
                ctx.strokeStyle = '#3b82f6'; // blue-500
                ctx.lineWidth = 12;
                ctx.strokeRect(6, 6, 244, 244);

                // Game Controller D-pad & buttons style
                ctx.fillStyle = '#ef4444'; // red-500
                ctx.beginPath();
                ctx.arc(180, 150, 24, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#eab308'; // yellow-500
                ctx.beginPath();
                ctx.arc(130, 180, 18, 0, Math.PI * 2);
                ctx.fill();

                // Retro N logo
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 120px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('N', 80, 110);
            }
            const dataUrl = canvas.toDataURL('image/png');
            iconPngBytes = dataUriToBytes(dataUrl);
            if (iconPngBytes) {
                iconIcoBytes = pngToIco(iconPngBytes);
            }
        } catch (e) {
            console.error("Failed to generate default canvas icon:", e);
        }
    }

    try {
        console.log("Attempting direct 100% native Windows EXE compilation...");
        const response = await fetch('/stubs/webview_stub.exe');
        if (!response.ok) {
            throw new Error(`Failed to load native Windows compiler stub: ${response.statusText}`);
        }

        const stubBuffer = await response.arrayBuffer();
        let stubBytes = new Uint8Array(stubBuffer) as any;

        // Patch the embedded PNG icon inside the webview_stub.exe if we have a custom/default icon!
        if (iconPngBytes) {
            stubBytes = replacePaddedIcon(stubBytes, iconPngBytes);
        }

        const encoder = new TextEncoder();
        const startMarkerBytes = encoder.encode("__GAME_HTML_START_MARKER__");
        const htmlBytes = encoder.encode(htmlContent);
        const endMarkerBytes = encoder.encode("__GAME_HTML_END_MARKER__");

        // Prepare icon markers and bytes
        const startIconMarkerBytes = encoder.encode("__GAME_ICON_START_MARKER__");
        const endIconMarkerBytes = encoder.encode("__GAME_ICON_END_MARKER__");
        const icoBytes = iconIcoBytes || new Uint8Array(0);

        // Concatenate buffers
        const finalLength =
            stubBytes.length +
            startMarkerBytes.length + htmlBytes.length + endMarkerBytes.length +
            startIconMarkerBytes.length + icoBytes.length + endIconMarkerBytes.length;
        const finalBytes = new Uint8Array(finalLength);

        let offset = 0;
        finalBytes.set(stubBytes, offset); offset += stubBytes.length;
        finalBytes.set(startMarkerBytes, offset); offset += startMarkerBytes.length;
        finalBytes.set(htmlBytes, offset); offset += htmlBytes.length;
        finalBytes.set(endMarkerBytes, offset); offset += endMarkerBytes.length;

        // Embed custom/default icon bytes as well
        finalBytes.set(startIconMarkerBytes, offset); offset += startIconMarkerBytes.length;
        finalBytes.set(icoBytes, offset); offset += icoBytes.length;
        finalBytes.set(endIconMarkerBytes, offset); offset += endIconMarkerMarkerBytesLength(endIconMarkerBytes);

        function endIconMarkerMarkerBytesLength(arr: Uint8Array) {
            return arr.length;
        }

        console.log("Real native Windows EXE compiled successfully with custom embedded icon!", finalLength, "bytes");
        return new Blob([finalBytes], { type: 'application/octet-stream' });
    } catch (err) {
        console.warn("Direct EXE compilation failed, falling back to Go project workspace template:", err);
    }

    const zip = new JSZip();
    const safeTitle = title.trim();
    const safeTitleSlug = safeTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');

    // Write icon files into zip
    if (iconPngBytes) {
        zip.file("icon.png", iconPngBytes);
    }
    if (iconIcoBytes) {
        zip.file("icon.ico", iconIcoBytes);
    }

    // 3. main.go (Native Go Entry Point using Webview2)
    const mainGo = `package main

import (
	"embed"
	"fmt"
	"mime"
	"net"
	"net/http"
	"strings"

	"github.com/jchv/go-webview2"
)

//go:embed index.html
var indexHTML string

func main() {
	// Find an available port dynamically to run a super lightweight local context
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	url := fmt.Sprintf("http://127.0.0.1:%d/", port)

	// Light in-memory file handler to serve the fully-embedded game bundle
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Write([]byte(indexHTML))
	})

	// Run internal HTTP server in a separate background routine
	go http.Serve(listener, nil)

	// Create native MS WebView2 window bindings
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		Autofocus: true,
		WindowOptions: webview2.WindowOptions{
			Title:  ${JSON.stringify(safeTitle)},
			Width:  960,
			Height: 720,
			IconId: 1, // Automatically links compiled native icon resource from .syso
		},
	})
	if w == nil {
		panic("Failed to initialize native Win32 WebView2 context. Please make sure WebView2 is installed on your system.")
	}
	defer w.Destroy()

	w.SetSize(960, 720, webview2.HintNone)
	w.Navigate(url)
	w.Run()
}
`;
    zip.file("main.go", mainGo);

    // 4. go.mod
    const goMod = `module nor-maker-game

go 1.18

require github.com/jchv/go-webview2 v0.0.0-20230830225952-16b4c33c3e6b

require (
	github.com/jchv/go-winloader v0.0.0-20210711075923-1d615467e3e4 // indirect
	golang.org/x/sys v0.11.0 // indirect
)
`;
    zip.file("go.mod", goMod);

    // 5. winres/winres.json (Windows Resource compiler spec for icons and file metadata)
    const winresJson = {
        "RT_GROUP_ICON": {
            "APP_ICON": {
                "0000": [
                    "icon.ico"
                ]
            }
        },
        "RT_VERSION": {
            "#1": {
                "0000": {
                    "fixed": {
                        "file_version": "1.0.0.0",
                        "product_version": "1.0.0.0"
                    },
                    "info": {
                        "CompanyName": "NOR Maker Standalone",
                        "FileDescription": `${safeTitle} Native Windows Game`,
                        "FileVersion": "1.0.0",
                        "InternalName": safeTitleSlug,
                        "LegalCopyright": `Copyright © ${new Date().getFullYear()} ${safeTitle}. All rights reserved.`,
                        "OriginalFilename": `${safeTitleSlug}.exe`,
                        "ProductName": safeTitle,
                        "ProductVersion": "1.0.0"
                    }
                }
            }
        }
    };
    zip.file("winres/winres.json", JSON.stringify(winresJson, null, 2));

    // Move a copy of icon.ico inside winres folder for go-winres tool compilation
    if (iconIcoBytes) {
        zip.file("winres/icon.ico", iconIcoBytes);
    }

    // 6. Standalone index.html game bundle (fully single-file packed)
    zip.file("index.html", htmlContent);

    // 7. run_game_local.bat (Local instant runner/tester)
    const runGameBat = `@echo off
title Running Native Game: ${safeTitle}
echo =======================================================================
echo   NOR Maker - Running Native Standalone Game (Go + WebView2)
echo =======================================================================
echo.
echo [1/2] Checking Go runtime installation...
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Go compiler runtime is required to run the game from source.
    echo Please install Go from https://go.dev/dl/ and try again.
    echo.
    pause
    exit /b
)

echo [2/2] Fetching native win32 webview bindings and running...
go run .
if %errorlevel% neq 0 (
    echo [ERROR] Game runtime exited with error code %errorlevel%
    pause
)
`;
    zip.file("run_game_local.bat", runGameBat);

    // 8. compile_to_windows_exe.bat (Production native compiler - pure Win32 EXE)
    const compileToWindowsBat = `@echo off
title Compiling Standalone Windows Game: ${safeTitle}
echo =======================================================================
echo   NOR Maker - Compiling 100%% Native Windows Standalone Game (.EXE)
echo =======================================================================
echo.
echo [1/4] Checking Go runtime installation...
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Go compiler is required to package your game as a native executable.
    echo Please download and install Go from: https://go.dev/dl/
    echo.
    pause
    exit /b
)

echo [2/4] Downloading native resource packaging tool (go-winres)...
go install github.com/tc-hib/go-winres@latest
if %errorlevel% neq 0 (
    echo [WARNING] Failed to install go-winres. Falling back to build without icon.
) else (
    echo [3/4] Packaging custom game icon and metadata properties into Windows resources...
    %USERPROFILE%\\go\\bin\\go-winres make
)

echo.
echo [4/4] Building optimized standalone Win32 binary...
echo Subsystem flags active: -H=windowsgui (Hides black CMD window completely!)
echo Stripping debug symbols to compress binary size...
echo.

go build -ldflags "-H=windowsgui -s -w" -o "${safeTitle}.exe"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Compilation failed. Please check the compiler errors above.
    pause
    exit /b
)

echo.
echo =======================================================================
echo   NATIVE WIN32 EXECUTABLE COMPILED SUCCESSFULLY!
echo =======================================================================
echo.
echo   Your native game file is ready:
echo   - "${safeTitle}.exe" (Size: ~1.5 MB, Native Single Binary)
echo.
echo   This file runs instantly with ZERO folders, ZERO folders dependency,
echo   and ZERO installers. It has custom high-res icons and launches directly!
echo.
echo =======================================================================
pause
`;
    zip.file("compile_to_windows_exe.bat", compileToWindowsBat);

    // 9. README.txt
    const readme = `NATIVE WINDOWS GAME PACKAGE FOR: ${safeTitle} (Go + WebView2 Engine)
========================================================================
This workspace compiles your game into a true, professional, lightweight,
and single-file native Windows Executable (.EXE) with NO console windows
(Subsystem GUI enabled), customized with your game's logo, title, and metadata.

ADVANTAGES OVER ELECTRON:
------------------------------------------------------------------------
- Native executable size is ~1.5 MB (Electron is 150MB+).
- Single-file binary: All assets (index.html, CSS, JS, textures, audios) are compiled
  directly inside the EXE. You can share just the .EXE file and it runs everywhere!
- Loads instantly, with ultra-low memory consumption.
- Fully native window management using Win32 API.

HOW TO RUN & BUILD:
------------------------------------------------------------------------
To run or build the game, you need the Go Compiler installed.
Download and install Go from: https://go.dev/dl/

1. TO RUN & TEST INSTANTLY:
   Double-click "run_game_local.bat".

2. TO COMPILE PROFESSIONAL NATIVE WINDOWS EXECUTABLES (.EXE):
   Double-click "compile_to_windows_exe.bat".
   The script will package your icon.ico into the program's resource header,
   strip debug symbols, configure the -H=windowsgui subsystem to prevent CMD popping up,
   and output a beautiful standalone executable: "${safeTitle}.exe".

========================================================================
صناعة وتصدير ألعاب ويندوز نيتيڤ متكاملة: ${safeTitle} (Go + WebView2 Engine)
========================================================================
هذا المشروع مصمم لإنتاج لعبة ويندوز حقيقية نيتيڤ (.EXE) مدمجة بالكامل في ملف واحد،
خفيفة وسريعة وبدون ظهور أي شاشات أوامر كونسول سوداء (Subsystem GUI مفعل تلقائياً).

مميزات هذا المصدر عن Electron والمحاكيات:
------------------------------------------------------------------------
- حجم اللعبة النهائي 1.5 ميجابايت فقط! (بينما Electron يتعدى 150 ميجابايت).
- ملف تشغيلي واحد مستقل: يتم دمج جميع الأصول والمؤثرات الصوتية والرسوميات
  داخل ملف الـ EXE نفسه. يمكنك إرسال ملف الـ EXE لأصدقائك وسيعمل لديهم فوراً!
- تشغيل فوري وسريع مع استهلاك منخفض جداً لموارد كرت الشاشة والذاكرة العشوائية.
- استخدام نظام Win32 API الرسمي لعرض النوافذ والتحكم بها.

طريقة التجربة وبناء اللعبة:
------------------------------------------------------------------------
لبناء اللعبة وتجربتها، تحتاج فقط لتثبيت لغة Go على جهازك (مجانية ومفتوحة المصدر).
حمّلها وثبّتها من الموقع الرسمي: https://go.dev/dl/

1. لتشغيل اللعبة وتجربتها فوراً:
   اضغط مرتين على ملف "run_game_local.bat".

2. لبناء ملف اللعبة النهائي (.EXE) بأيقونتك الخاصة:
   اضغط مرتين على ملف "compile_to_windows_exe.bat".
   سيقوم النظام بدمج أيقونة اللعبة (icon.ico) داخل خصائص البرنامج، وضغط الكود،
   وتفعيل بارامتر "-H=windowsgui" لمنع ظهور الشاشة السوداء، لينتج لك ملف تشغيل مستقل
   ورائع يحمل اسم اللعبة وأيقونتها باسم: "${safeTitle}.exe".
`;
    zip.file("README.txt", readme);

    return await zip.generateAsync({ type: "blob" });
};
