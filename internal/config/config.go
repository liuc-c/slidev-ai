package config

import (
	"encoding/json"
	"os"
	"sync"
)

type AIConfig struct {
	Provider string `json:"provider"` // "openai", "openai-compatible", "google", "anthropic"
	APIKey   string `json:"apiKey"`
	BaseURL  string `json:"baseUrl"`
	Model    string `json:"model"`
}

// PromptStyle represents a presentation generation style with customizable prompts
type PromptStyle struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Icon          string `json:"icon"`
	Description   string `json:"description"`
	OutlinePrompt string `json:"outlinePrompt"`
	SlidePrompt   string `json:"slidePrompt"`
	IsBuiltin     bool   `json:"isBuiltin"` // Builtin styles cannot be deleted but can be edited
}

// PromptConfig stores the user's prompt style preferences
type PromptConfig struct {
	SelectedStyleID string        `json:"selectedStyleId"` // Currently selected style ID
	CustomStyles    []PromptStyle `json:"customStyles"`    // User-defined + edited builtin styles
}

type Config struct {
	AI      AIConfig     `json:"ai"`
	Prompts PromptConfig `json:"prompts"`
}

var (
	currentConfig Config
	mutex         sync.RWMutex
	configPath    = "config.json"
)

func Load() (*Config, error) {
	mutex.Lock()
	defer mutex.Unlock()

	data, err := os.ReadFile(configPath)
	if os.IsNotExist(err) {
		// Default config
		currentConfig = Config{
			AI: AIConfig{
				Provider: "ollama",
				BaseURL:  "http://localhost:11434/v1",
				Model:    "llama3",
			},
		}
		return &currentConfig, nil
	}
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(data, &currentConfig); err != nil {
		return nil, err
	}

	return &currentConfig, nil
}

func Save(cfg Config) error {
	mutex.Lock()
	defer mutex.Unlock()

	currentConfig = cfg
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}

func Get() Config {
	mutex.RLock()
	defer mutex.RUnlock()
	return currentConfig
}
