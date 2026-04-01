export function createRegistry(kind) {
  const items = new Map();

  return {
    kind,
    register(item) {
      if (!item?.name) {
        throw new Error(`Cannot register ${kind} without a name.`);
      }

      if (items.has(item.name)) {
        throw new Error(`Duplicate ${kind} registration: ${item.name}`);
      }

      items.set(item.name, item);
      return item;
    },
    get(name) {
      return items.get(name);
    },
    list() {
      return Array.from(items.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    },
  };
}
