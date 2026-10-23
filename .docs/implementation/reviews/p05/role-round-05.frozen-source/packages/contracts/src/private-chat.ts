/** Additive P05 private transport; never part of a public room/game projection. */
export interface PrivateChatSend {request_id:string;text:string}
export interface PrivateChatReceipt {request_id:string;message_id:string;chat_rev:number;expires_at:string}
export interface PrivateChatMessage {message_id:string;sender_member_id:string;text:string;sent_at:string;expires_at:string}
export interface PrivateChatView {session_id:string;round_id:string;chat_rev:number;expires_at:string;messages:PrivateChatMessage[]}
export const privateChatLimits={messageScalars:1000,messageBytes:4096,buffer:32,perMinute:12,perRound:128,ttl:300000,activeScopes:1024} as const;
