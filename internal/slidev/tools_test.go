package slidev

import (
	"os"
	"strings"
	"testing"
)

func TestTools(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "slidev-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempDir)

	tools := NewTools(tempDir)

	// Test CreateDeck
	err = tools.CreateDeck("Test Title", "default")
	if err != nil {
		t.Fatalf("CreateDeck failed: %v", err)
	}

	content, err := tools.ReadSlides()
	if err != nil {
		t.Fatalf("ReadSlides failed: %v", err)
	}
	if !strings.Contains(content, "Test Title") {
		t.Errorf("Expected 'Test Title' in content, got: %s", content)
	}

	// Test InsertPage
	err = tools.InsertPage(0, "center") // Insert after page 0 (which is slide 1)
	if err != nil {
		t.Fatalf("InsertPage failed: %v", err)
	}

	content, err = tools.ReadSlides()
	if err != nil {
		t.Fatalf("ReadSlides failed: %v", err)
	}
	if !strings.Contains(content, "layout: center") {
		t.Errorf("Expected 'layout: center' in content, got: %s", content)
	}

	// Test UpdatePage
	// Index 0 is original slide 1. Index 1 is the new inserted slide?
	// InsertPage logic was: insert after pageIndex.
	// If I insert after 0, it becomes page 1 (technically).

	err = tools.UpdatePage(0, "# Updated Slide 1\nNew Content")
	if err != nil {
		t.Fatalf("UpdatePage failed: %v", err)
	}

	content, err = tools.ReadSlides()
	if err != nil {
		t.Fatalf("ReadSlides failed: %v", err)
	}
	if !strings.Contains(content, "Updated Slide 1") {
		t.Errorf("Expected 'Updated Slide 1' in content, got: %s", content)
	}

	// Test ApplyGlobalTheme
	err = tools.ApplyGlobalTheme("new-theme")
	if err != nil {
		t.Fatalf("ApplyGlobalTheme failed: %v", err)
	}
	content, err = tools.ReadSlides()
	if err != nil {
		t.Fatalf("ReadSlides failed: %v", err)
	}
	if !strings.Contains(content, "theme: new-theme") {
		t.Errorf("Expected 'theme: new-theme' in content, got: %s", content)
	}
}
