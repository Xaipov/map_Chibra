import source from "./imported_map.json";
import type { BlockData, BlockRawData } from "@/types/block";
import type { TransitionData } from "@/types/transition";

type ImportedSource = {
  blocks: Array<{ id: number; data: BlockRawData }>;
  transitions: TransitionData[];
};

const importedSource = source as ImportedSource;

export const importedBlocks: BlockData[] = importedSource.blocks.map(({ id, data }) => ({
  ...data,
  id,
}));

export const importedTransitions = importedSource.transitions;
