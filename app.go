package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"slidev-studio-ai/internal/ai"
	"slidev-studio-ai/internal/config"
	"slidev-studio-ai/internal/slidev"
)

// App struct
type App struct {
	ctx       context.Context
	aiService *ai.Service
	tools     *slidev.Tools
	port      string
}

// NewApp creates a new App application struct
func NewApp() *App {
	// Initialize config
	_, _ = config.Load()

	// Initialize Slidev Tools in current directory for now
	cwd, _ := os.Getwd()
	tools := slidev.NewTools(cwd)

	// Initialize AI Service
	aiSvc := ai.NewService(tools)

	return &App{
		tools:     tools,
		aiService: aiSvc,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Start AI Server
	port, err := a.aiService.StartInBackground()
	if err != nil {
		fmt.Printf("Failed to start AI server: %v\n", err)
	} else {
		fmt.Printf("AI Server started on port %s\n", port)
		a.port = port
	}

	// Create default deck if not exists
	if _, err := os.Stat(filepath.Join(a.tools.WorkingDir, "slides.md")); os.IsNotExist(err) {
		a.tools.CreateDeck("Slidev Studio AI", "seriph")
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// GetServerPort returns the AI server port
func (a *App) GetServerPort() string {
	return a.port
}

// SaveSettings saves the AI configuration
func (a *App) SaveSettings(cfg config.Config) error {
	return config.Save(cfg)
}

// GetSettings returns the current AI configuration
func (a *App) GetSettings() config.Config {
	return config.Get()
}
