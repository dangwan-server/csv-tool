import Container from "./lib/container";
import Conv from "./scripts/conv";
import GeneralGoHandle from "./scripts/generate_go";
import GeneralLuaHandle from "./scripts/generate_lua";
import OpenServer from "./scripts/open_server";
import PbHandle from "./scripts/pb";

const container = new Container();

container.register("conv", new Conv());
container.register("ggo", new GeneralGoHandle());
container.register("glua", new GeneralLuaHandle());
container.register("pb", new PbHandle());
container.register("open", new OpenServer());

export default container;
