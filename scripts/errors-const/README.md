# errors-const

 Is a tool that generates ably error codes constants for different supported
 languages.
This tool uses go templates to generate the output.

## Usage
```
$ errors-const
  -json string
        path to the ably-common/protocol/errors.json
  -o string
        file to write output
  -t string
        path to the template file
```