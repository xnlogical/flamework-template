import { Controller, Modding, OnStart } from "@flamework/core";
import { Logger } from "@rbxts/log";
import { Replica, ReplicaClient } from "@rbxts/mad-replica";

export interface OnReplicaAdded {
	onReplicaAdded(replica: Replica): void;
}

@Controller()
export class DataController implements OnStart {
	private replica?: Replica;

	public constructor(private readonly logger: Logger) {}

	public onStart(): void {
		const onAdded = new Set<OnReplicaAdded>();

		Modding.onListenerAdded<OnReplicaAdded>((l) => {
			if (this.replica) l.onReplicaAdded(this.replica);
			else onAdded.add(l);
		});

		Modding.onListenerRemoved<OnReplicaAdded>((l) => onAdded.delete(l));

		ReplicaClient.OnNew("PlayerData", (replica) => {
			onAdded.forEach((l) => l.onReplicaAdded(replica));

			this.replica = replica;
			this.logger.Info("Client replica received");
		});

		ReplicaClient.RequestData();
	}

	public getReplica(): Replica | undefined {
		return this.replica;
	}
}
