import { mockApi } from "./mock/mock-api";
import type { Api, DebugApi } from "./contract";
import { getQueryClient } from "./query-client";

const READS = /^(get|list|lookUp|session)/;

function withCacheInvalidation<T extends object>(implementation: T): T {
  return new Proxy(implementation, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (
        typeof value !== "function" ||
        typeof property !== "string" ||
        READS.test(property)
      ) {
        return value;
      }

      return async (...args: unknown[]) => {
        const result = await value.apply(target, args);
        if (typeof window !== "undefined") {
          const client = getQueryClient();
          client.removeQueries({ queryKey: ["so-chamar"], type: "inactive" });
          await client.invalidateQueries({ queryKey: ["so-chamar"] });
        }
        return result;
      };
    },
  });
}

export const api: Api = withCacheInvalidation<Api>(mockApi);

export const debug: DebugApi = withCacheInvalidation<DebugApi>(mockApi);

export * from "./contract";
