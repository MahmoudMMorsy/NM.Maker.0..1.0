package main

import (
	"bytes"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"syscall"
	"unsafe"

	"github.com/jchv/go-webview2"
)

const (
	startMarker     = "__GAME_HTML_START_MARKER__"
	endMarker       = "__GAME_HTML_END_MARKER__"
	iconStartMarker = "__GAME_ICON_START_MARKER__"
	iconEndMarker   = "__GAME_ICON_END_MARKER__"
)

func extractTitle(html string) string {
	start := strings.Index(strings.ToLower(html), "<title>")
	if start != -1 {
		end := strings.Index(strings.ToLower(html[start:]), "</title>")
		if end != -1 {
			return html[start+7 : start+end]
		}
	}
	return "Game Runner"
}

func main() {
	// 1. Get current executable path
	exePath, err := os.Executable()
	if err != nil {
		panic(fmt.Sprintf("Failed to get executable path: %v", err))
	}

	// 2. Open ourself
	file, err := os.Open(exePath)
	if err != nil {
		panic(fmt.Sprintf("Failed to open executable: %v", err))
	}
	defer file.Close()

	// Read entire executable bytes
	content, err := io.ReadAll(file)
	if err != nil {
		panic(fmt.Sprintf("Failed to read executable: %v", err))
	}

	// Find icon bytes if embedded
	var iconBytes []byte
	iconStartIdx := bytes.Index(content, []byte(iconStartMarker))
	if iconStartIdx != -1 {
		iconEndIdx := bytes.Index(content, []byte(iconEndMarker))
		if iconEndIdx != -1 && iconEndIdx > iconStartIdx {
			iconBytes = content[iconStartIdx+len(iconStartMarker) : iconEndIdx]
		}
	}

	var tempIconPath string
	if len(iconBytes) > 0 {
		tempFile, err := os.CreateTemp("", "game_icon_*.ico")
		if err == nil {
			tempFile.Write(iconBytes)
			tempFile.Close()
			tempIconPath = tempFile.Name()
			defer os.Remove(tempIconPath)
		}
	}

	// 3. Find HTML markers
	startIdx := bytes.Index(content, []byte(startMarker))
	if startIdx == -1 {
		// Fallback for development: if no marker, try to look for index.html in the same directory
		devHTML, err := os.ReadFile("index.html")
		if err == nil {
			runApp(string(devHTML), tempIconPath)
			return
		}
		panic("Invalid executable format: No embedded game content found.")
	}

	endIdx := bytes.Index(content, []byte(endMarker))
	if endIdx == -1 || endIdx <= startIdx {
		panic("Invalid executable format: Corrupted embedded game content.")
	}

	// Extract the HTML content
	htmlContent := string(content[startIdx+len(startMarker) : endIdx])

	runApp(htmlContent, tempIconPath)
}

func setWindowIcon(hwnd uintptr, iconPath string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	sendMessageW := user32.NewProc("SendMessageW")
	loadImageW := user32.NewProc("LoadImageW")

	pathPtr, err := syscall.UTF16PtrFromString(iconPath)
	if err != nil {
		return
	}

	// IMAGE_ICON = 1, LR_LOADFROMFILE = 0x00000010
	hIcon, _, _ := loadImageW.Call(
		0,
		uintptr(unsafe.Pointer(pathPtr)),
		1, // IMAGE_ICON
		0, 0,
		0x00000010, // LR_LOADFROMFILE
	)
	if hIcon != 0 {
		// WM_SETICON = 0x0080, ICON_SMALL = 0, ICON_BIG = 1
		sendMessageW.Call(hwnd, 0x0080, 0, hIcon) // Small icon
		sendMessageW.Call(hwnd, 0x0080, 1, hIcon) // Big icon
	}
}

func makeFullscreen(hwnd uintptr) (int, int) {
	user32 := syscall.NewLazyDLL("user32.dll")
	getSystemMetrics := user32.NewProc("GetSystemMetrics")
	setWindowLongW := user32.NewProc("SetWindowLongW")
	setWindowPos := user32.NewProc("SetWindowPos")

	// Get screen width and height
	// SM_CXSCREEN = 0, SM_CYSCREEN = 1
	wRes, _, _ := getSystemMetrics.Call(0)
	hRes, _, _ := getSystemMetrics.Call(1)

	width := int(wRes)
	height := int(hRes)

	// GWL_STYLE = -16
	// WS_POPUP = 0x80000000, WS_VISIBLE = 0x10000000
	gwlStyle := int32(-16)
	setWindowLongW.Call(hwnd, uintptr(gwlStyle), 0x80000000|0x10000000)

	// SWP_FRAMECHANGED = 0x0020
	// HWND_TOP = 0
	setWindowPos.Call(hwnd, 0, 0, 0, wRes, hRes, 0x0020)

	return width, height
}

func runApp(htmlContent string, iconPath string) {
	// Find available port dynamically
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	url := fmt.Sprintf("http://127.0.0.1:%d/", port)

	// In-memory file handler to serve the fully-embedded game bundle
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Write([]byte(htmlContent))
	})

	// Run internal HTTP server in background
	go http.Serve(listener, nil)

	title := extractTitle(htmlContent)

	// Create native WebView2 window
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		WindowOptions: webview2.WindowOptions{
			Title:  title,
			Width:  1024,
			Height: 768,
		},
	})
	if w == nil {
		panic("Failed to initialize native Win32 WebView2 context. Please make sure WebView2 is installed on your system.")
	}
	defer w.Destroy()

	// Apply custom icon if set
	if iconPath != "" {
		setWindowIcon(uintptr(w.Window()), iconPath)
	}

	// Make window fullscreen by default
	width, height := makeFullscreen(uintptr(w.Window()))

	w.SetSize(width, height, webview2.HintNone)
	w.Navigate(url)
	w.Run()
}
