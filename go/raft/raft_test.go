package orcraft

import (
	"testing"

	"github.com/proxysql/orchestrator/go/config"
)

func TestNormalizeRaftNodePreservesHostnameWithPort(t *testing.T) {
	node, err := normalizeRaftNode("orchestrator-0.orchestrator.default.svc.cluster.local:10008")
	if err != nil {
		t.Fatalf("normalizeRaftNode returned error: %+v", err)
	}
	if node != "orchestrator-0.orchestrator.default.svc.cluster.local:10008" {
		t.Errorf("expected hostname:port to be preserved unresolved, got %q", node)
	}
}

func TestNormalizeRaftNodePassesThroughLiteralIP(t *testing.T) {
	node, err := normalizeRaftNode("192.168.1.10:10008")
	if err != nil {
		t.Fatalf("normalizeRaftNode returned error: %+v", err)
	}
	if node != "192.168.1.10:10008" {
		t.Errorf("expected literal IP to pass through unchanged, got %q", node)
	}
}

func TestNormalizeRaftNodePassesThroughLiteralIPv6(t *testing.T) {
	node, err := normalizeRaftNode("[::1]:10008")
	if err != nil {
		t.Fatalf("normalizeRaftNode returned error: %+v", err)
	}
	if node != "[::1]:10008" {
		t.Errorf("expected literal IPv6 to pass through unchanged, got %q", node)
	}
}

func TestNormalizeRaftNodeAddsDefaultPortToIPv6(t *testing.T) {
	originalPort := config.Config.DefaultRaftPort
	config.Config.DefaultRaftPort = 10008
	defer func() { config.Config.DefaultRaftPort = originalPort }()

	node, err := normalizeRaftNode("::1")
	if err != nil {
		t.Fatalf("normalizeRaftNode returned error: %+v", err)
	}
	if node != "[::1]:10008" {
		t.Errorf("expected default port to be appended in bracketed form, got %q", node)
	}
}

func TestNormalizeRaftNodeAddsDefaultPort(t *testing.T) {
	originalPort := config.Config.DefaultRaftPort
	config.Config.DefaultRaftPort = 10008
	defer func() { config.Config.DefaultRaftPort = originalPort }()

	node, err := normalizeRaftNode("orchestrator-0.orchestrator.default.svc.cluster.local")
	if err != nil {
		t.Fatalf("normalizeRaftNode returned error: %+v", err)
	}
	if node != "orchestrator-0.orchestrator.default.svc.cluster.local:10008" {
		t.Errorf("expected default port to be appended, got %q", node)
	}
}
