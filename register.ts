import Container from "./lib/container";
import Conv from "./scripts/conv";
import GeneralGoHandle from "./scripts/generate_go";

const container = new Container();

container.register("conv", new Conv());
container.register("ggo", new GeneralGoHandle());

export default container;
