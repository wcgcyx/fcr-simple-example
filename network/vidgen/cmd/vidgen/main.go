package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ipfs/go-blockservice"
	"github.com/ipfs/go-cidutil"
	badgerds "github.com/ipfs/go-ds-badger"
	blockstore "github.com/ipfs/go-ipfs-blockstore"
	chunk2 "github.com/ipfs/go-ipfs-chunker"
	ipldformat "github.com/ipfs/go-ipld-format"
	"github.com/ipfs/go-merkledag"
	"github.com/ipfs/go-unixfs/importer/balanced"
	"github.com/ipfs/go-unixfs/importer/helpers"
	"github.com/multiformats/go-multihash"
	"github.com/urfave/cli/v2"
)

func main() {
	app := &cli.App{
		Name:      "vidgen",
		HelpName:  "vidgen",
		Usage:     "Utility to transform MP4 file to streamable chunks with CID",
		UsageText: "vidgen [global options] gen [filename]",
		Version:   "0.0.1",
		Description: "This utility will generate a list of streamable chunks for a given MP4 file.\n" +
			"Two options to use:\n" +
			"1. Chunk-size (by default 100KB) and\n" +
			"2. Output-dir (by default $filename-piece under current dir)",
		Authors: []*cli.Author{
			{
				Name:  "wcgcyx",
				Email: "wcgcyx@gmail.com",
			},
		},
		Flags: []cli.Flag{
			&cli.UintFlag{
				Name:    "chunk-size",
				Aliases: []string{"c"},
				Value:   100,
				Usage:   "specify chunk size in KB",
			},
			&cli.PathFlag{
				Name:    "out-dir",
				Aliases: []string{"o"},
				Value:   "",
				Usage:   "specify outpath",
			},
		},
		Commands: []*cli.Command{
			{
				Name:      "gen",
				Usage:     "generate list of streamable chunks for given MP4 file",
				ArgsUsage: "[filename]",
				UsageText: "vidgen [global options] gen [filename]",
				Action: func(c *cli.Context) error {
					// Parse arguments.
					filename := c.Args().Get(0)
					if filename == "" {
						return fmt.Errorf("empty file provided")
					}
					// Check if file exists.
					if _, err := os.Stat(filename); errors.Is(err, os.ErrNotExist) {
						return fmt.Errorf("file not found")
					}
					if !strings.HasSuffix(filename, ".mp4") {
						return fmt.Errorf("file is not a mp4 file")
					}
					return generate(filename, c.Uint("chunk-size"), c.Path("out-dir"))
				},
			},
		},
	}
	err := app.Run(os.Args)
	if err != nil {
		fmt.Println(err.Error())
	}
}

// Root is the root file for
type Root struct {
	Chunk    int64            `json:"chunk"`
	Size     int64            `json:"size"`
	Children map[int64]string `json:"children"`
}

// generate do the generation.
func generate(filename string, chunk uint, out string) error {
	var err error
	if out == "" {
		out, err = os.MkdirTemp(".", "generated-*")
		if err != nil {
			return err
		}
	}
	// Create outpath
	err = os.MkdirAll(out, os.ModePerm)
	if err != nil {
		return err
	}
	f, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer f.Close()
	// Get total size
	stat, err := f.Stat()
	if err != nil {
		return err
	}
	size := stat.Size()
	chunkSize := int64(chunk) * 1024
	// Create a temp ds to replicate piecemgr behavior
	temp, err := os.MkdirTemp(out, "")
	if err != nil {
		return err
	}
	defer os.RemoveAll(temp)
	dsopts := badgerds.DefaultOptions
	dsopts.SyncWrites = false
	dsopts.Truncate = true
	cds, err := badgerds.NewDatastore(temp, &dsopts)
	if err != nil {
		return err
	}
	defer cds.Close()
	cs := blockstore.NewBlockstore(cds)
	// Initialise root
	root := Root{
		Chunk:    chunkSize,
		Size:     size,
		Children: make(map[int64]string),
	}
	for i := int64(0); i < size/chunkSize+1; i++ {
		subSize := chunkSize
		if i == size/chunkSize {
			if size%chunkSize == 0 {
				break
			}
			subSize = size % chunkSize
		}
		// Read io.
		chunkData := make([]byte, subSize)
		read, err := f.Read(chunkData)
		if err != nil {
			return err
		}
		if int64(read) != subSize {
			return fmt.Errorf("error reading from file, size not match expect %v got %v", subSize, read)
		}
		dag := merkledag.NewDAGService(blockservice.New(cs, nil))
		bufferedDS := ipldformat.NewBufferedDAG(context.Background(), dag)
		prefix, err := merkledag.PrefixForCidVersion(1)
		if err != nil {
			return err
		}
		prefix.MhType = uint64(multihash.BLAKE2B_MIN + 31)
		params := helpers.DagBuilderParams{
			Maxlinks:  1024,
			RawLeaves: true,
			CidBuilder: cidutil.InlineBuilder{
				Builder: prefix,
				Limit:   126,
			},
			Dagserv: bufferedDS,
		}
		db, err := params.New(chunk2.NewSizeSplitter(bytes.NewReader(chunkData), int64(1<<20)))
		if err != nil {
			return err
		}
		n, err := balanced.Layout(db)
		if err != nil {
			return err
		}
		// Now we have cid, save it.
		err = os.WriteFile(filepath.Join(out, n.Cid().String()), chunkData, os.ModePerm)
		if err != nil {
			return err
		}
		root.Children[i] = n.Cid().String()
	}
	// Save to root
	rootData, err := json.Marshal(root)
	if err != nil {
		return err
	}
	// Calculate root cid
	dag := merkledag.NewDAGService(blockservice.New(cs, nil))
	bufferedDS := ipldformat.NewBufferedDAG(context.Background(), dag)
	prefix, err := merkledag.PrefixForCidVersion(1)
	if err != nil {
		return err
	}
	prefix.MhType = uint64(multihash.BLAKE2B_MIN + 31)
	params := helpers.DagBuilderParams{
		Maxlinks:  1024,
		RawLeaves: true,
		CidBuilder: cidutil.InlineBuilder{
			Builder: prefix,
			Limit:   126,
		},
		Dagserv: bufferedDS,
	}
	db, err := params.New(chunk2.NewSizeSplitter(bytes.NewReader(rootData), int64(1<<20)))
	if err != nil {
		return err
	}
	n, err := balanced.Layout(db)
	if err != nil {
		return err
	}
	err = os.WriteFile(filepath.Join(out, fmt.Sprintf("root-%v", n.Cid().String())), rootData, os.ModePerm)
	if err != nil {
		return err
	}
	fmt.Printf("Generated under %v with root to be %v\n", out, n.Cid().String())
	return nil
}
