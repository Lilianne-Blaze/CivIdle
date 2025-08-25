
import { atMostOnce } from "./MiscFuncs";

const gt = globalThis as any;
(globalThis as any).temp = (globalThis as any).temp + Math.random();

import mqttImported, { type IClientOptions, type IClientPublishOptions, type IClientSubscribeOptions, type IPublishPacket, type MqttClient } from "mqtt";
import { newTimedGuid48 } from "../modfri/TimedGuid48";
import { getUserId } from "./CiScripts";
import { lilModCli, lilModOption } from "./LilModCli";
import { CHANNEL_GUID_BASIC_STATE, CHANNEL_GUID_MOD_VER, CHANNEL_GUID_NDS, CHANNEL_GUID_ROOT, CHANNEL_GUID_TEST1 } from "./LmcConstsEarly";
import { OnEveryFiveMins, OnSoonAfterGameStartedOrLoaded } from "./LmcEvents";
import { type ChatMessagePayload, type LmcMqttPackage, newBasicStatePayload, newModVersionPayload, newMqttPublishOptions, newUserDataPayload } from "./LmcMqttTypes";


export const mqtt = mqttImported;
gt.mqtt = mqtt;

OnSoonAfterGameStartedOrLoaded.on(() => {
    lmcMqtt.connect();
});

OnEveryFiveMins.on(() => {
    lmcSendMqttVersionMessage();
    lmcSendMqttBasicStateMessage();

});

export const MQTT_BROKER_URL_MAIN = "wss://test.mosquitto.org:8081";
// export const MQTT_BROKER_URL_MAIN = "mqtt://broker.hivemq.com:1883";
// export const MQTT_BROKER_URL_MAIN = "wss://broker.hivemq.com:8884/mqtt";

declare function pushChatMessage(chatMessage: {}, vacuum: boolean): void;
declare function pushChatMessage(chatMessage: {}): void;

export const lmcMqtt = {

    mainMqttClient: null as MqttClient | null,

    sendPacket(packet: LmcMqttPackage) {
        if (!packet.topic) {
            console.error("[MQTT]", "sendPacket called without topic in packet", packet);
            return;
        }

        if (lilModCli.isOption(lilModOption.logOutgoingMqttMessages)) {
            console.log("[MQTT]", "Trying to send LmcMqttPackage: " + JSON.stringify(packet));
        }

        this.mainMqttClient?.publish(
            packet.topic,
            packet.payloadString,
            packet.options as IClientPublishOptions);
    },

    sendPacketByUserId(packet: LmcMqttPackage) {
        if (!packet.userId) {
            console.warn("[MQTT]", "sendPacketByUserId called without userId in packet", packet);
            return;
        }
        const clonedPacket = structuredClone(packet);
        clonedPacket.topic = packet.topic + "/" + packet.userId;
        this.sendPacket(clonedPacket);
    },

    sendPacketByTimedGuid48(packet: LmcMqttPackage) {
        if (!packet.topic)
            if (!packet.timedGuid48) {
                console.warn("[MQTT]", "sendPacketByTimedGuid48 called without timedGuid48 in packet", packet);
                return;
            }
        const clonedPacket = structuredClone(packet);
        clonedPacket.topic = packet.topic + "/" + packet.timedGuid48;
        this.sendPacket(clonedPacket);
    },

    sendPacketAsync(packet: { topic: string, payloadString: string, options: {} | undefined }) {
        (this.mainMqttClient as any)?.publishAsync?.(
            packet.topic,
            packet.payloadString,
            packet.options as IClientPublishOptions
        );
    },
    connect() {
        console.debug("[MQTT]", "Connecting to MQTT broker at", MQTT_BROKER_URL_MAIN);
        const opts: IClientOptions = {

            protocolVersion: 5,
            clean: true,
            keepalive: 40,
            // reconnectPeriod: 3000,

            clientId: newTimedGuid48(),

            // Logically treat slow/blocked connections as timeouts after 30s
            connectTimeout: 30_000,
            // Retry reconnect every 5s when offline
            reconnectPeriod: 5_000,

        };
        this.mainMqttClient = mqtt.connect(MQTT_BROKER_URL_MAIN, opts);

        this.mainMqttClient.on("connect", (connAck) => {
            console.debug("[MQTT]", "Connection succeeded", connAck);
            this.onConnect();
        });

        this.mainMqttClient.on("error", (err) => {
            const e = err as any;
            console.error("[MQTT]", "Connection error", e?.code ?? "", e?.message ?? e, err);
            // optionally clean up on failure
            //this.mainMqttClient?.end(true);
            //this.mainMqttClient = null;
        });

        // Additional visibility into timeout-like states
        this.mainMqttClient.on("offline", () => {
            console.warn("[MQTT]", "Offline (keepalive missed or network down) — likely timeout");
        });
        this.mainMqttClient.on("close", () => {
            console.warn("[MQTT]", "Connection closed");
        });
        this.mainMqttClient.on("reconnect", () => {
            console.info("[MQTT]", "Reconnecting…");
        });
        this.mainMqttClient.on("end", () => {
            console.info("[MQTT]", "Client ended");
        });
        // Some transports expose an underlying stream 'timeout' event (Node TCP)
        try {
            (this.mainMqttClient as any).stream?.on?.("timeout", () => {
                console.warn("[MQTT]", "Underlying stream timeout");
            });
        } catch {
            // ignore if transport does not support a stream timeout
        }
    },

    disconnect() {
        this.mainMqttClient?.end(true, () => {
            this.mainMqttClient = null;
        })
    },

    disconnectNowForce() {

        setTimeout(() => {
            require('why-is-node-running')();
        }, 5000);

        this.mainMqttClient?.endAsync(true);
        this.mainMqttClient = null;
    },

    reconnect() {
        this.mainMqttClient?.reconnect();
    },

    onConnect() {
        console.debug("[MQTT]", "Connected to MQTT broker at", MQTT_BROKER_URL_MAIN);
        //const opts = { qos: 2, rh: 0 } as IClientSubscribeOptions;
        const opts = { qos: 2, rh: 1, nl: false } as IClientSubscribeOptions;
        const topic = CHANNEL_GUID_ROOT + "/#";
        this.mainMqttClient?.on('message', (topic, message, packet) => {
            this.onMessage(topic, message, packet);
        })
        this.mainMqttClient?.subscribe(topic, opts);
    },

    onMessage(topic: string, message: Buffer<ArrayBufferLike>, packet: IPublishPacket) {
        const messageStr = message.toString();

        if (lilModCli.isOption(lilModOption.logIncomingMqttMessages)) {
            console.log("[MQTT]", "Received IPublicPacket: " + JSON.stringify(packet));
        }

        //console.debug("[MQTT]", "Received message on topic", topic, "with packet", packet);

        try {

            if (topic.includes(CHANNEL_GUID_NDS) || topic.includes(CHANNEL_GUID_TEST1)) {
                console.debug("[MQTT]", "Received NDS/T1 message:", messageStr);
                const mqttChatMessage: ChatMessagePayload = JSON.parse(messageStr) as ChatMessagePayload;
                const newChatMessage = {
                    name: mqttChatMessage.userHandle,
                    message: mqttChatMessage.message,
                    time: mqttChatMessage.time,
                    flag: mqttChatMessage.flag,
                    color: mqttChatMessage.color,
                    level: mqttChatMessage.level,
                    attr: mqttChatMessage.attr,
                    channel: mqttChatMessage.channel,

                    userId: mqttChatMessage.userId,
                    timedGuid48: mqttChatMessage.timedGuid48,
                    mqtt: true,
                    secure: false,
                };
                pushChatMessage(newChatMessage, true);




                console.debug("[MQTT]", "Chat message:", mqttChatMessage);
            }

        } catch (err) {
            console.warn("[MQTT]", "Error processing message on topic", topic, "with error", err);
            console.warn("[MQTT]", "Message content:", messageStr);
        }

    },


};
gt.lmcMqtt = lmcMqtt;


export function ensureLmcMqttLoaded() {
    if (atMostOnce("ensureLmcMqttLoaded")) {
        console.debug("ensureLmcMqttLoaded called.");
    }
}
gt.ensureLmcMqttLoaded = ensureLmcMqttLoaded;

export function lmcSendMqttVersionMessage() {
    const topicStr = CHANNEL_GUID_ROOT + "/" + CHANNEL_GUID_MOD_VER;
    const nowMillis = Date.now();
    const userDataObject = newUserDataPayload({ nowMillis });
    const versionDataObject = newModVersionPayload({ nowMillis });
    const payloadObject = {
        userId: userDataObject.userId,
        userData: userDataObject,
        versionData: versionDataObject,
    };
    const mqttPackage: LmcMqttPackage = {
        topic: topicStr,
        userId: userDataObject.userId,
        payloadString: JSON.stringify(payloadObject),
        options: newMqttPublishOptions({}),
    };
    lmcMqtt.sendPacketByUserId(mqttPackage);
}
gt.lmcSendMqttVersionMessage = lmcSendMqttVersionMessage;

export function lmcSendMqttBasicStateMessage() {
    const topic = CHANNEL_GUID_ROOT + "/" + CHANNEL_GUID_BASIC_STATE + "/" + getUserId();
    const nowMillis = Date.now();
    const userData = newUserDataPayload({ nowMillis });
    const userId = userData.userId;
    const basicState = newBasicStatePayload({});
    const payloadObject = {
        userId,
        userData,
        basicState,
    };
    const optionsObject = newMqttPublishOptions({});
    const mqttPackage = {
        userId,
        topic,
        payloadString: JSON.stringify(payloadObject),
        options: optionsObject
    };
    lmcMqtt.sendPacket(mqttPackage);
}
gt.lmcSendMqttBasicStateMessage = lmcSendMqttBasicStateMessage;

// export function lmcSendMqttChatMessage(chatMessage: ChatMessagePayload) {
//     let topic;
//     if (chatMessage.channel === "nds") {
//         topic = CHANNEL_GUID_ROOT + "/" + CHANNEL_GUID_NDS;
//     } else if (chatMessage.channel === "t1") {
//         topic = CHANNEL_GUID_ROOT + "/" + CHANNEL_GUID_TEST1;
//     }
//     else {
//         console.warn("[MQTT]", "lmcSendMqttChatMessage called with unsupported channel", chatMessage.channel);
//         return;
//     }


// }
// gt.lmcSendMqttChatMessage = lmcSendMqttChatMessage;