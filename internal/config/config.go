package config

import (
	"encoding/json"
	"os"
	"sync"
)

type AIConfig struct {
	Provider string `json:"provider"` // "openai", "deepseek", "ollama"
	APIKey   string `json:"apiKey"`
	BaseURL  string `json:"baseUrl"`
	Model    string `json:"model"`
}

type Config struct {
	AI AIConfig `json:"ai"`
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
