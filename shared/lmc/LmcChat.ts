
import { getUserId } from "./CiScripts";
import { CHANNEL_GUID_NDS, CHANNEL_GUID_ROOT, CHANNEL_GUID_TEST1, CHANNEL_GUID_TEST2 } from "./LmcConstsEarly";
import { OnBeforeChatMessageSend, BeforeChatMessageSendEvent } from "./LmcEvents";
import { addSystemMessageSafe, getUserSafe, showToastSafe } from "./LmcScriptsShared";
import { ChatMessagePayload, LmcMqttPackage, newMqttPublishOptions, newUserDataPayload } from "./LmcMqttTypes";
import { atMostOnce, newTimedGuid48 } from "./MiscFuncs";
import { lmcMqtt } from "./LmcMqtt";
import { ChatAttributes, UserAttributes } from "../utilities/Database";

const gt = globalThis as any;
(globalThis as any).temp = (globalThis as any).temp + Math.random();

OnBeforeChatMessageSend.on((event) => {
    if (event.channel === "nds" || event.channel === "t1") {
        //addSystemMessageSafe(`Blocked message ${e.chat} to channel ${e.channel} `);
        event.blockSending = true;
        lmcChat.maybeRedirectChatMessage({ event });
    }
});

export function ensureLmcChatLoaded() {
    if (atMostOnce("ensureLmcChatLoaded")) {
        console.debug("ensureLmcChatLoaded called.");
    }
}
gt.ensureLmcChatLoaded = ensureLmcChatLoaded;

export const lmcChat = {

    maybeRedirectChatMessage({ event }: { event: BeforeChatMessageSendEvent }) {
        //console.debug("[LmcChat]", "lmcChat.maybeRedirectChatMessage called", JSON.stringify(event));

        const channel = String(event.channel);
        const chatLine = event.chat.trim();
        if (channel !== "nds" && channel !== "t1") {
            // not a special channel, do nothing and let the game handle it
            event.blockSending = false;
            return;
        } else if (chatLine.startsWith("/")) {
            // it's a command, do nothing and let the game handle it
            event.blockSending = false;
            return;
        }

        event.blockSending = true;

        const user = getUserSafe();
        const userAttrs = user?.attr || 0;
        const chatAttrs = ((userAttrs & UserAttributes.Mod) ? ChatAttributes.Mod : 0) | ((userAttrs & UserAttributes.DLC1) ? ChatAttributes.Supporter : 0);
        const chatMessagePayload: ChatMessagePayload = {
            channel: channel,
            message: chatLine,
            userHandle: user?.handle,
            userId: user?.userId,
            time: event.timeMillis,
            flag: user?.flag,
            level: user?.level,
            attr: chatAttrs,
            color: user?.color,
        }

        const mqttPackage: LmcMqttPackage = {
            // @ts-ignore
            topic: CHANNEL_GUID_ROOT + "/" + this.mapCustomChannelToGuid(channel),
            timedGuid48: newTimedGuid48(event.timeMillis),
            payloadString: JSON.stringify(chatMessagePayload),
            options: newMqttPublishOptions(),
        };

        lmcMqtt.sendPacketByTimedGuid48(mqttPackage);
    },

    mapCustomChannelToGuid(channel: string | null): string | null {
        if (channel == "nds") {
            return CHANNEL_GUID_NDS;
        } else if (channel == "t1") {
            return CHANNEL_GUID_TEST1;
        } else if (channel == "t2") {
            return CHANNEL_GUID_TEST2;
        } else {
            return null;
        }
    },

    mapGuidToCustomChannel(guid: string | null): string | null {
        if (guid == CHANNEL_GUID_NDS) {
            return "nds";
        } else if (guid == CHANNEL_GUID_TEST1) {
            return "t1";
        } else if (guid == CHANNEL_GUID_TEST2) {
            return "t2";
        } else {
            return null;
        }
    },

};
gt.lmcChat = lmcChat;
