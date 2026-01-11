package ai

import (
	"context"
	"encoding/json"
	"fmt"

	openai "github.com/sashabaranov/go-openai"
	"slidev-studio-ai/internal/config"
	"slidev-studio-ai/internal/slidev"
)

// Service provides AI-powered features for slide generation
type Service struct {
	tools *slidev.Tools
}

func NewService(tools *slidev.Tools) *Service {
	return &Service{
		tools: tools,
	}
}

// OutlineItem represents a node in the presentation outline
type OutlineItem struct {
	ID       string         `json:"id"`
	Title    string         `json:"title"`
	Type     string         `json:"type"` // primary, secondary
	Children []OutlineChild `json:"children"`
}

type OutlineChild struct {
	Label string `json:"label"`
	Type  string `json:"type"` // detail, content
}

// GenerateOutline calls the AI to generate a structured outline
func (s *Service) GenerateOutline(topic string) ([]OutlineItem, error) {
	cfg := config.Get().AI
	clientConfig := openai.DefaultConfig(cfg.APIKey)
	if cfg.BaseURL != "" {
		clientConfig.BaseURL = cfg.BaseURL
	}
	client := openai.NewClientWithConfig(clientConfig)

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: OutlinePrompt,
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: "Topic: " + topic,
		},
	}

	resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model:    cfg.Model,
		Messages: messages,
	})

	if err != nil {
		return nil, err
	}

	content := resp.Choices[0].Message.Content
	// Simple cleanup if AI wraps in markdown block
	if len(content) > 3 && content[:3] == "```" {
		// Find start and end of JSON
		start := 0
		for i, c := range content {
			if c == '[' {
				start = i
				break
			}
		}
		end := len(content)
		for i := len(content) - 1; i >= 0; i-- {
			if content[i] == ']' {
				end = i + 1
				break
			}
		}
		if start < end {
			content = content[start:end]
		}
	}

	var outline []OutlineItem
	if err := json.Unmarshal([]byte(content), &outline); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %v, content: %s", err, content)
	}

	return outline, nil
}

// GenerateSlides calls the AI to generate markdown content from the outline
func (s *Service) GenerateSlides(outline []OutlineItem) (string, error) {
	cfg := config.Get().AI
	clientConfig := openai.DefaultConfig(cfg.APIKey)
	if cfg.BaseURL != "" {
		clientConfig.BaseURL = cfg.BaseURL
	}
	client := openai.NewClientWithConfig(clientConfig)

	outlineBytes, _ := json.MarshalIndent(outline, "", "  ")

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: SlidePrompt,
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: string(outlineBytes),
		},
	}

	resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model:    cfg.Model,
		Messages: messages,
	})

	if err != nil {
		return "", err
	}

	content := resp.Choices[0].Message.Content
	// Strip markdown block if present
	if len(content) > 3 && content[:3] == "```" {
		// remove first line
		if idx := 3; idx < len(content) {
			// skip lang id if present
			for idx < len(content) && content[idx] != '\n' {
				idx++
			}
			content = content[idx+1:]
		}
		// remove last line
		if len(content) > 3 && content[len(content)-3:] == "```" {
			content = content[:len(content)-3]
		}
	}

	return content, nil
}
