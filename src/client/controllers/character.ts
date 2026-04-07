import { Players } from "@rbxts/services";
import { Controller, Modding, OnStart } from "@flamework/core";

export interface OnCharacterAdded {
    onCharacterAdded(character: Model): void;
}

export interface OnCharacterRemoving {
    onCharacterRemoving(character: Model): void;
}

@Controller()
export class CharacterController implements OnStart {
    public onStart(): void {
        const onAdd = new Set<OnCharacterAdded>();
        const onRemove = new Set<OnCharacterRemoving>();

        Modding.onListenerAdded<OnCharacterAdded>((l) => onAdd.add(l));
        Modding.onListenerAdded<OnCharacterRemoving>((l) => onRemove.add(l));

        Modding.onListenerRemoved<OnCharacterAdded>((l) => onAdd.delete(l));
        Modding.onListenerRemoved<OnCharacterRemoving>((l) => onRemove.delete(l));

        const player = Players.LocalPlayer;
        const character = player.Character;

        if (character) onAdd.forEach((l) => l.onCharacterAdded(character));

        player.CharacterAdded.Connect((character) => {
            onAdd.forEach((l) => l.onCharacterAdded(character));
        });

        player.CharacterRemoving.Connect((character) => {
            onRemove.forEach((l) => l.onCharacterRemoving(character));
        });
    }
}
