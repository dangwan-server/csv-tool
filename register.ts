import Container from "./lib/container";
import Conv from "./scripts/conv";
import GeneralGoHandle from "./scripts/generate_go";
import GeneralLuaHandle from "./scripts/generate_lua";

const container = new Container();

container.register("conv", new Conv());
container.register("ggo", new GeneralGoHandle());
container.register("glua", new GeneralLuaHandle());

export default container;
