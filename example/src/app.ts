import { BaseComponent, Component } from "miora/core";
import { H1 } from "miora/html";

@Component({ selector: "app-component" })
class AppComponent extends BaseComponent {
  protected override render() {
    return H1("Hello, World!");
  }
}

export default AppComponent.component();
