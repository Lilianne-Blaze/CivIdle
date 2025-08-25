import { IClientPublishOptions, QoS } from "mqtt";
import { getGameState } from "../logic/GameStateLogic";
import { getCurrentAge } from "../logic/TechLogic";
import { newTimedGuid48, splitTimedGuid48, type TimedGuid48 } from "../modfri/TimedGuid48";
import { getCurrentCity, getUserHandle, getUserId, getUserName, hasSupporterPack } from "./CiScripts";
import { LMC_FOR_BUILD, LMC_MAJOR_VER, LMC_MINOR_VER, LMC_VER_NOTE, LMC_VER_NUMBER, MQTT_DEFAULT_EXPIRY_SECONDS } from "./LmcConstsEarly";
import { getLastKnownUserIdHash } from "./LmcUserScripts";

const gt = globalThis as any;

/**
 * Represents a package of data to be sent via MQTT, including extra options, properties, and metadata.
 */
export class LmcMqttPackage {
    constructor(
        public topic: string,
        public payloadString: string,
        public userId?: string | null,
        public timedGuid48?: TimedGuid48 | null,
        public timeMillis?: number | null,
        public options: IClientPublishOptions = newMqttPublishOptions(),
    ) {
        if (timedGuid48 && !timeMillis) {
            timeMillis = splitTimedGuid48(timedGuid48).timeMillis;
        }
        if (!userId && !timedGuid48) {
            throw new Error("Provide userId or timedGuid48");
        }

    }
}

export class LmcMqttEnvelope {
    constructor(
        public userData: UserDataPayload | null = null,
        public modVersion: ModVersionPayload | null = null,
        public chatMessage: ChatMessagePayload | null = null,
        public basicState: BasicStatePayload | null = null,
        public extendedState: ExtendedStatePayload | null = null,
    ) { }
}

export interface UserDataPayload {
    userId: string | null,
    userIdHash: string | null,
    userHandle: string | null,
    userTimeMillis: number | null,
    infoFullName?: string | null, // e.g. "John Doe"
    infoDiscordId?: string | null, // e.g. "JohnDoe#1234"
    infoBio?: string | null, // e.g. "Loves playing games and coding"
}

export interface ModVersionPayload {
    lmcMajorVer: number,
    lmcMinorVer: number,
    lmcVerNumber: number,
    lmcForBuild: number,
    lmcVerNote: string | null,
    userTimeMillis: number | null,
}

export interface ChatMessagePayload {
    message: string,
    channel: string,
    userHandle?: string | null, // should never be null, but just in case
    userId?: string | null,
    time?: number | null,
    timedGuid48?: TimedGuid48 | null,
    flag?: string | null, // e.g. "GB" for Great Britain
    level?: number | null, // 0-4
    attr?: number | null,
    color?: number | null,
    mqtt?: boolean | null,
    secure?: boolean | null
}

export interface BasicStatePayload {
    city: string,
    tick: number,
    seconds: number,
    techAge: string,
    hasSupporterPack: boolean,
    hasFuture: boolean,
}

export interface ExtendedStatePayload extends BasicStatePayload {
    gpAtBirth: number,
    gpFromThisRun: number,
    empireValue: number,
    science: number,
}

export function newUserDataPayload({ nowMillis = Date.now() }): UserDataPayload {
    return {
        userId: getUserId(),
        userIdHash: getLastKnownUserIdHash(),
        userHandle: getUserHandle(),
        userTimeMillis: nowMillis,
    };
}
gt.newUserDataPayload = newUserDataPayload;


export function newModVersionPayload({ nowMillis = Date.now() }): ModVersionPayload {
    return {
        lmcMajorVer: LMC_MAJOR_VER,
        lmcMinorVer: LMC_MINOR_VER,
        lmcVerNumber: LMC_VER_NUMBER,
        lmcForBuild: LMC_FOR_BUILD,
        lmcVerNote: LMC_VER_NOTE,
        userTimeMillis: nowMillis,
    };
}
gt.newModVersionPayload = newModVersionPayload;

export function newBasicStatePayload({ nowMillis = Date.now() }): BasicStatePayload {
    const gs = getGameState();
    return {
        city: getCurrentCity(),
        tick: getGameState().tick,
        seconds: getGameState().seconds,
        techAge: getCurrentAge(gs),
        hasSupporterPack: hasSupporterPack(),
        hasFuture: false, // TODO: Determine if the game has future content


    };
}
gt.newBasicStatePayload = newBasicStatePayload;

export function newChatMessagePayload({ nowMillis = Date.now(), messageLine, channel }:
    { nowMillis?: number, messageLine: string, channel: string }): ChatMessagePayload {
    return {
        message: messageLine,
        channel: channel,
        userHandle: getUserName(),
        userId: getUserId(),
        time: nowMillis,
        timedGuid48: newTimedGuid48(nowMillis),
        flag: null,
        level: null,
        attr: null,
        color: null,
        mqtt: true,
        secure: false
    };
}
gt.newChatMessagePayload = newChatMessagePayload;

export function newMqttPublishOptions({ qos = 2, retain = true, expiryInterval = MQTT_DEFAULT_EXPIRY_SECONDS } = {}): IClientPublishOptions {
    return {
        qos: qos as QoS,
        retain: retain,
        properties: {
            messageExpiryInterval: expiryInterval,
        },
    };
}
gt.newMqttPublishOptions = newMqttPublishOptions;




/*
  "message": "mmmmmmmmmmm",
  "channel": "nds",
  "name": "nnnnn",
  "userId": "steam:7656111111111111",
  "time": 1750377651115,
  "timedGuid48": "000001978aa35e35ee65371cfde74282be883efec9dc2a6c",
  "flag": "GB",
  "level": 3,
  "attr": 4,
  "color": 0,
  "mqtt": true,
  "secure": false*/