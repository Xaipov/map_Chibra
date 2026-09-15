import type { TransitionRepository } from "@/repository/transition/repo";
import type { TransitionData, TransitionId } from "@/types/transition";
import type { TransitionsStore } from "@/stores/transitions";
import { importedTransitions } from "@/repository/importedMap";

export class MockTransitionRepository implements TransitionRepository {
  private store!: TransitionsStore;
  private nextId = 1;

  async init(store: TransitionsStore): Promise<void> {
    this.store = store;
    store.transitions = importedTransitions.map((transition) => ({ ...transition }));
    this.nextId = Math.max(0, ...store.transitions.map(({ id }) => id)) + 1;
  }

  destroy(): void {}

  async addTransition(data: Omit<TransitionData, "id">): Promise<TransitionData> {
    const newTransition: TransitionData = {
      ...data,
      id: this.nextId++,
    };
    this.store.transitions.push(newTransition);
    return newTransition;
  }

  async removeTransition(transitionId: TransitionId): Promise<void> {
    this.store.transitions = this.store.transitions.filter((t) => t.id !== transitionId);
  }
}
