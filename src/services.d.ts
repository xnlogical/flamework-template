import { PlayerData } from "shared/data";

declare global {
    interface Replicas {
        PlayerData: {
            Data: PlayerData;
            Tags: {
                UserId: number;
            };
        };
    }
}

export {};
