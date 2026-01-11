package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"slidev-studio-ai/internal/config"
	"slidev-studio-ai/internal/slidev"
	"slidev-studio-ai/internal/updater"
)

// App struct
type App struct {
	ctx          context.Context
	tools        *slidev.Tools
	slidevServer *slidev.Server
	version      string
}

// NewApp creates a new App application struct
func NewApp(version string) *App {
	// Initialize config
	_, _ = config.Load()

	// Initialize Slidev Tools in current directory for now
	cwd, _ := os.Getwd()
	tools := slidev.NewTools(cwd)

	return &App{
		tools:        tools,
		slidevServer: slidev.NewServer(),
		version:      version,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Create default deck if not exists
	if _, err := os.Stat(filepath.Join(a.tools.WorkingDir, "slides.md")); os.IsNotExist(err) {
		a.tools.CreateDeck("Slidev Studio AI", "seriph")
	}
}

// StartSlidevServer starts the slidev server and returns the URL
func (a *App) StartSlidevServer() (string, error) {
	return a.slidevServer.Start(a.tools.WorkingDir)
}

// GetSlidevUrl returns the running slidev server URL
func (a *App) GetSlidevUrl() string {
	return a.slidevServer.GetURL()
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// SaveSettings saves the AI configuration
func (a *App) SaveSettings(cfg config.Config) error {
	return config.Save(cfg)
}

// GetSettings returns the current AI configuration
func (a *App) GetSettings() config.Config {
	return config.Get()
}

// ListProjects returns a list of local projects
func (a *App) ListProjects() []slidev.Project {
	projects, err := a.tools.ListProjects()
	if err != nil {
		fmt.Printf("Error listing projects: %v\n", err)
		return []slidev.Project{}
	}
	return projects
}

// CreateProject creates a new project file
func (a *App) CreateProject(name string) error {
	return a.tools.CreateProject(name)
}

// ReadSlides reads the content of slides.md
func (a *App) ReadSlides() (string, error) {
	return a.tools.ReadSlides()
}

// SaveSlides saves content to slides.md
func (a *App) SaveSlides(content string) error {
	return a.tools.SaveSlides("slides.md", content)
}

// UpdatePage updates a specific slide page content (Tool Call from AI)
func (a *App) UpdatePage(pageIndex int, markdown string) error {
	return a.tools.UpdatePage(pageIndex, markdown)
}

// InsertPage inserts a new slide after a specific index (Tool Call from AI)
func (a *App) InsertPage(afterIndex int, layout string) error {
	return a.tools.InsertPage(afterIndex, layout)
}

// ApplyTheme applies a global theme to the presentation (Tool Call from AI)
func (a *App) ApplyTheme(themeName string) error {
	return a.tools.ApplyGlobalTheme(themeName)
}

// CheckForUpdates checks if there is a new version available
func (a *App) CheckForUpdates() (*updater.UpdateInfo, error) {
	// TODO: Replace with actual owner/repo
	return updater.CheckForUpdates(a.version, "slidev-studio-ai", "slidev-studio-ai")
}

// shutdown is called when the app terminates
func (a *App) shutdown(ctx context.Context) {
	if a.slidevServer != nil {
		_ = a.slidevServer.Stop()
	}
}
