package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"regexp"
	"sort"
	"strings"
	"text/template"
)

type options struct {
	jsonSource string
	template   string
	output     string
}

const version = "0.1.0"

func main() {
	opts := &options{}
	flag.StringVar(&opts.jsonSource, "json", "", `path to the ably-common/protocol/errors.json`)
	flag.StringVar(&opts.template, "t", "", "path to the template file")
	flag.StringVar(&opts.output, "o", "", "file to write output")
	flag.Parse()
	if opts.jsonSource == "" {
		flag.PrintDefaults()
		return
	}
	if opts.template == "" {
		fmt.Println("[error] missing -t flag")
		flag.PrintDefaults()
		os.Exit(1)
	}
	tplData, err := ioutil.ReadFile(opts.template)
	if err != nil {
		log.Fatal(err)
	}
	var out io.Writer
	if opts.output != "" {
		f, err := os.Open(opts.output)
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()
		out = f
	} else {
		out = os.Stdout
	}
	sourceFile, err := ioutil.ReadFile(opts.jsonSource)
	if err != nil {
		log.Fatal(err)
	}
	re := regexp.MustCompile(`\/\*([\s\S]*?)\*\/`)

	// we remove the multiline comments
	sourceFile = re.ReplaceAll(sourceFile, []byte{})
	codeToDesc := make(map[int]string)
	err = json.Unmarshal(sourceFile, &codeToDesc)
	if err != nil {
		log.Fatal(err)
	}
	var codes []int
	for k := range codeToDesc {
		codes = append(codes, k)
	}
	sort.Ints(codes)
	tpl, err := template.New("errors").Funcs(template.FuncMap{
		"key": func(k int) string {
			return codeToDesc[k]
		},
		"normalize": normalize,
		"split": func(a, b string) []string {
			return strings.Split(b, a)
		},
		"join": func(sep string, v []string) string {
			return strings.Join(v, sep)
		},
		"title": func(v []string) []string {
			for k := range v {
				v[k] = strings.Title(v[k])
			}
			return v
		},
		"map": func(from, to string, v []string) []string {
			dest := make([]string, len(v))
			for k := range v {
				if v[k] == from {
					dest = append(dest, to)
				} else {
					dest = append(dest, v[k])
				}
			}
			return dest
		},
	}).Parse(string(tplData))
	if err != nil {
		log.Fatal(err)
	}
	err = tpl.Execute(out, map[string]interface{}{
		"codes":   codes,
		"version": version,
	})
	if err != nil {
		log.Fatal(err)
	}
}

func normalize(v string) string {
	idx := strings.Index(v, ")")
	if idx != -1 {
		v = v[:idx]
		v = strings.Replace(v, "(", " ", -1)
		v = strings.Replace(v, ")", " ", -1)
	}
	v = strings.Replace(v, "-", " ", -1)
	return v
}
