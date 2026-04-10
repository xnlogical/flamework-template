import { Modding, OnStart, Service } from "@flamework/core";
import ProfileStore, { Profile } from "@rbxts/profile-store";
import { Replica, ReplicaServer } from "@rbxts/mad-replica";
import { Logger } from "@rbxts/log";
import { OnPlayerAdded, OnPlayerRemoving } from "./player";
import { PlayerData, DEFAULT_DATA, STORE_NAME, STORE_VERSION } from "shared/data";

export type DataContext = {
	player: Player;
	profile: Profile<PlayerData>;
	replica: Replica;
};

export interface OnDataLoaded {
	onDataLoaded(ctx: DataContext): void;
}

export interface OnDataUnloading {
	onDataUnloading(ctx: DataContext): void;
}

const PLAYER_DATA_TOKEN = ReplicaServer.Token("PlayerData");

@Service()
export class DataService implements OnStart, OnPlayerAdded, OnPlayerRemoving {
	private profileStore = ProfileStore.New<PlayerData>(`${STORE_NAME}_${STORE_VERSION}`, DEFAULT_DATA);

	private profiles = new Map<Player, Profile<PlayerData>>();
	private replicas = new Map<Player, Replica>();

	private onLoad = new Set<OnDataLoaded>();
	private onUnload = new Set<OnDataUnloading>();

	public constructor(private readonly logger: Logger) {}

	public onStart(): void {
		Modding.onListenerAdded<OnDataLoaded>((l) => this.onLoad.add(l));
		Modding.onListenerAdded<OnDataUnloading>((l) => this.onUnload.add(l));

		Modding.onListenerRemoved<OnDataLoaded>((l) => this.onLoad.delete(l));
		Modding.onListenerRemoved<OnDataUnloading>((l) => this.onUnload.delete(l));

		for (const [player, profile] of this.profiles) {
			this.onLoad.forEach((l) =>
				l.onDataLoaded({
					player: player,
					profile: profile,
					replica: this.replicas.get(player)!,
				}),
			);
		}
	}

	public onPlayerAdded(player: Player): void {
		if (player.UserId < 0) this.logger.Warn("Test account detected");

		const profile = this.profileStore.StartSessionAsync(`player_${player.UserId}`, {
			Cancel: () => player.Parent !== game.GetService("Players"),
		});

		if (profile !== undefined) {
			profile.AddUserId(player.UserId);
			profile.Reconcile();

			profile.OnSessionEnd.Connect(() => {
				this.onUnload.forEach((l) =>
					l.onDataUnloading({
						player: player,
						profile: profile,
						replica: this.replicas.get(player)!,
					}),
				);

				this.replicas.delete(player);
				this.profiles.delete(player);

				this.logger.Info(`Profile session terminated for ${player.Name}`);

				player.Kick("Profile session terminated - please rejoin");
			});

			if (player.Parent === game.GetService("Players")) {
				const replica = ReplicaServer.New({
					Token: PLAYER_DATA_TOKEN,
					Data: profile.Data,
				});

				replica.Replicate();

				this.profiles.set(player, profile);
				this.replicas.set(player, replica);

				this.onLoad.forEach((l) =>
					task.spawn(() =>
						l.onDataLoaded({
							player: player,
							profile: profile,
							replica: replica,
						}),
					),
				);

				this.logger.Info(`Loaded profile for ${player.Name}`);
			} else {
				profile.EndSession();
			}
		} else {
			player.Kick("Failed to load profile - please rejoin");
			this.logger.Warn(`Failed to load profile for ${player.Name}`);
		}
	}

	public onPlayerRemoving(player: Player): void {
		const profile = this.profiles.get(player);
		if (profile) profile.EndSession();
	}

	public getProfile(player: Player): Profile<PlayerData> | undefined {
		return this.profiles.get(player);
	}

	public getReplica(player: Player): Replica | undefined {
		return this.replicas.get(player);
	}
}
