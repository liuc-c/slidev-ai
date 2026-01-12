package slidev

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Server struct {
	cmd           *exec.Cmd
	url           string
	running       bool
	starting      bool
	startCh       chan startResult
	mu            sync.Mutex
	cancel        context.CancelFunc
	generation    int
	port          int
	currentFile   string
	stdinW        *io.PipeWriter
	slidevNodePID int
}

type startResult struct {
	url string
	err error
}

func NewServer() *Server {
	return &Server{}
}

// getFreePort returns a free port to use
func getFreePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}
	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

// Start starts the slidev server in the given directory for a specific file
func (s *Server) Start(dir string, filename string) (string, error) {
	if filename == "" {
		filename = "slides.md"
	}

	s.mu.Lock()
	// If already running with same file, return URL
	if s.running && s.currentFile == filename {
		url := s.url
		s.mu.Unlock()
		return url, nil
	}
	// If there's a start in-flight for the same file, wait for it
	if s.starting && s.currentFile == filename && s.startCh != nil {
		ch := s.startCh
		s.mu.Unlock()
		res := <-ch
		return res.url, res.err
	}
	// If running or starting for a different file, stop first
	if s.running || s.starting {
		s.mu.Unlock()
		_ = s.Stop()
		s.mu.Lock()
	}

	s.generation++
	gen := s.generation
	s.starting = true
	s.currentFile = filename
	s.slidevNodePID = 0
	s.startCh = make(chan startResult, 1)
	s.mu.Unlock()

	// Get a free port
	port, err := getFreePort()
	if err != nil {
		port = 3030
	}

	ctx, cancel := context.WithCancel(context.Background())

	complete := func(url string, err error) {
		s.mu.Lock()
		if err == nil && s.generation == gen {
			s.url = url
			s.running = true
		}
		s.starting = false
		ch := s.startCh
		s.startCh = nil
		s.mu.Unlock()

		if ch != nil {
			ch <- startResult{url: url, err: err}
			close(ch)
		}
	}

	// Runtime detection for Slidev and Node
	nodeExe := "node"
	slidevBin := ""
	isProduction := false

	// Check for bundled resources (Production)
	exePath, _ := os.Executable()
	appDir := filepath.Dir(exePath)
	bundledResources := filepath.Join(appDir, "resources")

	// If resources folder exists, we assume production
	if _, err := os.Stat(bundledResources); err == nil {
		isProduction = true
		// Use bundled node if exists
		bundledNode := filepath.Join(bundledResources, "node", "node.exe")
		if _, err := os.Stat(bundledNode); err == nil {
			nodeExe = bundledNode
		}

		// Use bundled slidev from node_modules
		bundledSlidev := filepath.Join(bundledResources, "node_modules", "@slidev", "cli", "bin", "slidev.mjs")
		if _, err := os.Stat(bundledSlidev); err == nil {
			slidevBin = bundledSlidev
		}
	}

	// In production mode, we MUST have bundled resources - no fallback to npx
	if isProduction && slidevBin == "" {
		err := fmt.Errorf("production mode detected but bundled Slidev not found at %s. Please reinstall the application", filepath.Join(bundledResources, "node_modules", "@slidev", "cli", "bin", "slidev.mjs"))
		cancel()
		complete("", err)
		return "", err
	}

	portStr := strconv.Itoa(port)
	var cmd *exec.Cmd

	if slidevBin != "" {
		// Production: run node [slidev.mjs]
		args := []string{slidevBin, filename, "--port", portStr}
		fmt.Printf("Starting Bundled Slidev: %s %s\n", nodeExe, strings.Join(args, " "))
		cmd = exec.CommandContext(ctx, nodeExe, args...)
	} else {
		// Development: fallback to npx
		npxArgs := []string{"--yes", "@slidev/cli", filename, "--port", portStr}
		fmt.Printf("Starting Slidev via npx: npx %s\n", strings.Join(npxArgs, " "))
		cmd = exec.CommandContext(ctx, "npx", npxArgs...)
	}

	cmd.SysProcAttr = getSysProcAttr()
	cmd.Dir = dir

	// Keep stdin open; Slidev CLI may exit immediately if stdin is closed.
	stdinR, stdinW := io.Pipe()
	cmd.Stdin = stdinR

	s.mu.Lock()
	s.stdinW = stdinW
	s.mu.Unlock()

	// Prepare to read stdout/stderr for error reporting
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		complete("", err)
		return "", err
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		cancel()
		startErr := fmt.Errorf("failed to start slidev: %w", err)
		complete("", startErr)
		return "", startErr
	}

	fmt.Printf("[Server] Slidev process started, pid=%d\n", cmd.Process.Pid)

	go func() {
		err := cmd.Wait()
		if err != nil {
			fmt.Printf("[Server] Slidev process exited (pid=%d) with error: %v\n", cmd.Process.Pid, err)
		} else {
			fmt.Printf("[Server] Slidev process exited cleanly (pid=%d)\n", cmd.Process.Pid)
		}
		// Note: do not clear running/url here; on Windows `npx` may exit while the Node server keeps running.
		// We rely on Stop() to terminate the process tree and clear state.
	}()

	s.mu.Lock()
	s.cmd = cmd
	s.cancel = cancel
	s.port = port
	// currentFile already set during in-flight setup
	s.mu.Unlock()

	// Track logs for debugging and URL detection
	var logs []string
	var logsMu sync.Mutex
	portChan := make(chan string, 1)

	go func() {
		// Regex to match Slidev's URL output: > http://localhost:3030/
		re := regexp.MustCompile(`http://(?:localhost|127\.0\.0\.1|\[::1\]):(\d+)`)
		nodePIDRe := regexp.MustCompile(`\(node:(\d+)\)`)

		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			fmt.Printf("[Slidev Log] %s\n", line)

			// Capture node PID for reliable stop even if npx exits.
			if m := nodePIDRe.FindStringSubmatch(line); len(m) > 1 {
				if pid, err := strconv.Atoi(m[1]); err == nil {
					s.mu.Lock()
					if s.slidevNodePID == 0 {
						s.slidevNodePID = pid
						fmt.Printf("[Server] Captured Slidev node pid=%d\n", pid)
					}
					s.mu.Unlock()
				}
			}

			// Detect URL/port from log
			if strings.Contains(line, "public slide show") || strings.Contains(line, "http://") {
				if matches := re.FindStringSubmatch(line); len(matches) > 1 {
					port := matches[1]
					select {
					case portChan <- port:
					default:
					}
				}
			}

			logsMu.Lock()
			if len(logs) > 100 {
				logs = logs[1:]
			}
			logs = append(logs, line)
			logsMu.Unlock()
		}
	}()

	// Wait for URL from logs or timeout
	select {
	case detectedPort := <-portChan:
		// Prefer using Slidev's printed host (localhost). This is what works in your manual CLI test.
		chosenURL := strings.TrimRight("http://localhost:"+detectedPort, "/")
		fmt.Printf("[Server] Slidev detected ready at %s\n", chosenURL)
		fmt.Printf("[Server] Hint: if browser can't open %s, try http://127.0.0.1:%s/ or http://[::1]:%s/\n", chosenURL, detectedPort, detectedPort)

		complete(chosenURL, nil)
		return chosenURL, nil

	case <-time.After(45 * time.Second):
		logsMu.Lock()
		lastLogs := strings.Join(logs, "\n")
		logsMu.Unlock()
		err := fmt.Errorf("timeout waiting for slidev to output URL. Last logs:\n%s", lastLogs)
		complete("", err)
		_ = s.Stop()
		return "", err

	case <-ctx.Done():
		err := ctx.Err()
		complete("", err)
		return "", err
	}
}

func (s *Server) Stop() error {
	s.mu.Lock()
	cancel := s.cancel
	cmd := s.cmd
	ch := s.startCh
	stdinW := s.stdinW
	nodePID := s.slidevNodePID
	s.stdinW = nil
	s.startCh = nil
	s.starting = false
	s.running = false
	s.url = ""
	s.generation++ // Invalidate any ongoing Start
	s.mu.Unlock()

	if stdinW != nil {
		_ = stdinW.Close()
	}

	if ch != nil {
		ch <- startResult{url: "", err: context.Canceled}
		close(ch)
	}

	fmt.Printf("[Server] Stop() called; process will be terminated if running\n")

	if cancel != nil {
		cancel()
	}

	// Reliable cleanup of process tree
	if runtime.GOOS == "windows" {
		// Prefer killing the actual node pid if captured (npx may exit early)
		if nodePID != 0 {
			_ = exec.Command("taskkill", "/F", "/T", "/PID", fmt.Sprintf("%d", nodePID)).Run()
		}
		if cmd != nil && cmd.Process != nil {
			_ = exec.Command("taskkill", "/F", "/T", "/PID", fmt.Sprintf("%d", cmd.Process.Pid)).Run()
		}
	} else {
		if cmd != nil && cmd.Process != nil {
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
