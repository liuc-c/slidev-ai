package updater

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"
)

type Release struct {
	TagName string  `json:"tag_name"`
	Assets  []Asset `json:"assets"`
	Body    string  `json:"body"`
	HTMLURL string  `json:"html_url"`
}

type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type UpdateInfo struct {
	Available   bool
	Version     string
	DownloadURL string
	ReleaseURL  string
	Body        string
}

// CheckForUpdates checks for updates on GitHub
func CheckForUpdates(currentVersion, repoOwner, repoName string) (*UpdateInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", repoOwner, repoName)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch release info: %s", resp.Status)
	}

	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	// Simple version comparison (string based for now, assuming vX.Y.Z)
	if release.TagName == currentVersion || release.TagName == "v"+currentVersion {
		return &UpdateInfo{Available: false}, nil
	}

	// Determine asset name based on OS
	var assetNamePattern string
	switch runtime.GOOS {
	case "windows":
		assetNamePattern = ".exe" // or setup.exe
	case "darwin":
		assetNamePattern = ".zip" // The CI builds a .zip of the .app bundle
	default:
		assetNamePattern = ".tar.gz"
	}

	var downloadURL string
	for _, asset := range release.Assets {
		if strings.Contains(strings.ToLower(asset.Name), assetNamePattern) {
			downloadURL = asset.BrowserDownloadURL
			break
		}
	}

	return &UpdateInfo{
		Available:   true,
		Version:     release.TagName,
		DownloadURL: downloadURL,
		ReleaseURL:  release.HTMLURL,
		Body:        release.Body,
	}, nil
}
