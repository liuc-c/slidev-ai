package slidev

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
)

// Project represents a Slidev project file

type Project struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Updated string `json:"updated"` // Human readable or timestamp
	Img     string `json:"img"`     // Placeholder for now
}

// Tools provides methods to manipulate Slidev projects
type Tools struct {
	WorkingDir string
	mu         sync.Mutex
}

func NewTools(workingDir string) *Tools {
	return &Tools{WorkingDir: workingDir}
}

// ListProjects scans the working directory for .md files
func (t *Tools) ListProjects() ([]Project, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	var projects []Project

	files, err := os.ReadDir(t.WorkingDir)
	if err != nil {
		return nil, err
	}

	for i, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".md") && file.Name() != "README.md" {
			info, _ := file.Info()
			projects = append(projects, Project{
				ID:      fmt.Sprintf("%d", i),
				Name:    file.Name(),
				Updated: info.ModTime().Format("2006-01-02 15:04"),
				Img:     "https://picsum.photos/seed/" + file.Name() + "/400/225", // Deterministic random image
			})
		}
	}
	return projects, nil
}

// CreateProject creates a new .md file
func (t *Tools) CreateProject(filename string) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	if !strings.HasSuffix(filename, ".md") {
		filename += ".md"
	}
	// Use CreateDeck logic but for specific filename
	title := strings.TrimSuffix(filename, ".md")
	theme := "seriph"

	path := filepath.Join(t.WorkingDir, filename)
	content := fmt.Sprintf(`---
theme: %s
background: https://picsum.photos/id/10/1920/1080
class: text-center
highlighter: shiki
lineNumbers: true
---

# %s

Welcome to Slidev

---
layout: default
---

# Page 2

Content
`, theme, title)

	return os.WriteFile(path, []byte(content), 0644)
}

// CreateDeck initializes a new deck (Legacy/Default support)
func (t *Tools) CreateDeck(title string, theme string) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	// If title doesn't end in .md, we assume it's just the title
	// But CreateProject expects a filename.
	// For legacy CreateDeck, we likely want "slides.md" if it's the main deck.
	// However, the test passes "Test Title" as title, but we want to create "slides.md" in that temp dir?
	// The implementation of CreateDeck in my memory was calling CreateProject("slides.md").
	// But `CreateProject` sets the title inside the markdown.

	filename := "slides.md"
	path := filepath.Join(t.WorkingDir, filename)

	content := fmt.Sprintf(`---
theme: %s
background: https://picsum.photos/id/10/1920/1080
class: text-center
highlighter: shiki
lineNumbers: true
---

# %s

Welcome to Slidev

---
layout: default
---

# Page 2

Content
`, theme, title)

	return os.WriteFile(path, []byte(content), 0644)
}

// SaveSlides overwrites a specific file
func (t *Tools) SaveSlides(filename string, content string) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	path := filepath.Join(t.WorkingDir, filename)
	return os.WriteFile(path, []byte(content), 0644)
}

// UpdatePage updates a specific page content
func (t *Tools) UpdatePage(filename string, pageIndex int, markdown string) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	if filename == "" {
		filename = "slides.md"
	}
	path := filepath.Join(t.WorkingDir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	content := string(data)
	// Split by separator ---
	// Need to be careful about frontmatter. The first --- block is frontmatter.
	// Slidev splits by `---` (surrounded by newlines mostly).

	// Normalize newlines
	content = strings.ReplaceAll(content, "\r\n", "\n")

	parts := regexp.MustCompile(`(?m)^---$`).Split(content, -1)

	// Filter out empty parts if any, but regex split usually keeps them.
	// The first part might be empty if file starts with ---

	// A standard slidev file:
	// ---
	// frontmatter
	// ---
	// Slide 1
	// ---
	// Slide 2

	// Split result: ["", "frontmatter\n", "\nSlide 1\n", "\nSlide 2\n"]

	// Adjust index logic.
	// pageIndex 0 -> Slide 1 (after frontmatter)

	// If the file starts with ---, parts[0] is empty. parts[1] is frontmatter. parts[2] is slide 1.
	// So slideIndex + 2 = parts index.

	targetIndex := pageIndex + 2
	if !strings.HasPrefix(content, "---") {
		// If no frontmatter (rare), logic changes. Assuming standard Slidev.
		return fmt.Errorf("invalid slidev format: missing frontmatter")
	}

	if targetIndex >= len(parts) {
		return fmt.Errorf("page index out of range")
	}

	parts[targetIndex] = "\n" + markdown + "\n"

	newContent := strings.Join(parts, "---")
	return os.WriteFile(path, []byte(newContent), 0644)
}

// InsertPage inserts a new page after a specific index
func (t *Tools) InsertPage(filename string, afterIndex int, layout string) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	if filename == "" {
		filename = "slides.md"
	}
	path := filepath.Join(t.WorkingDir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	content := string(data)
	content = strings.ReplaceAll(content, "\r\n", "\n")
	parts := regexp.MustCompile(`(?m)^---$`).Split(content, -1)

	targetIndex := afterIndex + 2
	if targetIndex >= len(parts) {
		targetIndex = len(parts)
	} else {
		targetIndex++ // Insert AFTER
	}

	// It's easier to just append text if it's the end, but let's try to splice.
	// Actually, `parts` does not include the separator.

	// Let's re-read strategy.
	// We want to insert `---` and content.

	// Simplest: Find the Nth occurrence of `---` and insert after it.
	// Occurrences: 1st (start), 2nd (end of frontmatter), 3rd (end of slide 1)...
	// afterIndex 0 (Slide 1) -> Insert after 3rd `---`.

	matches := regexp.MustCompile(`(?m)^---$`).FindAllStringIndex(content, -1)

	// matches[0] is usually index 0.
	// matches[1] is end of frontmatter.
	// Slide 1 ends at matches[2] (if exists) or EOF.

	// We want to insert after Slide `afterIndex`.
	// Slide 1 is between matches[1] and matches[2].
	// Slide N is between matches[N] and matches[N+1].

	// So we want to insert after Slide `afterIndex` (1-based in UI? 0-based?).
	// Assuming 0-based index for slides (excluding frontmatter).

	// If we want to insert after Slide 0.
	// We look for end of Slide 0. This is usually the next `---`.
	// So match index is `afterIndex + 2`. (0 -> 2).

	// If `afterIndex + 2` exists in matches, we insert before that match? No.
	// We want to insert AFTER the content of that slide.
	// Which is BEFORE the delimiter that starts the NEXT slide.

	// Wait.
	// --- (0)
	// frontmatter
	// --- (1)
	// Slide 0
	// --- (2)
	// Slide 1

	// Insert after Slide 0 -> Insert at position of match (2).
	// The new content will be `\n---\nNewContent\n` and then the existing `---` follows?
	// Or `\n\nNewContent\n\n---` ?

	// If I insert at match (2):
	// Slide 0 content
	// <INSERT HERE>
	// ---
	// Slide 1 content

	// Inserted: `\n---\nlayout: ...\n# New\n`

	// Result:
	// Slide 0 content
	// ---
	// layout: ...
	// # New
	// ---
	// Slide 1 content

	// Correct.

	insertPosIndex := afterIndex + 2

	insertion := fmt.Sprintf("\n---\nlayout: %s\n---\n\n# New Slide\n\n", layout)

	if insertPosIndex < len(matches) {
		pos := matches[insertPosIndex][0] // Start of `---`

		newContent := content[:pos] + insertion + content[pos:]
		return os.WriteFile(path, []byte(newContent), 0644)
	} else {
		// Append to end
		newContent := content + insertion
		return os.WriteFile(path, []byte(newContent), 0644)
	}
}

// ApplyGlobalTheme changes the theme in frontmatter
func (t *Tools) ApplyGlobalTheme(filename string, themeName string) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	if filename == "" {
		filename = "slides.md"
	}
	path := filepath.Join(t.WorkingDir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	content := string(data)
	// Replace `theme: ...` in frontmatter
	// Frontmatter is between first two `---`

	re := regexp.MustCompile(`(?s)^---\n(.*?)\n---`)
	match := re.FindStringSubmatch(content)
	if len(match) < 2 {
		return fmt.Errorf("frontmatter not found")
	}

	frontmatter := match[1]
	themeRe := regexp.MustCompile(`theme:\s*([^\s]+)`)

	var newFrontmatter string
	if themeRe.MatchString(frontmatter) {
		newFrontmatter = themeRe.ReplaceAllString(frontmatter, "theme: "+themeName)
	} else {
		newFrontmatter = frontmatter + "\ntheme: " + themeName
	}

	newContent := strings.Replace(content, frontmatter, newFrontmatter, 1)
	return os.WriteFile(path, []byte(newContent), 0644)
}

func (t *Tools) ReadSlides(filename string) (string, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if filename == "" {
		filename = "slides.md"
	}
	path := filepath.Join(t.WorkingDir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
