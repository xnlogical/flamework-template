import { Flamework, Modding, OnStart, Reflect } from "@flamework/core";
import Log, { Logger } from "@rbxts/log";

Log.SetLogger(Logger.configure().WriteTo(Log.RobloxOutput()).Create());

Modding.registerDependency<Logger>((ctor) => Log.ForContext(ctor));
Modding.onListenerAdded<OnStart>((object) => {
    if (Reflect.getMetadata<boolean>(object, "flamework:singleton"))
        Log.Info(`Start ${Reflect.getMetadata<string>(object, "identifier")}`);
});

Flamework.addPaths("src/server/components");
Flamework.addPaths("src/server/services");
Flamework.addPaths("src/shared/components");

Flamework.ignite();
