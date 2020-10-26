# ngrok
Expose your localhost to the web. Ultra-simple deno wrapper for ngrok.

## Usage
```ts
import { connect } from 'https://deno.land/x/ngrok@2.0.0/mod.ts'
const url = await connect({ protocol: 'http', port: '8080' })
console.log(url) // Outputs a URL without the protocol, such as "33a229cb0344.ngrok.io"
```

- connect accepts NgrokOptions

```ts
interface NgrokOptions {
    protocol: string;
    port: number;
    region?: string;
    subdomain?: string;
    extraArgs?: string[];
}
```

## Permissions

- --allow-read
- --allow-write
- --allow-env
- --allow-net
- --allow-run

Also requires --unstable 

```bash
deno run --unstable --allow-read --allow-write --allow-env --allow-net --allow-run test.ts
```