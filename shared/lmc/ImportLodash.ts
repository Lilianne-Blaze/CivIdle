
const gt = globalThis as any;

export const lodash = require('lodash');
gt.lodash = lodash;

export function getProp(obj: any, path: string): any {
    return lodash.get(obj, path);
}
gt.getProp = getProp;

export function setProp(obj: any, path: string, value: any): void {
    lodash.set(obj, path, value);
}
gt.setProp = setProp;
