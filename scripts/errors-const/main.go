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
	o := &options{}
	flag.StringVar(&o.jsonSource, "json", "", `path to the ably-common/protocol/errors.json`)
	flag.StringVar(&o.template, "t", "", "path to the template file")
	flag.StringVar(&o.output, "o", "", "file to write output")
	flag.Parse()
	if o.jsonSource == "" {
		flag.PrintDefaults()
		return
	}
	if o.template == "" {
		fmt.Println("[error] missing -t flag")
		flag.PrintDefaults()
		os.Exit(1)
	}
	tplData, err := ioutil.ReadFile(o.template)
	if err != nil {
		log.Fatal(err)
	}
	var out io.Writer
	if o.output != "" {
		f, err := os.Open(o.output)
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()
		out = f
	} else {
		out = os.Stdout
	}
	f, err := ioutil.ReadFile(o.jsonSource)
	if err != nil {
		log.Fatal(err)
	}
	re := regexp.MustCompile(`\/\*([\s\S]*?)\*\/`)

	// we remove the multiline comments
	f = re.ReplaceAll(f, []byte{})
	m := make(map[int]string)
	err = json.Unmarshal(f, &m)
	if err != nil {
		log.Fatal(err)
	}
	var keys []int
	for k := range m {
		keys = append(keys, k)
	}
	sort.Ints(keys)
	tpl, err := template.New("errors").Funcs(template.FuncMap{
		"key": func(k int) string {
			return m[k]
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
	}).Parse(string(tplData))
	if err != nil {
		log.Fatal(err)
	}
	err = tpl.Execute(out, map[string]interface{}{
		"codes":   keys,
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
