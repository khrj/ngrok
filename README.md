# ngrok
Expose your localhost to the web. Ultra-simple deno wrapper for ngrok.

## Usage
```
import { connect } from 'https://deno.land/x/ngrok@v1.0.1/mod.ts'
const url = await connect("http", "8080") // --log=stdout is always included
console.log(url) // Outputs a URL without the protocol, such as "33a229cb0344.ngrok.io"
```

- connect accepts any number of arguments which will be passed to ngrok

## Permissions

- --allow-read
- --allow-write
- --allow-env
- --allow-net
- --allow-run

Also requires --unstable 

```
deno run --unstable --allow-read --allow-write --allow-env --allow-net --allow-run test.ts
```