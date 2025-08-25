
const gt = globalThis as any;

let clientEnvData: IClientEnvData | undefined = undefined;

export interface IClientEnvData {
    isSteam: boolean,
    processId: number;
    processPlatform: string;
    processArch: string;

    steamAppId: number;
    steamUserIdStr: string;
    steamUserName: string;
    steamUserLevel: number;
    steamIpCountry: string;

    appData: string;
    appExe: string;
    appUserData: string;
    appTempData: string;

    userName: string;
    userHome: string;

    osType: string;
    osArch: string;
    osPlatform: string;
    osRelease: string;

    hostName: string;

    cwd: string;
}

export function fillClientEnvData(jsonData: string) {
    clientEnvData = JSON.parse(jsonData);
    //clientEnvData.steamUserId = BigInt(clientEnvData.steamUserIdStr); // not serializable
}


export function isClientEnvDataReady(): boolean {
    return clientEnvData != null;
}

export function getClientEnvData(): IClientEnvData | undefined {
    return clientEnvData;
}

gt.isClientEnvDataReady = isClientEnvDataReady;
gt.getClientEnvData = getClientEnvData;

