package slidev

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"regexp"
	"runtime"
	"sync"
)

type Server struct {
	cmd     *exec.Cmd
	url     string
	running bool
	mu      sync.Mutex
	cancel  context.CancelFunc
}

func NewServer() *Server {
	return &Server{}
}

// Start starts the slidev server in the given directory
func (s *Server) Start(dir string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return s.url, nil
	}

	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel

	// Use npx to run slidev.
	// We use a specific port range or let it pick.
	// For simplicity, let's try to let it pick or specify one.
	// But to capture the port, we need to read stdout.
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd", "/C", "npx", "slidev", "--open", "false")
		cmd.SysProcAttr = getSysProcAttr()
	} else {
		cmd = exec.CommandContext(ctx, "npx", "slidev", "--open", "false")
	}
	cmd.Dir = dir

	// Prepare to read stdout/stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", err
	}
	// stderr, _ := cmd.StderrPipe() // Optional: capture stderr for debugging

	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("failed to start slidev: %w", err)
	}

	s.cmd = cmd

	// Scan for URL
	scanner := bufio.NewScanner(stdout)
	ready := make(chan string)
	errChan := make(chan error)

	go func() {
		defer close(ready)
		defer close(errChan)

		// Regex to find http://localhost:PORT
		// Slidev output example: "  > Local:    http://localhost:3030/"
		re := regexp.MustCompile(`http://localhost:(\d+)`)

		for scanner.Scan() {
			line := scanner.Text()
			// fmt.Println("[Slidev]", line) // For debug

			if matches := re.FindStringSubmatch(line); len(matches) > 1 {
				port := matches[1]
				ready <- "http://localhost:" + port
				return
			}
		}
		if err := scanner.Err(); err != nil {
			errChan <- err
		}
	}()

	select {
	case url := <-ready:
		if url == "" {
			// Process might have exited or failed to output URL
			_ = s.Stop()
			return "", fmt.Errorf("slidev started but failed to detect URL")
		}
		s.url = url
		s.running = true
		return url, nil
	case err := <-errChan:
		_ = s.Stop()
		return "", fmt.Errorf("error reading slidev output: %w", err)
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

func (s *Server) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cancel != nil {
		s.cancel()
	}
	s.running = false
	s.url = ""
	return nil
}

func (s *Server) GetURL() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.url
}
