/** Recipient-only display metadata. Never mutation authority or a public projection. */
export interface GameSelfActions {
 schema_version:1;room_id:string;member_id:string;session_id:string|null;round_id:string|null;
 game_rev:number|null;room_rev:number;server_time:string;expires_at:string;
 session_actions:{pause:boolean;stop:boolean;abort:boolean;resume:boolean;advance:boolean;neutral_reset:boolean;neutral_reset_aborts_game:boolean};
 round_actions:{finish:boolean;skip:boolean;choose_truth:boolean;choose_dare:boolean;propose_condition:boolean;accept_invitation:boolean;accept_action:boolean;decline_invitation:boolean;withdraw_action:boolean};
}
export const selfActionsMaxAge=5000;
