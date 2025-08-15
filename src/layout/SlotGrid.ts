import type { Slot, LayoutConfig, Anchor } from './types';

export class SlotGrid {
  private slots: Map<string, Slot> = new Map();
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  // Generate slots for a single anchor (single and dual column)
  generateSlotsForAnchor(anchor: Anchor): Slot[] {
    const slots: Slot[] = [];
    const { timelineY, cardConfigs, columnSpacing, rowSpacing } = this.config;
    
    // Calculate slots per side based on viewport height
    const availableHeightPerSide = (this.config.viewportHeight / 2) - 50; // Leave margin
    const slotsPerSide = Math.floor(availableHeightPerSide / (cardConfigs.full.height + rowSpacing));
    
    // Single column slots (column 0)
    this.generateColumnSlots(slots, anchor, 0, slotsPerSide, timelineY, rowSpacing);
    
    // Dual column slots if there's horizontal space
    if (this.hasHorizontalSpaceForDualColumns(anchor)) {
      // Left column (-1)
      this.generateColumnSlots(slots, anchor, -1, slotsPerSide, timelineY, rowSpacing);
      // Right column (+1)  
      this.generateColumnSlots(slots, anchor, 1, slotsPerSide, timelineY, rowSpacing);
    }

    // Register slots in grid
    slots.forEach(slot => {
      const key = this.getSlotKey(slot);
      this.slots.set(key, slot);
    });

    return slots;
  }

  private generateColumnSlots(
    slots: Slot[], 
    anchor: Anchor, 
    column: number, 
    slotsPerSide: number,
    timelineY: number,
    rowSpacing: number
  ) {
    const columnOffset = column * (this.config.cardConfigs.full.width + this.config.columnSpacing);
    const baseX = anchor.x + columnOffset;

    // Above timeline slots
    for (let i = 0; i < slotsPerSide; i++) {
      slots.push({
        x: baseX,
        y: timelineY - (i + 1) * (this.config.cardConfigs.full.height + rowSpacing),
        column,
        side: 'above',
        occupied: false,
        clusterId: anchor.id
      });
    }

    // Below timeline slots
    for (let i = 0; i < slotsPerSide; i++) {
      slots.push({
        x: baseX,
        y: timelineY + (i + 1) * (this.config.cardConfigs.full.height + rowSpacing),
        column,
        side: 'below',
        occupied: false,
        clusterId: anchor.id
      });
    }
  }

  private hasHorizontalSpaceForDualColumns(anchor: Anchor): boolean {
    const requiredWidth = this.config.cardConfigs.full.width * 2 + this.config.columnSpacing;
    const leftEdge = anchor.x - requiredWidth / 2;
    const rightEdge = anchor.x + requiredWidth / 2;
    
    return leftEdge >= 0 && rightEdge <= this.config.viewportWidth;
  }

  // Find next available slot in cluster
  findNextAvailableSlot(clusterId: string): Slot | null {
    for (const [key, slot] of this.slots) {
      if (slot.clusterId === clusterId && !slot.occupied) {
        return slot;
      }
    }
    return null;
  }

  // Occupy a slot
  occupySlot(slot: Slot): void {
    slot.occupied = true;
    const key = this.getSlotKey(slot);
    this.slots.set(key, slot);
  }

  // Release a slot
  releaseSlot(slot: Slot): void {
    slot.occupied = false;
    const key = this.getSlotKey(slot);
    this.slots.set(key, slot);
  }

  // Get all slots for a cluster
  getSlotsForCluster(clusterId: string): Slot[] {
    return Array.from(this.slots.values()).filter(slot => slot.clusterId === clusterId);
  }

  // Get available slots count for cluster
  getAvailableSlotsCount(clusterId: string): number {
    return this.getSlotsForCluster(clusterId).filter(slot => !slot.occupied).length;
  }

  // Clear all slots
  clear(): void {
    this.slots.clear();
  }

  // Get slot utilization stats
  getUtilization() {
    const totalSlots = this.slots.size;
    const usedSlots = Array.from(this.slots.values()).filter(slot => slot.occupied).length;
    
    return {
      totalSlots,
      usedSlots,
      percentage: totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0
    };
  }

  private getSlotKey(slot: Slot): string {
    return `${slot.clusterId}-${slot.column}-${slot.side}-${slot.x}-${slot.y}`;
  }

  // Debug: Get all slots
  getAllSlots(): Slot[] {
    return Array.from(this.slots.values());
  }
}