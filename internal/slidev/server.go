package slidev

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"time"
)

type Server struct {
	cmd        *exec.Cmd
	url        string
	running    bool
	mu         sync.Mutex
	cancel     context.CancelFunc
	generation int
}

func NewServer() *Server {
	return &Server{}
}

// Start starts the slidev server in the given directory
func (s *Server) Start(dir string) (string, error) {
	s.mu.Lock()
	if s.running {
		url := s.url
		s.mu.Unlock()
		return url, nil
	}
	s.generation++
	gen := s.generation
	s.mu.Unlock()

	ctx, cancel := context.WithCancel(context.Background())

	// Use npx to run slidev.
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd", "/C", "npx", "slidev", "--open", "false")
		cmd.SysProcAttr = getSysProcAttr()
	} else {
		cmd = exec.CommandContext(ctx, "npx", "slidev", "--open", "false")
		cmd.SysProcAttr = getSysProcAttr()
	}
	cmd.Dir = dir

	// Prepare to read stdout/stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return "", err
	}
	cmd.Stderr = cmd.Stdout // Redirect stderr to stdout to capture all output

	if err := cmd.Start(); err != nil {
		cancel()
		return "", fmt.Errorf("failed to start slidev: %w", err)
	}

	s.mu.Lock()
	s.cmd = cmd
	s.cancel = cancel
	s.mu.Unlock()

	// Scan for URL (buffered channels to prevent leaks)
	ready := make(chan string, 1)
	errChan := make(chan error, 1)

	// Track logs for debugging
	var logs []string
	var logsMu sync.Mutex

	go func() {
		re := regexp.MustCompile(`http://(?:localhost|127\.0\.0\.1):(\d+)`)
		ansiRe := regexp.MustCompile(`\x1b\[[0-9;]*[mK]`)

		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			cleanLine := ansiRe.ReplaceAllString(line, "")

			logsMu.Lock()
			if len(logs) > 30 {
				logs = logs[1:]
			}
			logs = append(logs, line)
			logsMu.Unlock()

			if matches := re.FindStringSubmatch(cleanLine); len(matches) > 1 {
				port := matches[1]
				ready <- "http://localhost:" + port
				// Drain the rest of the output in background
				go func() {
					for scanner.Scan() {
						// drain
					}
				}()
				return
			}
		}
		if err := scanner.Err(); err != nil {
			select {
			case errChan <- err:
			default:
			}
		}
	}()

	select {
	case url := <-ready:
		if url == "" {
			logsMu.Lock()
			lastLogs := strings.Join(logs, "\n")
			logsMu.Unlock()
			_ = s.Stop()
			return "", fmt.Errorf("slidev started but failed to detect URL. Last logs:\n%s", lastLogs)
		}

		s.mu.Lock()
		// Only update if no other operation (like Stop) happened
		if s.generation == gen {
			s.url = url
			s.running = true
		}
		s.mu.Unlock()
		return url, nil

	case err := <-errChan:
		_ = s.Stop()
		return "", fmt.Errorf("error reading slidev output: %w", err)

	case <-time.After(30 * time.Second):
		logsMu.Lock()
		lastLogs := strings.Join(logs, "\n")
		logsMu.Unlock()
		_ = s.Stop()
		return "", fmt.Errorf("timeout waiting for slidev to start. Last logs:\n%s", lastLogs)

	case <-ctx.Done():
		return "", ctx.Err()
	}
}

func (s *Server) Stop() error {
	s.mu.Lock()
	cancel := s.cancel
	cmd := s.cmd
	s.running = false
	s.url = ""
	s.generation++ // Invalidate any ongoing Start
	s.mu.Unlock()

	if cancel != nil {
		cancel()
	}

	// Reliable cleanup of process tree
	if cmd != nil && cmd.Process != nil {
		if runtime.GOOS == "windows" {
			_ = exec.Command("taskkill", "/F", "/T", "/PID", fmt.Sprintf("%d", cmd.Process.Pid)).Run()
		} else {
			// On Unix, we use negative PID to kill the process group
			_ = exec.Command("kill", "-9", fmt.Sprintf("-%d", cmd.Process.Pid)).Run()
		}
	}
	return nil
}

func (s *Server) GetURL() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.url
}
