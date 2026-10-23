// Additional Venus preparation harness; not part of the proposed upstream patch.
package releaseauth

import (
	"os"
	"path/filepath"
	"testing"
)

func TestP06NodeRSAManifestAcceptedByActualGoVerifier(t *testing.T) {
	directory := os.Getenv("P06_INTEROP_DIRECTORY")
	if directory == "" {
		t.Skip("public-only P06 vector not supplied")
	}
	read := func(name string) []byte {
		data, err := os.ReadFile(filepath.Join(directory, name))
		if err != nil {
			t.Fatal(err)
		}
		return data
	}
	manifest := read("venus-release.json")
	envelope := read("venus-release.json.sig.json")
	public := read("test-only-public.pem")
	if err := VerifyBytes(manifest, envelope, public); err != nil {
		t.Fatal(err)
	}
	manifest[10] ^= 1
	if VerifyBytes(manifest, envelope, public) == nil {
		t.Fatal("tampered Node-produced manifest accepted")
	}
}
