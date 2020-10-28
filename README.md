# ngrok
Expose your localhost to the web. Ultra-simple deno wrapper for ngrok.

> **Warning**: The examples in this README pull from the latest release, which may not make
> sense to do when you are looking to actually deploy a workload. You would want
> to "pin" to a particular version which is compatible with the version of Deno
> you are using and has a fixed set of APIs you would expect.
> `https://deno.land/x/` supports using git tags in the URL to direct you at a
> particular version. So to use version 2.2.2 of ngrok, you would want to import
> `https://deno.land/x/ngrok@v2.2.2/mod.ts`.


## Usage
```ts
import { connect } from 'https://deno.land/x/ngrok/mod.ts'
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
    authtoken?: string;
    extraArgs?: string[];
}
```

### Disconnecting

Due to the way Deno currently works, ngrok will continue running in the background even after your program exits unless you disconnect

```
import { disconnect } from 'https://deno.land/x/ngrok/mod.ts'
disconnect()
```

- Optionally provide an exit code: `disconnect(9)`

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