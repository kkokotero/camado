import { BaseComponent, Component } from "neptune/core";
import { H1 } from "neptune/html";

@Component({ selector: "app-component" })
class AppComponent extends BaseComponent {
  protected override render() {
    return H1("Hello, World!");
  }
}

export default AppComponent.component();
