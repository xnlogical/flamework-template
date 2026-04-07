import { Players } from "@rbxts/services";
import { Modding, OnStart, Service } from "@flamework/core";

export interface OnPlayerAdded {
    onPlayerAdded(player: Player): void;
}

export interface OnPlayerRemoving {
    onPlayerRemoving(player: Player): void;
}

@Service()
export class PlayerService implements OnStart {
    public onStart(): void {
        const onAdd = new Set<OnPlayerAdded>();
        const onRemove = new Set<OnPlayerRemoving>();

        Modding.onListenerAdded<OnPlayerAdded>((l) => onAdd.add(l));
        Modding.onListenerAdded<OnPlayerRemoving>((l) => onRemove.add(l));

        Modding.onListenerRemoved<OnPlayerAdded>((l) => onAdd.delete(l));
        Modding.onListenerRemoved<OnPlayerRemoving>((l) => onRemove.delete(l));

        for (const player of Players.GetPlayers()) {
            onAdd.forEach((l) => l.onPlayerAdded(player));
        }

        Players.PlayerAdded.Connect((player) => {
            onAdd.forEach((l) => l.onPlayerAdded(player));
        });

        Players.PlayerRemoving.Connect((player) => {
            onRemove.forEach((l) => l.onPlayerRemoving(player));
        });
    }
}
