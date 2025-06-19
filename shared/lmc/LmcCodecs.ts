
// funcs for encoding and decoding data to/from base64 and hex

// version 2025-06-15

const gt = globalThis as any;

export function encodeAnyToBase64(input: any): string {
   if (Buffer.isBuffer(input)) {
      return input.toString("base64");
   } else if (typeof input === "string") {
      return Buffer.from(input, "utf-8").toString("base64");
   } else if (input instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(input)).toString("base64");
   } else if (ArrayBuffer.isView(input)) {
      return Buffer.from(input.buffer, input.byteOffset, input.byteLength).toString("base64");
   } else if (input === undefined) {
      return Buffer.from("undefined", "utf-8").toString("base64");
   } else if (input === null) {
      return Buffer.from("null", "utf-8").toString("base64");
   } else {
      // Fallback: convert anything else to JSON string
      return Buffer.from(JSON.stringify(input), "utf-8").toString("base64");
   }
}
gt.encodeAnyToBase64 = encodeAnyToBase64;


export function decodeTextFromBase64(b64: string): string {
   return Buffer.from(b64, "base64").toString("utf-8");
}
gt.decodeTextFromBase64 = decodeTextFromBase64;

export function decodeDataFromBase64(b64: string): Buffer {
   return Buffer.from(b64, "base64");
}
gt.decodeDataFromBase64 = decodeDataFromBase64;

export function encodeAnyToHex(input: any): string {
   if (Buffer.isBuffer(input)) {
      return input.toString("hex");
   } else if (typeof input === "string") {
      return Buffer.from(input, "utf-8").toString("hex");
   } else if (input instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(input)).toString("hex");
   } else if (ArrayBuffer.isView(input)) {
      return Buffer.from(input.buffer, input.byteOffset, input.byteLength).toString("hex");
   } else if (input === undefined) {
      return Buffer.from("undefined", "utf-8").toString("hex");
   } else if (input === null) {
      return Buffer.from("null", "utf-8").toString("hex");
   } else {
      // Fallback: convert anything else to JSON string
      return Buffer.from(JSON.stringify(input), "utf-8").toString("hex");
   }
}
gt.encodeAnyToHex = encodeAnyToHex;

export function decodeTextFromHex(hex: string): string {
   return Buffer.from(hex, "hex").toString("utf-8");
}
gt.decodeTextFromHex = decodeTextFromHex;

export function decodeDataFromHex(hex: string): Buffer {
   return Buffer.from(hex, "hex");
}
gt.decodeDataFromHex = decodeDataFromHex;

export function isValidBase64EncodedData(str: string): boolean {
   if (typeof str !== "string") return false;
   // Remove all whitespace (for MIME)
   const cleaned = str.replace(/\s+/g, "");
   if (cleaned.length === 0) return true;
   if (cleaned.length % 4 === 1) return false;

   // Only valid base64 chars: standard (+/), url-safe (-_)
   if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(cleaned)) return false;
   // Don't allow mixed alphabets
   if (/[+\/]/.test(cleaned) && /[-_]/.test(cleaned)) return false;

   return true;
}
gt.isValidBase64EncodedData = isValidBase64EncodedData;

export function isValidHexEncodedData(str: string): boolean {
   return typeof str === "string" && str.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(str); // Note the *
}
gt.isValidHexEncodedData = isValidHexEncodedData;
