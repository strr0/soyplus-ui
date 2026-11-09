import { defineComponent, h } from 'vue';
import type { Component } from 'vue';

interface Options {
  name?: string;
}

/**
 * Create a component with the custom name by the async component loader
 *
 * The routes from the backend use its own name, which is not equal to the name of the view component. The
 * `keep-alive` of vue works by the component name, so we need to wrap the view component by this tool to make the
 * component name equal to the route name
 *
 * thanks for @fourteendp, see https://github.com/vbenjs/vue-vben-admin/issues/3927
 *
 * @param loader The async component loader
 * @param options The options of the created component
 */
export function createCustomNameComponent(loader: () => Promise<any>, options: Options = {}): () => Promise<Component> {
  const { name } = options;
  let component: Component | null = null;
  let wrappedComponent: Component | null = null;

  async function load() {
    try {
      const { default: loadedComponent } = await loader();
      component = loadedComponent;
    } catch (error) {
      console.error(`Cannot resolve component ${name}, error:`, error);
    }
  }

  return async () => {
    if (!component) {
      await load();
    }

    if (!wrappedComponent) {
      wrappedComponent = defineComponent({
        name,
        render() {
          return h(component as Component);
        }
      });
    }

    return Promise.resolve(wrappedComponent);
  };
}
