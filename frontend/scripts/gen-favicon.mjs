import fs from "fs";
import pngToIco from "png-to-ico";

const buf = await pngToIco(["app/icon.png"]);
fs.writeFileSync("app/favicon.ico", buf);
console.log(`Wrote app/favicon.ico (${buf.length} bytes)`);
