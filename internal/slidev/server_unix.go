//go:build !windows

package slidev

import "syscall"

func getSysProcAttr() *syscall.SysProcAttr {
	return nil
}
