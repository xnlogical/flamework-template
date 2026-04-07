import { Controller, Modding, OnStart } from "@flamework/core";
import { Logger } from "@rbxts/log";
import { Replica, ReplicaClient } from "@rbxts/mad-replica";

export interface OnReplicaAdded {
    onReplicaAdded(replica: Replica): void;
}

@Controller()
export class DataController implements OnStart {
    private replica?: Replica;
    private onAdded = new Set<OnReplicaAdded>();

    public constructor(private readonly logger: Logger) {}

    public onStart(): void {
        Modding.onListenerAdded<OnReplicaAdded>((l) => this.onAdded.add(l));
        Modding.onListenerRemoved<OnReplicaAdded>((l) => this.onAdded.delete(l));

        const replica = this.replica;
        if (replica) this.onAdded.forEach((l) => l.onReplicaAdded(replica));

        ReplicaClient.OnNew("PlayerData", (replica) => {
            this.replica = replica;
            this.logger.Info("Client replica received");
        });

        ReplicaClient.RequestData();
    }
}
