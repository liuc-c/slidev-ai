package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	openai "github.com/sashabaranov/go-openai"
	"slidev-studio-ai/internal/config"
	"slidev-studio-ai/internal/slidev"
)

type Service struct {
	server *echo.Echo
	tools  *slidev.Tools
	port   string
}

func NewService(tools *slidev.Tools) *Service {
	e := echo.New()
	e.Use(middleware.CORS())
	// e.Use(middleware.Logger()) // Disable logger for cleaner output in production
	e.Use(middleware.Recover())

	s := &Service{
		server: e,
		tools:  tools,
	}

	e.POST("/api/chat", s.handleChat)
	return s
}

func (s *Service) StartInBackground() (string, error) {
	ln, err := net.Listen("tcp", ":0")
	if err != nil {
		return "", err
	}

	s.server.Listener = ln
	port := ln.Addr().(*net.TCPAddr).Port
	s.port = fmt.Sprintf("%d", port)

	go func() {
		s.server.Start("")
	}()

	return s.port, nil
}

type ChatRequest struct {
	Messages []openai.ChatCompletionMessage `json:"messages"`
}

func (s *Service) handleChat(c echo.Context) error {
	var req ChatRequest
	if err := c.Bind(&req); err != nil {
		return err
	}

	cfg := config.Get().AI

	clientConfig := openai.DefaultConfig(cfg.APIKey)
	if cfg.BaseURL != "" {
		clientConfig.BaseURL = cfg.BaseURL
	}
	client := openai.NewClientWithConfig(clientConfig)

	tools := []openai.Tool{
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "update_page",
				Description: "Update the content of a specific slide page",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {
						"pageIndex": { "type": "integer", "description": "The index of the slide (0-based)" },
						"markdown": { "type": "string", "description": "The new markdown content for the slide" }
					},
					"required": ["pageIndex", "markdown"]
				}`),
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "insert_page",
				Description: "Insert a new slide page after a specific index",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {
						"afterIndex": { "type": "integer", "description": "The index to insert after" },
						"layout": { "type": "string", "description": "The layout type (default, section, etc.)" }
					},
					"required": ["afterIndex", "layout"]
				}`),
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "apply_theme",
				Description: "Apply a global theme to the presentation",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {
						"themeName": { "type": "string", "description": "The name of the theme" }
					},
					"required": ["themeName"]
				}`),
			},
		},
	}

	messages := req.Messages
	ctx := context.Background()

	// Step 1: Check if we need to call tools (non-streaming)
	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:    cfg.Model,
		Messages: messages,
		Tools:    tools,
	})

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	msg := resp.Choices[0].Message

	// If Tool Calls present
	if len(msg.ToolCalls) > 0 {
		messages = append(messages, msg)

		for _, toolCall := range msg.ToolCalls {
			var result string
			var err error

			switch toolCall.Function.Name {
			case "update_page":
				var args struct {
					PageIndex int    `json:"pageIndex"`
					Markdown  string `json:"markdown"`
				}
				json.Unmarshal([]byte(toolCall.Function.Arguments), &args)
				err = s.tools.UpdatePage(args.PageIndex, args.Markdown)
				result = "Page updated successfully."
			case "insert_page":
				var args struct {
					AfterIndex int    `json:"afterIndex"`
					Layout     string `json:"layout"`
				}
				json.Unmarshal([]byte(toolCall.Function.Arguments), &args)
				err = s.tools.InsertPage(args.AfterIndex, args.Layout)
				result = "Page inserted successfully."
			case "apply_theme":
				var args struct {
					ThemeName string `json:"themeName"`
				}
				json.Unmarshal([]byte(toolCall.Function.Arguments), &args)
				err = s.tools.ApplyGlobalTheme(args.ThemeName)
				result = "Theme applied."
			default:
				result = "Unknown tool"
			}

			if err != nil {
				result = "Error: " + err.Error()
			}

			messages = append(messages, openai.ChatCompletionMessage{
				Role:       openai.ChatMessageRoleTool,
				Content:    result,
				ToolCallID: toolCall.ID,
			})
		}

		// Step 2: Stream the final response
		stream, err := client.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
			Model:    cfg.Model,
			Messages: messages,
			Stream:   true,
		})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		defer stream.Close()

		c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextPlain)
		c.Response().WriteHeader(http.StatusOK)

		for {
			response, err := stream.Recv()
			if err == io.EOF {
				break
			}
			if err != nil {
				break
			}

			content := response.Choices[0].Delta.Content
			if content != "" {
				c.Response().Write([]byte(content))
				c.Response().Flush()
			}
		}
		return nil

	} else {
		// No tool calls, just return content
		c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextPlain)
		return c.String(http.StatusOK, msg.Content)
	}
}
